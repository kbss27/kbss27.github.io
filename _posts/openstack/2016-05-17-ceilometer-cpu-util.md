---
layout: post
title: "Ceilometer vCPU 사용량 미터링"
date: 2016-05-17
categories: openstack
---

* content
{:toc}

## Intro

Ceilometer와 Nova는 Libvirt/Hyper-V/vSphere 를 사용하였을 때, 각 인스턴스의 vCPU 사용량을 미터링한다.
미터명은 ```cpu_util```이며 단위는 % 이다.

그러나 Fuel로 OpenStack을 배포하였을 경우, ```cpu_util```을 미터링하지 않는다. 설정이 누락되어 있기 때문이다.
이 글에서는 Ceilometer의 파이프라인을 수정하여 ```cpu_util```을 미터링하도록 설정해본다.


## 설정

설정할 내용은 다음과 같다.

- 매분마다 각 인스턴스의 vCPU 사용 시간을 측정한다.
- 각 인스턴스의 이전과 지금의 vCPU 사용 시간으로부터 ```cpu.delta``` 이름과 ns 단위로 미터링한다.
- 각 인스턴스의 vCPU 개수 및 이전과 지금의 사용 시간으로부터 사용량을 계산하여 ```cpu_util``` 이름과 % 단위로 미터링한다.


### pipeline.yaml 설정

모든 Controller 및 Computer 노드에서 ```/etc/ceilometer/pipeline.yaml``` 파일을 다음과 같이 수정한다.

- 수정 전

```yml
---
sources:
    - name: meter_source
      interval: 600
      meters:
            - "*"
            - "!volume.create.*"
            - "!volume.delete.*"
            - "!volume.update.*"
            - "!volume.resize.*"
            - "!volume.attach.*"
            - "!volume.detach.*"
            - "!snapshot.create.*"
            - "!snapshot.delete.*"
            - "!identity.authenticate.*"
            - "!storage.api.request"
      sinks:
          - meter_sink
sinks:
    - name: meter_sink
      transformers:
      publishers:
          - notifier://
```

- 수정 후

```yml
sources:
    - name: meter_source
      interval: 600
      meters:
            - "*"
            - "!volume.create.*"
            - "!volume.delete.*"
            - "!volume.update.*"
            - "!volume.resize.*"
            - "!volume.attach.*"
            - "!volume.detach.*"
            - "!snapshot.create.*"
            - "!snapshot.delete.*"
            - "!identity.authenticate.*"
            - "!storage.api.request"
      sinks:
          - meter_sink
    - name: cpu_source
      interval: 60
      meters:
          - "cpu"
      sinks:
          - cpu_sink
          - cpu_delta_sink
sinks:
    - name: meter_sink
      transformers:
      publishers:
          - notifier://
    - name: cpu_sink
      transformers:
          - name: "rate_of_change"
            parameters:
                target:
                    name: "cpu_util"
                    unit: "%"
                    type: "gauge"
                    scale: "100.0 / (10**9 * (resource_metadata.cpu_number or 1))"
      publishers:
          - notifier://
    - name: cpu_delta_sink
      transformers:
          - name: "delta"
            parameters:
                target:
                    name: "cpu.delta"
                growth_only: True
      publishers:
          - notifier://
```

```cpu_source``` 이름의 Source를 추가하고 여기에 ```cpu_sink```와 ```cpu_delta_sink``` 이름의 Sync들을 추가한 것을 볼 수 있다.


### gnocchi_resources.yaml 수정

모든 Controller 및 Computer 노드에서 ```/etc/ceilometer/gnocchi_resources.yaml``` 파일을 다음과 같이 수정한다.

- 수정 전

```yml
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  - resource_type: instance
    metrics:
      - 'instance'
      - 'memory'
      - 'memory.usage'
      - 'memory.resident'
      - 'vcpus'
      - 'cpu'
      - 'disk.root.size'
      - 'disk.ephemeral.size'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

- 수정 후

```yml
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  - resource_type: instance
    metrics:
      - 'instance'
      - 'memory'
      - 'memory.usage'
      - 'memory.resident'
      - 'vcpus'
      - 'cpu'
      - 'cpu.delta'
      - 'cpu_util'
      - 'disk.root.size'
      - 'disk.ephemeral.size'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

```instance``` 리소스에 ```cpu.delta```와 ```cpu_util``` 이름의 메트릭을 추가한 것을 볼 수 있다.


### 관련 서비스들 재시작

모든 Controller 노드에서 다음 서비스들을 재시작한다.

```bash
service ceilometer-agent-notification restart
service ceilometer-alarm-notifier restart
service ceilometer-api restart
service ceilometer-collector restart
pcs resource disable p_ceilometer-agent-central
pcs resource enable p_ceilometer-agent-central
pcs resource disable p_ceilometer-alarm-evaluator
pcs resource enable p_ceilometer-alarm-evaluator
```

모든 Compute 노드에서 다음 서비스를 재시작한다.

```bash
service ceilometer-agent-compute restart
```


## 검증

특정 Tenant의 특정 인스턴스에 ```cpu_util```이 미터링되는지 알아보자.

```bash
[root@controller001 ~] keystone tenant-list
+----------------------------------+-----------+---------+
|                id                |    name   | enabled |
+----------------------------------+-----------+---------+
| d96c930899d842bd958aa6f54c8c9448 | basupport |   True  |
+----------------------------------+-----------+---------+

[root@controller001 ~] nova list --tenant d96c930899d842bd958aa6f54c8c9448
+--------------------------------------+------------------------+----------------------------------+--------+------------+-------------+------------------------------------+
| ID                                   | Name                   | Tenant ID                        | Status | Task State | Power State | Networks                           |
+--------------------------------------+------------------------+----------------------------------+--------+------------+-------------+------------------------------------+
| 56f3e743-9f11-4c24-8a96-5b1b5f63613d | ns.terracemail.co.kr   | d96c930899d842bd958aa6f54c8c9448 | ACTIVE | -          | Running     | Network01=10.0.0.18, 27.102.82.186 |
+--------------------------------------+------------------------+----------------------------------+--------+------------+-------------+------------------------------------+

[root@controller001 ~] ceilometer resource-list -q project_id=d96c930899d842bd958aa6f54c8c9448 | grep 56f3e743-9f11-4c24-8a96-5b1b5f63613d
+-----------------------------------------------------------------------+-----------+----------------------------------+----------------------------------+
| Resource ID                                                           | Source    | User ID                          | Project ID                       |
+-----------------------------------------------------------------------+-----------+----------------------------------+----------------------------------+
| 56f3e743-9f11-4c24-8a96-5b1b5f63613d                                  | openstack | fa3a8f08b5fc498face8f9567f0ebd2f | d96c930899d842bd958aa6f54c8c9448 |
| 56f3e743-9f11-4c24-8a96-5b1b5f63613d-vda                              | openstack | fa3a8f08b5fc498face8f9567f0ebd2f | d96c930899d842bd958aa6f54c8c9448 |
| 56f3e743-9f11-4c24-8a96-5b1b5f63613d-vdb                              | openstack | fa3a8f08b5fc498face8f9567f0ebd2f | d96c930899d842bd958aa6f54c8c9448 |
| instance-00000824-56f3e743-9f11-4c24-8a96-5b1b5f63613d-tapad48effd-a2 | openstack | fa3a8f08b5fc498face8f9567f0ebd2f | d96c930899d842bd958aa6f54c8c9448 |
+-----------------------------------------------------------------------+-----------+----------------------------------+----------------------------------+

[root@controller001 ~] ceilometer meter-list -q resource_id=56f3e743-9f11-4c24-8a96-5b1b5f63613d
+---------------------+------------+----------+--------------------------------------+----------------------------------+----------------------------------+
| Name                | Type       | Unit     | Resource ID                          | User ID                          | Project ID                       |
+---------------------+------------+----------+--------------------------------------+----------------------------------+----------------------------------+
| cpu                 | cumulative | ns       | 56f3e743-9f11-4c24-8a96-5b1b5f63613d | fa3a8f08b5fc498face8f9567f0ebd2f | d96c930899d842bd958aa6f54c8c9448 |
| cpu.delta           | delta      | ns       | 56f3e743-9f11-4c24-8a96-5b1b5f63613d | fa3a8f08b5fc498face8f9567f0ebd2f | d96c930899d842bd958aa6f54c8c9448 |
| cpu_util            | gauge      | %        | 56f3e743-9f11-4c24-8a96-5b1b5f63613d | fa3a8f08b5fc498face8f9567f0ebd2f | d96c930899d842bd958aa6f54c8c9448 |
| disk.ephemeral.size | gauge      | GB       | 56f3e743-9f11-4c24-8a96-5b1b5f63613d | fa3a8f08b5fc498face8f9567f0ebd2f | d96c930899d842bd958aa6f54c8c9448 |
| disk.read.bytes     | cumulative | B        | 56f3e743-9f11-4c24-8a96-5b1b5f63613d | fa3a8f08b5fc498face8f9567f0ebd2f | d96c930899d842bd958aa6f54c8c9448 |
| disk.read.requests  | cumulative | request  | 56f3e743-9f11-4c24-8a96-5b1b5f63613d | fa3a8f08b5fc498face8f9567f0ebd2f | d96c930899d842bd958aa6f54c8c9448 |
| disk.root.size      | gauge      | GB       | 56f3e743-9f11-4c24-8a96-5b1b5f63613d | fa3a8f08b5fc498face8f9567f0ebd2f | d96c930899d842bd958aa6f54c8c9448 |
| disk.write.bytes    | cumulative | B        | 56f3e743-9f11-4c24-8a96-5b1b5f63613d | fa3a8f08b5fc498face8f9567f0ebd2f | d96c930899d842bd958aa6f54c8c9448 |
| disk.write.requests | cumulative | request  | 56f3e743-9f11-4c24-8a96-5b1b5f63613d | fa3a8f08b5fc498face8f9567f0ebd2f | d96c930899d842bd958aa6f54c8c9448 |
| instance            | gauge      | instance | 56f3e743-9f11-4c24-8a96-5b1b5f63613d | fa3a8f08b5fc498face8f9567f0ebd2f | d96c930899d842bd958aa6f54c8c9448 |
| memory              | gauge      | MB       | 56f3e743-9f11-4c24-8a96-5b1b5f63613d | fa3a8f08b5fc498face8f9567f0ebd2f | d96c930899d842bd958aa6f54c8c9448 |
| memory.resident     | gauge      | MB       | 56f3e743-9f11-4c24-8a96-5b1b5f63613d | fa3a8f08b5fc498face8f9567f0ebd2f | d96c930899d842bd958aa6f54c8c9448 |
| memory.usage        | gauge      | MB       | 56f3e743-9f11-4c24-8a96-5b1b5f63613d | fa3a8f08b5fc498face8f9567f0ebd2f | d96c930899d842bd958aa6f54c8c9448 |
| vcpus               | gauge      | vcpu     | 56f3e743-9f11-4c24-8a96-5b1b5f63613d | fa3a8f08b5fc498face8f9567f0ebd2f | d96c930899d842bd958aa6f54c8c9448 |
+---------------------+------------+----------+--------------------------------------+----------------------------------+----------------------------------+
```

해당 인스턴스의 미터링 항목 중 ```cpu.delta```와 ```cpu_util```이 있는 것을 확인할 수 있다.

```bash
[root@controller001 ~] ceilometer sample-list -m cpu_util -q resource_id=56f3e743-9f11-4c24-8a96-5b1b5f63613d
+--------------------------------------+----------+-------+---------------+------+----------------------------+
| Resource ID                          | Name     | Type  | Volume        | Unit | Timestamp                  |
+--------------------------------------+----------+-------+---------------+------+----------------------------+
| 56f3e743-9f11-4c24-8a96-5b1b5f63613d | cpu_util | gauge | 3.97250280295 | %    | 2016-05-18T01:59:01.047000 |
| 56f3e743-9f11-4c24-8a96-5b1b5f63613d | cpu_util | gauge | 3.77611496803 | %    | 2016-05-18T01:58:01.135000 |
| 56f3e743-9f11-4c24-8a96-5b1b5f63613d | cpu_util | gauge | 3.68242291564 | %    | 2016-05-18T01:56:00.692000 |
| 56f3e743-9f11-4c24-8a96-5b1b5f63613d | cpu_util | gauge | 3.93806478691 | %    | 2016-05-18T01:54:00.506000 |
| 56f3e743-9f11-4c24-8a96-5b1b5f63613d | cpu_util | gauge | 3.96658634329 | %    | 2016-05-18T01:53:00.493000 |
| 56f3e743-9f11-4c24-8a96-5b1b5f63613d | cpu_util | gauge | 4.06854619939 | %    | 2016-05-18T01:50:00.492000 |
| 56f3e743-9f11-4c24-8a96-5b1b5f63613d | cpu_util | gauge | 4.08332700418 | %    | 2016-05-18T01:48:00.492000 |
| 56f3e743-9f11-4c24-8a96-5b1b5f63613d | cpu_util | gauge | 4.01050752973 | %    | 2016-05-18T01:46:00.584000 |
| 56f3e743-9f11-4c24-8a96-5b1b5f63613d | cpu_util | gauge | 4.08323846609 | %    | 2016-05-18T01:45:00.492000 |
| 56f3e743-9f11-4c24-8a96-5b1b5f63613d | cpu_util | gauge | 4.00104840805 | %    | 2016-05-18T01:43:00.493000 |
+--------------------------------------+----------+-------+---------------+------+----------------------------+

[root@controller001 ~] ceilometer statistics -m cpu_util -q resource_id=56f3e743-9f11-4c24-8a96-5b1b5f63613d -p 300
+--------+----------------------------+----------------------------+---------------+---------------+---------------+---------------+-------+----------+----------------------------+----------------------------+
| Period | Period Start               | Period End                 | Max           | Min           | Avg           | Sum           | Count | Duration | Duration Start             | Duration End               |
+--------+----------------------------+----------------------------+---------------+---------------+---------------+---------------+-------+----------+----------------------------+----------------------------+
| 300    | 2016-05-18T01:23:00.577000 | 2016-05-18T01:28:00.577000 | 4.09961962363 | 3.91247217881 | 4.00604590122 | 8.01209180244 | 2     | 119.996  | 2016-05-18T01:26:00.491000 | 2016-05-18T01:28:00.487000 |
| 300    | 2016-05-18T01:28:00.577000 | 2016-05-18T01:33:00.577000 | 4.13411350945 | 3.98245659551 | 4.0498138243  | 12.1494414729 | 3     | 240.004  | 2016-05-18T01:29:00.494000 | 2016-05-18T01:33:00.498000 |
| 300    | 2016-05-18T01:33:00.577000 | 2016-05-18T01:38:00.577000 | 3.92287985454 | 3.80036394819 | 3.86162190137 | 7.72324380273 | 2     | 179.992  | 2016-05-18T01:34:00.492000 | 2016-05-18T01:37:00.484000 |
| 300    | 2016-05-18T01:38:00.577000 | 2016-05-18T01:43:00.577000 | 4.06026719766 | 3.98008233575 | 4.01882943488 | 16.0753177395 | 4     | 239.999  | 2016-05-18T01:39:00.494000 | 2016-05-18T01:43:00.493000 |
| 300    | 2016-05-18T01:43:00.577000 | 2016-05-18T01:48:00.577000 | 4.08332700418 | 4.01050752973 | 4.05902433333 | 12.177073     | 3     | 180.0    | 2016-05-18T01:45:00.492000 | 2016-05-18T01:48:00.492000 |
| 300    | 2016-05-18T01:48:00.577000 | 2016-05-18T01:53:00.577000 | 4.06854619939 | 3.96658634329 | 4.01756627134 | 8.03513254269 | 2     | 180.001  | 2016-05-18T01:50:00.492000 | 2016-05-18T01:53:00.493000 |
| 300    | 2016-05-18T01:53:00.577000 | 2016-05-18T01:58:00.577000 | 3.93806478691 | 3.68242291564 | 3.81024385127 | 7.62048770255 | 2     | 120.186  | 2016-05-18T01:54:00.506000 | 2016-05-18T01:56:00.692000 |
+--------+----------------------------+----------------------------+---------------+---------------+---------------+---------------+-------+----------+----------------------------+----------------------------+
```

통계로 출력했을 때는 ```Avg``` 필드를 확인하면 된다.


## References

- [Telemetry Measurements - OpenStack Docs](http://docs.openstack.org/admin-guide/telemetry-measurements.html)
- [Ceilometer Quickstart - RDO project](https://www.rdoproject.org/install/ceilometerquickstart/)
- [/etc/ceilometer - OpenStack GitHub](https://github.com/openstack/ceilometer/tree/master/etc/ceilometer)