---
layout: post
title: "Ceph Placement Group의 Repair 방법"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

## active+clean+inconsistent 상태의 PG가 존재할 때

- active: Request를 처리할 수 있는 상태
- clean: 데이터가 Replica 카운트대로 Replication 되어있는 상태
- inconsistent: Replica 중 일부가 잘못된 데이터를 가지고있는 상태. 이전에 디스크 오류가 있었을 수 있고 scrub errors 카운트가 존재할 수 있다.

이 상태를 가진 PG는 자동으로 Recovery 되지는 않는데, 명령어를 통해 Fix될 확률이 높다.

```bash
# 현재의 Ceph 상태를 확인한다.
[root@storage004 ~] ceph -s
    cluster 0fa8f4e1-0361-45d4-b91c-4d45a224783e
     health HEALTH_ERR
            5 pgs inconsistent
            9 scrub errors
     monmap e3: 3 mons at {controller001=10.10.10.13:6789/0,controller002=10.10.10.7:6789/0,controller003=10.10.10.19:6789/0}
            election epoch 22, quorum 0,1,2 controller002,controller001,controller003
     osdmap e2679: 43 osds: 33 up, 33 in
      pgmap v1939324: 3264 pgs, 13 pools, 395 GB data, 88915 objects
            1198 GB used, 118 TB / 120 TB avail
                3259 active+clean
                   5 active+clean+inconsistent  # 5개의 inconsistent 상태의 PG가 존재
  client io 0 B/s rd, 630 kB/s wr, 138 op/s

# 문제가 있는 PG 번호를 출력한다.
[root@storage004 ~] ceph health detail
HEALTH_ERR 5 pgs inconsistent; 9 scrub errors
pg 9.180 is active+clean+inconsistent, acting [43,36,18]  # pg 9.180
pg 9.e1 is active+clean+inconsistent, acting [20,41,23]  # pg 9.e1
pg 2.12 is active+clean+inconsistent, acting [24,37,15]  # pg 2.12
pg 9.3e3 is active+clean+inconsistent, acting [32,26,7]  # pg 9.3e3
pg 9.265 is active+clean+inconsistent, acting [24,10,3]  # pg 9.265
9 scrub errors

# 해당 PG들에 대해 repair를 수행한다.
[root@storage004 ~] ceph pg repair 9.180
instructing pg 9.180 on osd.43 to repair

[root@storage004 ~] ceph pg repair 9.e1
instructing pg 9.e1 on osd.20 to repair

[root@storage004 ~] ceph pg repair 2.12
instructing pg 2.12 on osd.24 to repair

[root@storage004 ~] ceph pg repair 9.3e3
instructing pg 9.3e3 on osd.32 to repair

[root@storage004 ~] ceph pg repair 9.265
instructing pg 9.265 on osd.24 to repair

# repair 완료
[root@storage004 ~] ceph health detail
HEALTH_OK
```


## References

- [MANUALLY REPAIR OBJECT - Ceph Blog](http://ceph.com/planet/ceph-manually-repair-object/)
- [PLACEMENT GROUP STATES - Ceph Docs](http://docs.ceph.com/docs/master/rados/operations/pg-states/)