---
layout: post
title: "Nova Overcommitment"
date: 2016-04-22
categories: openstack
---

* content
{:toc}

## Overcommit 비율 기본값

Nova의 기본 오버커밋 비율은 다음과 같다.

- CPU -> 16:1
- Memory -> 1.5:1
- Disk -> 1:1

각 Compute 노드별로 물리 코어당 최대 16개의 vCPU를 할당하며, 총 물리 메모리 용량의 x 1.5배를 vMEM에 할당하겠다는 의미이다.
디스크 또한 Overcommit 비율을 줄 수 있는데 이는 VM들이 할당한 볼륨 용량만큼 다 쓰지는 않기 때문이다.

nova.conf 에서 설정을 하거나 확인할 수 있다.

```ini
vi /etc/nova/nova.conf
-->
[DEFAULT]
...
cpu_allocation_ratio=8.0
ram_allocation_ratio=1.0
disk_allocation_ratio=1.0
...
```

만약 Mirantis Fuel로 설치를 진행할 경우 기본값과 다르게 배포가 수행되는데 다음과 같다.

- CPU -> 8:1
- Memory -> 1:1
- Disk -> 1:1

위 값은 Fuel에서 별도로 계산하지는 않고 기본값으로서 설정하기 때문에,
다른 비율을 원한다면 hiera 설정 파일에 다음 키에 해당하는 값을 수정하여 배포하면 된다.

```bash
cpu_allocation_ratio: '8.0'
ram_allocation_ratio: '1.0'
disk_allocation_ratio: '1.0'
```

이 설정을 보는 Puppet 파일의 위치는 ```/etc/puppet/modules/osnailyfacter/modular/openstack-controller/openstack-controller.pp``` 이므로 참고한다.


## Overcommit 비율의 계산

메모리의 오버커밋은 예상치 못한 성능 이슈가 발생할 수 있으므로 추천하지 않는다.
디스크 오버커밋 또한 환경에 따라 실제 디스크 가용량이 가변적일 수 있기 때문에 추천하지 않는다.
따라서 메모리와 디스크의 오버커밋 비율은 둘 다 1로 설정하는게 타당하다.

CPU의 경우는 물리 CPU의 스펙과 정책에 따라 다른데, 일반적으로 다음과 같이 계산한다.

- (Instance Count) = (Overcommit Ratio) * (Physical Cores) / (vCores per Instance)
- (Overcommit Ratio) = (Instance Count) / (Physical Cores) * (vCores per Instance)

만약 인텔의 Hyper-Thread 기능을 사용할 경우, Mirantis에서는 총 코어 개수를 물리 코어 x 1.3 으로 계산할 것을 가이드한다.

다음 환경에서 오버커밋 비율로 생성해낼 수 있는 인스턴스 개수는 다음과 같다.

- 인텔 E5-2640 v3 2.6Ghz 8Core x 2way
- Hyper-Thread 활성화
- 인스턴스당 평균 4개의 코어를 사용

|Overcommit Ratio|Instance Count|Physical Cores|vCores per Instance|
|----------------|--------------|--------------|-------------------|
|1               |5.2           |20.8          |4                  |
|2               |10.4          |20.8          |4                  |
|4               |20.8          |20.8          |4                  |
|8               |41.6          |20.8          |4                  |
|16              |83.2          |20.8          |4                  |


## References

- [Compute Nodes, Overcommitting - OpenStack Docs](http://docs.openstack.org/openstack-ops/content/compute_nodes.html)
- [Calculate hardware resources - Mirantis Docs](https://docs.mirantis.com/openstack/fuel/fuel-8.0/mos-planning-guide.html#calculate-hardware-resources)