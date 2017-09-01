---
layout: post
title: "Ceph Pool별 Replication Size 설정"
date: 2016-07-06
categories: openstack
---

* content
{:toc}

## Replication Size 조회

```
[root@controller001 ~] ceph osd dump | grep 'replicated size'
pool 0 'rbd' replicated size 3 min_size 1 crush_ruleset 0 object_hash rjenkins pg_num 64 pgp_num 64 last_change 1 flags hashpspool stripe_width 0
pool 1 'images' replicated size 3 min_size 1 crush_ruleset 0 object_hash rjenkins pg_num 128 pgp_num 128 last_change 12281 flags hashpspool stripe_width 0
pool 2 'volumes' replicated size 3 min_size 1 crush_ruleset 0 object_hash rjenkins pg_num 1024 pgp_num 1024 last_change 12277 flags hashpspool stripe_width 0
pool 3 'backups' replicated size 3 min_size 1 crush_ruleset 0 object_hash rjenkins pg_num 512 pgp_num 512 last_change 12206 flags hashpspool stripe_width 0
pool 4 '.rgw.root' replicated size 3 min_size 1 crush_ruleset 0 object_hash rjenkins pg_num 64 pgp_num 64 last_change 185 flags hashpspool stripe_width 0
pool 5 '.rgw.control' replicated size 3 min_size 1 crush_ruleset 0 object_hash rjenkins pg_num 64 pgp_num 64 last_change 187 flags hashpspool stripe_width 0
pool 6 '.rgw' replicated size 3 min_size 1 crush_ruleset 0 object_hash rjenkins pg_num 64 pgp_num 64 last_change 189 owner 18446744073709551615 flags hashpspool stripe_width 0
pool 7 '.rgw.gc' replicated size 3 min_size 1 crush_ruleset 0 object_hash rjenkins pg_num 64 pgp_num 64 last_change 190 owner 18446744073709551615 flags hashpspool stripe_width 0
pool 8 '.users.uid' replicated size 3 min_size 1 crush_ruleset 0 object_hash rjenkins pg_num 64 pgp_num 64 last_change 191 flags hashpspool stripe_width 0
pool 9 'compute' replicated size 3 min_size 1 crush_ruleset 0 object_hash rjenkins pg_num 1024 pgp_num 1024 last_change 12280 flags hashpspool stripe_width 0
pool 10 '.users' replicated size 3 min_size 1 crush_ruleset 0 object_hash rjenkins pg_num 64 pgp_num 64 last_change 196 owner 18446744073709551615 flags hashpspool stripe_width 0
pool 12 '.rgw.buckets.index' replicated size 3 min_size 1 crush_ruleset 0 object_hash rjenkins pg_num 64 pgp_num 64 last_change 234 owner 18446744073709551615 flags hashpspool stripe_width 0
pool 13 '.rgw.buckets' replicated size 3 min_size 1 crush_ruleset 0 object_hash rjenkins pg_num 64 pgp_num 64 last_change 236 owner 18446744073709551615 flags hashpspool stripe_width 0
```


## Replication Size 설정

```
# Usage: ceph osd pool set {poolname} size {num-replicas}

[root@controller001 ~] ceph osd pool set backups size 2
set pool 3 size to 2
```


## References

- [SET THE NUMBER OF OBJECT REPLICAS - Ceph Doc](http://docs.ceph.com/docs/hammer/rados/operations/pools/#set-the-number-of-object-replicas)