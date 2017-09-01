---
layout: post
title: "Ceph Placement Group 개수 변경"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

## 적정 PG 개수 계산

다음 링크를 참고하여 자신의 환경에 맞는 PG 카운트 값을 계산한다. [PG CALC](http://ceph.com/pgcalc/)

 
## PG 개수 확인

```bash
[root@storage004:~] ceph osd lspools
0 rbd,1 images,2 volumes,3 backups,4 .rgw.root,5 .rgw.control,6 .rgw,7 .rgw.gc,8 .users.uid,9 compute,10 .users,12 .rgw.buckets.index,13 .rgw.buckets,

[root@storage004:~] ceph osd pool get volumes pg_num
pg_num: 512

[root@storage004:~] ceph osd pool get volumes pgp_num
pgp_num: 512
```

 
## PG 개수 조정

```bash
[root@storage004:~] ceph osd pool set volumes pg_num 1024
[root@storage004:~] ceph osd pool set volumes pgp_num 1024
```


## 변경 진행 상태 확인

```bash
[root@storage004:~] ceph -s
health HEALTH_WARN
    42 pgs backfill
    43 pgs stuck unclean
    recovery 42/102323 objects degraded (0.041%)   # 0% 까지 떨어져야 한다.
    recovery 6028/102323 objects misplaced (5.891%)   # 0% 까지 떨어져야 한다.
```