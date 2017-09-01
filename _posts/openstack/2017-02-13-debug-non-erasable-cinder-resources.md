---
layout: post
title: "Debugging non-erasable Cinder resources"
date: 2017-02-13
categories: openstack
---

* content
{:toc}

## Introduction

Cinder의 백엔드로 Ceph을 사용할 경우, Ceph RBD 이미지들의 COW 관계로 인해 Cinder 볼륨과 스냅샷들이 삭제가 잘 안 되는 경우가 있다.
일반적으로 Cinder API로 디펜던시 순서에 따라 삭제를 진행하면 되는데, 오류로 인해 Cinder API로는 처리가 불가능 할 수 있다.

아래는 알 수 없는 이유로 인해, 스냅샷과 볼륨 둘 다 삭제할 수 없는 상황을 해결하는 예제이다.


## Example

**Step 1.** Ceph 명령어로 지워지지 않는 볼륨 및 스냅샷에 대한 정보를 확인한다.

```bash
root@controller:~] rbd ls volumes | grep c893ec84-e869-4424-a10c-7b3a28013e04
volume-893ec84-e869-4424-a10c-7b3a28013e04

root@controller:~] rbd info volumes/volume-c893ec84-e869-4424-a10c-7b3a28013e04
rbd image 'volume-c893ec84-e869-4424-a10c-7b3a28013e04':
	size 200 GB in 51200 objects
	order 22 (4096 kB objects)
	block_name_prefix: rbd_data.3a97a8238e1f29
	format: 2
	features: layering
	flags:

root@controller:~] rbd snap ls volumes/volume-c893ec84-e869-4424-a10c-7b3a28013e04
SNAPID NAME                                            SIZE
   173 snapshot-e232b3fe-8dc9-4f84-8c89-b328c5419270 200 GB

root@controller:~] rbd children volumes/volume-c893ec84-e869-4424-a10c-7b3a28013e04@snapshot-e232b3fe-8dc9-4f84-8c89-b328c5419270
volumes/volume-3340ae54-a3ad-416f-95aa-1979596abded.deleted

root@controller:~] rbd info volumes/volume-3340ae54-a3ad-416f-95aa-1979596abded.deleted
rbd image 'volume-3340ae54-a3ad-416f-95aa-1979596abded.deleted':
	size 200 GB in 51200 objects
	order 22 (4096 kB objects)
	block_name_prefix: rbd_data.3cd96546e4d805
	format: 2
	features: layering, striping
	flags:
	parent: volumes/volume-c893ec84-e869-4424-a10c-7b3a28013e04@snapshot-e232b3fe-8dc9-4f84-8c89-b328c5419270
	overlap: 200 GB
	stripe unit: 4096 kB
	stripe count: 1
```

즉, 아래와 같은 체인 관계를 나타내고 있음을 알 수 있다.

```
volume-893ec84-e869-4424-a10c-7b3a28013e04 <- Cinder 볼륨
  - (snap) snapshot-e232b3fe-8dc9-4f84-8c89-b328c5419270  <- COW용 스냅샷
    - volume-3340ae54-a3ad-416f-95aa-1979596abded.deleted <- Cinder 스냅샷의 실제 볼륨
```

---

**Step 2.** flatten 명령어로 COW 관계를 끊는다.

```bash
root@controller:~] rbd flatten volumes/volume-3340ae54-a3ad-416f-95aa-1979596abded.deleted
Image flatten: 100% complete...done.
```

---

**Step 3.** flatten 이 후, Cinder API로 스냅샷 삭제를 시도해본다.

그러나 Cinder 로그에 아래와 같은 내용을 남기며 실패한다.
volumes/volume-3340ae54-a3ad-416f-95aa-1979596abded.deleted 가 여전히 상위 COW용 스냅샷과 관계를 맺고 있다고 로그를 남기고 있다.

```
cinder-volume: 2017-02-02 01:25:07.089903 7f459f63d740 -1 librbd: snap_unprotect: can't unprotect; at least 1 child(ren) in pool volumes
Image volumes/volume-3340ae54-a3ad-416f-95aa-1979596abded.deleted is dependent on the snapshot snapshot-e232b3fe-8dc9-4f84-8c89-b328c5419270.
```

Ceph 명령어로 확인 결과, 여전히 child 관계에 있음을 알 수 있다.

```bash
root@controller:~] rbd children volumes/volume-c893ec84-e869-4424-a10c-7b3a28013e04@snapshot-e232b3fe-8dc9-4f84-8c89-b328c5419270
volumes/volume-3340ae54-a3ad-416f-95aa-1979596abded.deleted
```

flatten을 했음에도 child 관계에 있다는 뜻은, 하위 볼륨이 별도의 스냅샷을 가지고 있음을 의미한다.

> [ceph-users mailing list - After flattening the children image, snapshot still can not be unprotected](http://lists.ceph.com/pipermail/ceph-users-ceph.com/2015-November/006218.html)

---

**Step 4.** 하위 볼륨의 스냅샷 정보를 확인해본다.

```bash
root@controller:~] rbd snap ls volumes/volume-3340ae54-a3ad-416f-95aa-1979596abded.deleted
SNAPID NAME                                                     SIZE
   174 volume-0b532706-8ee9-4832-9654-590a2b2ab766.clone_snap 200 GB

root@controller:~] rbd children volumes/volume-3340ae54-a3ad-416f-95aa-1979596abded.deleted@volume-0b532706-8ee9-4832-9654-590a2b2ab766.clone_snap
(없음)
```

Cinder 리소스에 등록되어있지 않는, 용도를 알 수 없는 스냅샷이 존재하고 있다.
Cinder 스냅샷 생성 도중, 실패한 뒤 롤백되지 않고 그대로 남아있는 이미지로 추측된다.

최종적으로 아래와 같은 체인 관계를 나타내고 있다.

```
volume-893ec84-e869-4424-a10c-7b3a28013e04 <- Cinder 볼륨
  - (snap) snapshot-e232b3fe-8dc9-4f84-8c89-b328c5419270  <- COW용 스냅샷
    - volume-3340ae54-a3ad-416f-95aa-1979596abded.deleted <- Cinder 스냅샷의 실제 볼륨
      - (snap) volume-0b532706-8ee9-4832-9654-590a2b2ab766.clone_snap <- 생성 도중 실패한 상태로 남아있는 스냅샷
```

---

**Step 5.** Ceph 명령어로 하위 볼륨의 스냅샷을 강제 삭제한다.

```bash
root@controller:~] rbd snap unprotect volumes/volume-3340ae54-a3ad-416f-95aa-1979596abded.deleted@volume-0b532706-8ee9-4832-9654-590a2b2ab766.clone_snap
root@controller:~] rbd snap rm volumes/volume-3340ae54-a3ad-416f-95aa-1979596abded.deleted@volume-0b532706-8ee9-4832-9654-590a2b2ab766.clone_snap

root@controller:~] rbd children volumes/volume-c893ec84-e869-4424-a10c-7b3a28013e04@snapshot-e232b3fe-8dc9-4f84-8c89-b328c5419270
(없음)
```

스냅샷의 Protect 해제 -> 삭제 이 후, 상위 스냅샷과 하위 볼륨과의 child 관계가 끊어짐을 알 수 있다.

---

**Step 6.** Cinder API로 스냅샷과 볼륨을 삭제해본다.

오류 상태의 체인 관계를 끊었으므로 정상적으로 삭제됨을 볼 수 있다.
