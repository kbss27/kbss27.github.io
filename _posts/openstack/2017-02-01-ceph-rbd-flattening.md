---
layout: post
title: "Ceph RBD Flattening"
date: 2017-02-01
categories: openstack
---

* content
{:toc}

## Introduction

> Ceph은 RBD 이미지라는 단어를 사용하는 것에 주의.

Glance 이미지를 통해 Nova 볼륨이나 Cinder 볼륨을 생성하였을 경우, Nova/Cinder 볼륨들을 지우기 전까지는 이미지를 삭제할 수 없다.
아래와 같은 Glance 로그를 확인할 수 있다.

```
- librbd: snap_unprotect: can't unprotect; at least 1 child(ren) in pool volumes
- Snap Operating Exception error unprotecting snapshot c24232fe-095d-40c0-a0c3-eac589fc078b@snap Snapshot is in use.
- Image c24232fe-095d-40c0-a0c3-eac589fc078b could not be deleted because it is in use:
    The image cannot be deleted because it is in use through the backend store outside of Glance.
```

이는 Nova/Cinder로 생성된 RBD 이미지가 Glacne 이미지의 RBD 이미지를 참조하고 있기 때문이다.
이를 간단히 나타내면 아래와 같다.

- Parent: Glance 이미지
    - Child 1: 이미지로 생성한 인스턴스의 Nova 볼륨
    - Child 2: 이미지로 생성한 Cinder 볼륨
        - Child-Child 1: 해당 Cinder 볼륨으로 생성한 스냅샷 볼륨
        - Child-Child 2: 해당 Cinder 볼륨으로 생성한 백업 볼륨
        - ...
    - ...

Parent를 삭제하기 위해서는 Parent와 Child와의 관계를 끊어야 한다.
Parent의 내용이 Child로 Merge되어야 하며, Ceph에서는 FLATTENING 이라고 한다.

아래는 Glance 이미지에 물려있는 Cinder 볼륨을 FLATTENING 하고 이미지를 지우는 예제이다.


## Example

Step 1. 삭제할려는 Glance 이미지 정보를 본다.

```bash
root@controller001:~] glance image-show c24232fe-095d-40c0-a0c3-eac589fc078b
+------------------+----------------------------------------------------------------------------------+
| Property         | Value                                                                            |
+------------------+----------------------------------------------------------------------------------+
| direct_url       | rbd://0fa8f4e1-0361-45d4-b91c-4d45a224783e/images/c24232fe-095d-                 |
|                  | 40c0-a0c3-eac589fc078b/snap                                                      |
| id               | c24232fe-095d-40c0-a0c3-eac589fc078b                                             |
| image_location   | snapshot                                                                         |
| image_state      | available                                                                        |
| image_type       | snapshot                                                                         |
| instance_uuid    | 1d015362-ee73-4c3c-8b05-ee1ed51f5ff9                                             |
+------------------+----------------------------------------------------------------------------------+
```

direct_url에 ```images/c24232fe-095d-40c0-a0c3-eac589fc078b/snap``` 가 출력되는데

- images: Ceph의 images 풀에 있는 것을 의미
- c24232fe-095d-40c0-a0c3-eac589fc078b: RBD 이미지 이름을 의미
- snap: 해당 RBD 이미지의 스냅샷 이름을 의미

RBD 스냅샷을 생성하는 이유는, Ceph은 Copy-On-Write 복제본 생성을 하는데 있어서
Read-Only 스냅샷을 먼저 생성한 뒤 해당 스냅샷을 Clone한다. Clone된 이미지가 결국 Child 이미지이다.

![Ceph COW Clone of Snapshot](/media/openstack/ceph_cow_clone_of_snapshot.png)


Step 2. RBD 이미지 정보와 스냅샷 정보를 본다.

```bash
root@controller001:~] rbd info images/c24232fe-095d-40c0-a0c3-eac589fc078b
rbd image 'c24232fe-095d-40c0-a0c3-eac589fc078b':
	size 40960 MB in 5120 objects
	order 23 (8192 kB objects)
	block_name_prefix: rbd_data.9b9ec956147627
	format: 2
	features: layering, striping
	flags:
	stripe unit: 8192 kB
	stripe count: 1

root@controller001:~] rbd snap ls images/c24232fe-095d-40c0-a0c3-eac589fc078b
SNAPID NAME     SIZE
   324 snap 40960 MB
```

즉, 최종 Parent URL은 ```images/c24232fe-095d-40c0-a0c3-eac589fc078b@snap``` 이다.


Step 3. Parent URL에 물려있는 Child 이미지들을 본다.

```bash
root@controller001:~] rbd children images/c24232fe-095d-40c0-a0c3-eac589fc078b@snap
volumes/volume-9d457f73-1985-4dfa-b367-00d2149cd2ab

root@controller001:~] rbd info volumes/volume-9d457f73-1985-4dfa-b367-00d2149cd2ab
rbd image 'volume-9d457f73-1985-4dfa-b367-00d2149cd2ab':
	size 40960 MB in 10240 objects
	order 22 (4096 kB objects)
	block_name_prefix: rbd_data.9b9fce43b8b91a
	format: 2
	features: layering, striping
	flags:
	parent: images/c24232fe-095d-40c0-a0c3-eac589fc078b@snap
	overlap: 40960 MB
	stripe unit: 4096 kB
	stripe count: 1
```

Ceph의 volumes 풀에 있는 Cinder 볼륨으로 사용되는 이미지 하나가 물려있는 것을 볼 수 있다.
이 Child 이미지는 이전에 확인한 Parent 이미지를 가리키고 있는 것을 볼 수 있다.


Step 4. Child 이미지를 FLATTENING 한다.

```bash
root@controller001:~] rbd flatten volumes/volume-9d457f73-1985-4dfa-b367-00d2149cd2ab
Image flatten: 100% complete...done.

root@controller001:~] rbd info volumes/volume-9d457f73-1985-4dfa-b367-00d2149cd2ab
rbd image 'volume-9d457f73-1985-4dfa-b367-00d2149cd2ab':
	size 40960 MB in 10240 objects
	order 22 (4096 kB objects)
	block_name_prefix: rbd_data.9b9fce43b8b91a
	format: 2
	features: layering, striping
	flags:
	stripe unit: 4096 kB
	stripe count: 1
```

FLATTENING 중에도 해당 볼륨을 사용하는 VM의 I/O는 지속된다.

FLATTENING 완료 이후 Parent 정보가 사라짐을 볼 수 있으며, Glance에서 삭제 또한 가능하다.


## References

[SNAPSHOTS - Ceph Docs](http://docs.ceph.com/docs/hammer/rbd/rbd-snapshot/)
