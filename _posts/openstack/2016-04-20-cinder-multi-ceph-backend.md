---
layout: post
title: "Ceph Multi-Pool and Cinder Multi-Backend"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

## Intro

OpenStack 클러스터 내에 Ceph 클러스터를 여러개 물리거나, SSD/HDD 종류에 따라 서로 다른 Ceph Pool을 사용하고자 하는 경우가 있다.
특히 후자의 경우는 물리 디스크 스펙에 따라 VM이 사용할 수 있는 스토리지 Tier를 나누고자 여러개의 Pool을 생성했을 것이다.
이 문서에서는 여러개의 Ceph Pool을 Cinder에 물리고, Pool 별로 Volume Type을 생성하는 방법을 가이드한다.

현재 환경은 다음과 같다.

- Persistence용 Ceph Pool의 이름은 ```volumes``` 이며, 1개만 존재한다.
- Cinder 또한 Persistence용으로 ```RBD-backend``` 백엔드 이름으로 ```volumes``` Pool을 물고 있다.
- Cinder는 ```volumes``` 이름의 CephX 유저로 ```volumes``` Pool에 접근하고 있다.
- ```volumes_ceph``` 이름의 Cinder 볼륨 타입이 ```RBD-backend``` 백엔드를 물고 있다.

진행할 내용은 다음과 같다.

- ```volumes-ssd``` 라는 Ceph Pool을 1개 더 만든다.
- Cinder가 ```RBD-ssd``` 백엔드 이름으로 ```volumes-ssd``` Pool을 물게 한다.
- Cinder가  ```volumes``` 이름의 CephX 유저로 ```volumes-ssd``` Pool에 접근할 수 있게 한다.
- ```volumes_ssd``` 이름의 Cinder 볼륨 타입을 만들고 ```RBD-ssd``` 백엔드를 물게 한다.


## 설정

### Ceph Pool 생성 및 인증 설정

```bash
# Usage: ceph osd pool create {pool-name} {pg-num}
root@controller001:~# ceph osd pool create volumes-ssd 64
pool 'volumes-ssd' created

# volumes CephX 유저가 volumes-ssd Pool에 접근할 수 있게 인증 설정
root@controller001:~# ceph auth list
...
client.volumes
	key: AQBWG/FWrBlMMRAAuOi8nOy8kVPy77rStMy5IA==
	caps: [mon] allow r
	caps: [osd] allow class-read object_prefix rbd_children, allow rwx pool=volumes, allow rx pool=images

# osd 인증에 allow rwx pool=volumes-ssd 를 추가한다.
root@controller001:~# ceph auth caps client.volumes mon 'allow r' osd 'allow class-read object_prefix rbd_children, allow rwx pool=volumes, allow rx pool=images, allow rwx pool=volumes-ssd'
updated caps for client.volumes
```


### Cinder 설정

```bash
root@controller001:~# vi /etc/cinder/cinder.conf
-->
[DEFAULT]
enabled_backends=RBD-backend,RBD-ssd
default_volume_type=RBD-backend

[RBD-backend]
volume_driver=cinder.volume.drivers.rbd.RBDDriver
rbd_pool=volumes
volume_backend_name=RBD-backend
host=rbd:volumes
rbd_user=volumes
rbd_secret_uuid=a5d0dd94-57c4-ae55-ffe0-7e3732a24455

[RBD-ssd]
volume_driver=cinder.volume.drivers.rbd.RBDDriver
rbd_pool=volumes-ssd
volume_backend_name=RBD-ssd
host=rbd:volumes-ssd
rbd_user=volumes
rbd_secret_uuid=a5d0dd94-57c4-ae55-ffe0-7e3732a24455

# 관련 서비스들 재시작
root@controller001:~# service cinder-api restart
root@controller001:~# service cinder-scheduler restart
root@controller001:~# service cinder-volume restart
```

### Cinder 볼륨 타입 생성

```bash
root@controller001:~# cinder extra-specs-list
+--------------------------------------+--------------+------------------------------------------+
|                  ID                  |     Name     |               extra_specs                |
+--------------------------------------+--------------+------------------------------------------+
| 7d0d0a01-7ac3-40e5-898f-30838750dbb0 | volumes_ceph | {u'volume_backend_name': u'RBD-backend'} |
+--------------------------------------+--------------+------------------------------------------+

root@controller001:~# cinder type-create volumes_ssd
+--------------------------------------+-------------+-------------+-----------+
|                  ID                  |     Name    | Description | Is_Public |
+--------------------------------------+-------------+-------------+-----------+
| 3c0fdf7d-d50a-4f29-bcde-58ace067923f | volumes_ssd |      -      |    True   |
+--------------------------------------+-------------+-------------+-----------+
root@controller001:~# cinder type-key volumes_ssd set volume_backend_name=RBD-ssd

root@controller001:~# cinder extra-specs-list
+--------------------------------------+--------------+------------------------------------------+
|                  ID                  |     Name     |               extra_specs                |
+--------------------------------------+--------------+------------------------------------------+
| 3c0fdf7d-d50a-4f29-bcde-58ace067923f | volumes_ssd  |   {u'volume_backend_name': u'RBD-ssd'}   |
| 7d0d0a01-7ac3-40e5-898f-30838750dbb0 | volumes_ceph | {u'volume_backend_name': u'RBD-backend'} |
+--------------------------------------+--------------+------------------------------------------+
```


## 검증

- Horizon에서 ```시스템 > 볼륨 > 볼륨 타입```에 기존 ```volumes_ceph```과 생성한 ```volumes_ssd``` 볼륨 타입을 확인할 수 있다.
2개 타입 모두 볼륨 생성까지 성공하는 것을 확인한다.
- 이미지로부터 볼륨을 생성한 뒤 ```ceph df``` 명령어로 실제 용량을 먹어들어가는지 확인한다.


## References

- [Ceph and Cinder Multi-backend - sebastien-han](http://www.sebastien-han.fr/blog/2013/04/25/ceph-and-cinder-multi-backend/)
- [How to set cinder multi-backend default - OpenStack Ask](https://ask.openstack.org/en/question/25708/how-to-set-cinder-multi-backend-default/)
- [USER MANAGEMENT - Ceph Docs](http://docs.ceph.com/docs/hammer/rados/operations/user-management/)