---
layout: post
title: "Cinder 마이그레이션 상태 변경"
date: 2016-05-15
categories: openstack
---

* content
{:toc}

## 문제 현상

특정 볼륨을 마이그레이션 하다가 실패할 경우, 경우에 따라 상태 값이 계속 마이그레이션 중인 상태로 남아있을 수 있다.
마이그레이션 상태애서는 볼륨 삭제 등 어떠한 액션도 수행할 수 없다.

```bash
[root@controller001 ~] cinder delete 08b88e89-cda7-40a0-aa1d-4cf137660317
Delete for volume 08b88e89-cda7-40a0-aa1d-4cf137660317 failed: Invalid volume: Volume cannot be deleted while migrating (HTTP 400) (Request-ID: req-46bde485-e138-4a72-b765-9a23258aeace)
ERROR: Unable to delete any of the specified volumes.

# 강제 삭제도 불가하다.
[root@controller001 ~] cinder force-delete 08b88e89-cda7-40a0-aa1d-4cf137660317
Delete for volume 08b88e89-cda7-40a0-aa1d-4cf137660317 failed: Invalid volume: Volume cannot be deleted while migrating (HTTP 400) (Request-ID: req-05e1f872-d796-492e-bc7d-bd6e792831da)
ERROR: Unable to force delete any of the specified volumes.
```


## 해결책

DB에 있는 마이그레이션 중인 상태를 없애야 한다.

```
# MySQL 접속
[root@controller001 ~] mysql

mysql> use cinder;
Database changed

# 마이그레이션 상태 확인
mysql> select id, migration_status from volumes where id = "08b88e89-cda7-40a0-aa1d-4cf137660317";
+--------------------------------------+------------------+
| id                                   | migration_status |
+--------------------------------------+------------------+
| 08b88e89-cda7-40a0-aa1d-4cf137660317 | migrating        |
+--------------------------------------+------------------+
1 row in set (0.00 sec)

# 마이그레이션 상태를 없앰
mysql> UPDATE volumes set migration_status=NULL where id = "08b88e89-cda7-40a0-aa1d-4cf137660317";
Query OK, 1 row affected (0.01 sec)
Rows matched: 1  Changed: 1  Warnings: 0

mysql> exit
```

이 후, 정상적으로 볼륨에 대해 삭제 등의 액션을 취할 수 있다.