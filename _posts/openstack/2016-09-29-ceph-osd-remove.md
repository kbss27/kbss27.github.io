---
layout: post
title: "Ceph OSD 삭제"
date: 2016-09-29
categories: openstack
---

* content
{:toc}

OSD 여러개를 한번에 빼면 최악의 경우, 미처 Remap 하지 못한 데이터를 유실할 수 있다.
때문에 Replica 카운트와 CRUSH Map을 참고하여, ceph -s 로 Remap이 완료되었는지 반드시 확인하면서 OSD를 빼도록한다.


## OSD를 Out 상태로 변경

```bash
[ceph@cephmon my-cluster] ceph osd tree
ID WEIGHT  TYPE NAME      UP/DOWN REWEIGHT PRIMARY-AFFINITY
-1 0.17578 root default
-2 0.05859     host ceph0
 0 0.02930         osd.0       up  1.00000          1.00000
 1 0.02930         osd.1       up  1.00000          1.00000
-3 0.05859     host ceph1
 2 0.02930         osd.2       up  1.00000          1.00000
 3 0.02930         osd.3       up  1.00000          1.00000
-4 0.05859     host ceph2
 4 0.02930         osd.4       up  1.00000          1.00000
 5 0.02930         osd.5       up  1.00000          1.00000
 
[ceph@cephmon my-cluster] ceph osd out osd.1
marked out osd.1.
```


## OSD 데몬 정지

실제 OSD 데몬이 떠있는 노드에서 정지해준다.

```bash
[root@ceph0 ceph] service ceph-osd@1 stop
Redirecting to /bin/systemctl stop  ceph-osd@1.service
```

시스템에 따라 다음 명령어일 수도 있다.

```bash
[root@ceph0 ceph] stop ceph-osd id=1
ceph-osd start/running
```


## CRUSH 및 인증에서 OSD 빼기

```bash
[ceph@cephmon my-cluster] ceph osd crush remove osd.1
removed item id 1 name 'osd.1' from crush map
 
[ceph@cephmon my-cluster] ceph auth del osd.1
updated
```
 

## OSD 삭제

```bash
[ceph@cephmon my-cluster] ceph osd rm 1
removed osd.1
```
 

## 언마운트 수행

더 이상 해당 OSD는 사용하지 않으므로 마음대로 한다.