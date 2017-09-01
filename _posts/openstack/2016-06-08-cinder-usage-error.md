---
layout: post
title: "cinder-volume-usage-audit 오류 현상"
date: 2016-06-08
categories: openstack
---

* content
{:toc}

## 문제 현상

Fuel 8.0/liberty로 배포한 환경에서 ```volume.exists``` 이벤트를 쌓기 위해 ```cinder-volume-usage-audit```을 실행했을 때
다음과 같은 오류가 발생하면서 이벤트가 쌓이지 않는 현상이 발생한다.

```bash
[root@controller001 ~] cinder-volume-usage-audit
2016-06-02 10:31:56.369 127257 ERROR cinder [req-6ff87c5d-74f5-4b6e-b5e5-df622c1b61bc - - - - -] Exists volume notification failed: Parent instance <Volume at 0x7fe286cc90d0> is not bound to a Session; lazy load operation of attribute 'volume_metadata' cannot proceed
2016-06-02 10:31:56.369 127257 ERROR cinder Traceback (most recent call last):
2016-06-02 10:31:56.369 127257 ERROR cinder   File "/usr/lib/python2.7/dist-packages/cinder/cmd/volume_usage_audit.py", line 120, in main
2016-06-02 10:31:56.369 127257 ERROR cinder     'exists', extra_usage_info=extra_info)
2016-06-02 10:31:56.369 127257 ERROR cinder   File "/usr/lib/python2.7/dist-packages/cinder/volume/utils.py", line 125, in notify_about_volume_usage
2016-06-02 10:31:56.369 127257 ERROR cinder     usage_info = _usage_from_volume(context, volume, **extra_usage_info)
2016-06-02 10:31:56.369 127257 ERROR cinder   File "/usr/lib/python2.7/dist-packages/cinder/volume/utils.py", line 75, in _usage_from_volume
2016-06-02 10:31:56.369 127257 ERROR cinder     metadata=volume_ref.get('volume_metadata'),)
2016-06-02 10:31:56.369 127257 ERROR cinder   File "/usr/lib/python2.7/dist-packages/oslo_db/sqlalchemy/models.py", line 68, in get
2016-06-02 10:31:56.369 127257 ERROR cinder     return getattr(self, key, default)
2016-06-02 10:31:56.369 127257 ERROR cinder   File "/usr/lib/python2.7/dist-packages/sqlalchemy/orm/attributes.py", line 237, in __get__
2016-06-02 10:31:56.369 127257 ERROR cinder     return self.impl.get(instance_state(instance), dict_)
2016-06-02 10:31:56.369 127257 ERROR cinder   File "/usr/lib/python2.7/dist-packages/sqlalchemy/orm/attributes.py", line 578, in get
2016-06-02 10:31:56.369 127257 ERROR cinder     value = self.callable_(state, passive)
2016-06-02 10:31:56.369 127257 ERROR cinder   File "/usr/lib/python2.7/dist-packages/sqlalchemy/orm/strategies.py", line 502, in _load_for_state
2016-06-02 10:31:56.369 127257 ERROR cinder     (orm_util.state_str(state), self.key)
2016-06-02 10:31:56.369 127257 ERROR cinder DetachedInstanceError: Parent instance <Volume at 0x7fe286cc90d0> is not bound to a Session; lazy load operation of attribute 'volume_metadata' cannot proceed
```

## 해결책

Cinder 버그로, 이에 대한 수정 커밋이 16년 4월 중순에 stable/liberty 브랜치로 Merge 되었다.
최신 stable/liberty 팩키지로 업데이트하면 해결되나, 업데이트가 여의치 않는 상황이라면 아래의 2개 커밋 내용을 반영한다.

- [Eager load columns in volume_get_active_by_window](https://github.com/openstack/cinder/commit/7e970a1da65431655179b3bba084f4a63fdae959)

> All other volume-related methods in db.sqlalchemy.api are eager loading
volume_metadata, volume_admin_metadata (if admin), volume_type,
volume_attachment and consistencygroup. volume_get_active_by_window
wasn't, causing fails because of SQLAlchemy Session being closed when
trying to lazy load volume_metadata. This commit adds missing
options(joinedload()) to this query.

- [Eager load snapshot_metadata in *snapshot_get_all](https://github.com/openstack/cinder/commit/ab6e2237bf464ec0c4c432ec6047a98cb30db6c5)

> All methods returning snapshot lists in db.sqlalchemy.api are eager
loading snapshot_metadata - besides snapshot_get_all_by_project and
snapshot_get_active_by_window. In case of the latter that fact caused
unit tests to randomly fail because of SQLAlchemy Session sometimes
getting closed before the metadata got lazy loaded. This commit adds
missing options(joinedload('snapshot_metadata')) to these queries.


이 후, 문제없이 ```volume.exists``` 이벤트를 쌓는 것을 볼 수 있다.

```bash
[root@controller001 ~] cinder-volume-usage-audit
No handlers could be found for logger "oslo_config.cfg"
/usr/lib/python2.7/dist-packages/oslo_db/sqlalchemy/enginefacade.py:241: NotSupportedWarning: Configuration option(s) ['use_tpool'] not supported
  exception.NotSupportedWarning
2016-06-02 10:36:19.824 20473 WARNING oslo_config.cfg [req-dad48cc1-4054-43cd-a62b-646744682ce5 - - - - -] Option "kombu_reconnect_delay" from group "DEFAULT" is deprecated. Use option "kombu_reconnect_delay" from group "oslo_messaging_rabbit".
2016-06-02 10:36:19.825 20473 WARNING oslo_config.cfg [req-dad48cc1-4054-43cd-a62b-646744682ce5 - - - - -] Option "amqp_durable_queues" from group "DEFAULT" is deprecated. Use option "amqp_durable_queues" from group "oslo_messaging_rabbit".
2016-06-02 10:36:19.831 20473 INFO oslo.messaging._drivers.impl_rabbit [req-dad48cc1-4054-43cd-a62b-646744682ce5 - - - - -] Connecting to AMQP server on 10.10.10.8:5673
2016-06-02 10:36:31.264 20473 INFO oslo.messaging._drivers.impl_rabbit [req-dad48cc1-4054-43cd-a62b-646744682ce5 - - - - -] Connected to AMQP server on 10.10.10.8:5673

[root@controller001 ~] ceilometer event-list -q event_type=volume.exists
+--------------------------------------+---------------+----------------------------+----------------------------------------------------------------------------+
| Message ID                           | Event Type    | Generated                  | Traits                                                                     |
+--------------------------------------+---------------+----------------------------+----------------------------------------------------------------------------+
| b78e1cde-d465-474d-89d7-fab6c312825a | volume.exists | 2016-06-02T10:12:00.627000 | +--------------------+--------+------------------------------------------+ |
|                                      |               |                            | |        name        |  type  |                  value                   | |
|                                      |               |                            | +--------------------+--------+------------------------------------------+ |
|                                      |               |                            | |       status       | string |                available                 | |
|                                      |               |                            | |      user_id       | string |     e3b2f5561c58453eb75f998bc4fc4955     | |
|                                      |               |                            | |      service       | string |            volume.rbd:volumes            | |
|                                      |               |                            | | availability_zone  | string |                   nova                   | |
|                                      |               |                            | |     tenant_id      | string |     ab9b33fc3fe9438c9ffd8786406811c0     | |
|                                      |               |                            | |     created_at     | string |           2016-05-19T09:11:08            | |
|                                      |               |                            | |    resource_id     | string |   e5536a24-c475-4af8-a088-032a07d24c4a   | |
|                                      |               |                            | |        host        | string |         rbd:volumes#RBD-backend          | |
|                                      |               |                            | | replication_status | string |                 disabled                 | |
|                                      |               |                            | |     request_id     | string | req-3445040e-8210-4bc3-8235-a8e7d892bc4a | |
|                                      |               |                            | |    display_name    | string |                  Volume                  | |
|                                      |               |                            | |     project_id     | string |     ab9b33fc3fe9438c9ffd8786406811c0     | |
|                                      |               |                            | |        type        | string |   fb21bd48-ee94-4abd-95a6-caeb22644d39   | |
|                                      |               |                            | |        size        | string |                    10                    | |
|                                      |               |                            | +--------------------+--------+------------------------------------------+ |
+--------------------------------------+---------------+----------------------------+----------------------------------------------------------------------------+

[root@controller001 ~] ceilometer sample-list -m volume.exists
+--------------------------------------+---------------+-------+--------+--------+----------------------------+
| Resource ID                          | Name          | Type  | Volume | Unit   | Timestamp                  |
+--------------------------------------+---------------+-------+--------+--------+----------------------------+
| e5536a24-c475-4af8-a088-032a07d24c4a | volume.exists | delta | 1.0    | volume | 2016-06-02T10:12:00.627000 |
+--------------------------------------+---------------+-------+--------+--------+----------------------------+
```
