---
layout: post
title: "Mirantis OpenStack Reference Architecture"
date: 2016-12-02
categories: openstack
---

* content
{:toc}

## Introduction

이 문서는 Mirnatis 사의 ```Mirantis OpenStack Reference Architecture for Dell Hardware``` 문서를 기반으로, OpenStack VPC 아키텍쳐 예제를 작성한 문서이다.
```Fuel for OpenStack```을 통해 배포되는 아키텍쳐이므로 Fuel에 Dependency를 가지나, 일정 규모 내의 VPC라면 Fuel은 운영 및 관리에서 좋은 선택이기도 하다.

## Mirantis OpenStack

Mirantis의 Fuel을 통해 배포한 OpenStack은 다음과 같은 특징을 가진다.

- OpenStack Mitaka Release
- Ubuntu 14.04
- Keystone, Nova, Glance, Cinder, Neutron, Horizon, Heat, Murano, Ceilometer 배포
- HAproxy, Corosync/Pacemaker를 통한 3개 Controller 노드들의 HA 구성
- Ceph 분산 스토리지 사용
  - Glance, Cinder, Nova Root/Ephemeral/Swap, Swift의 백엔드 스토리지로 사용
  - 1개(4KB 이상 오브젝트 단위)의 데이터에 대해, 3개의 복제본을 분산 저장
  - 디스크 또는 노드 자체가 Down 되더라도 자동으로 복제본 리밸런싱 수행 -> VM에 영향 없음
  - Nova 볼륨들을 Compute(=Hypervisor) 노드의 로컬 디스크가 아닌, Ceph 노드를 사용하므로 매우 빠른 Live 마이그레이션 지원
- L3 네트워크에 Neutron DVR 사용, L2 네트워크에 VXLAN 배포 가능 (문서는 VLAN 기준)
- 모든 API들의 Public URL에 대해 https 암호화
- Kibana, Grafana, Nagios를 통한 LMA 지원: 웹으로 로그 확인, 모니터링 및 메일로 장애 알림 전송
- Sahara 배포 가능

## Architecture

Fuel을 통해 배포된 OpenStack 노드들은 각자 다음과 같은 Role을 가지고 있다.

- Fuel Master: Fuel이 설치된 노드로서, 다른 Slave 노드에 OpenStack을 배포하는 역할을 수행한다.
- Controller Node: MySQL, RabbitMQ, HAproxy, OpenStack API, Horizon과 같은 핵심 OpenStack 서비스들이 올라와있는 노드이다.
그러나 이 노드에서 VM을 실행하지는 않는다.
- Compute Node: 실제 VM을 실행하는 Hypervisor 노드이다.
- Storage Node: Ceph 분산 스토리지 노드로서 Nova 및 Cinder 볼륨, Glance 이미지, Swift 데이터를 저장한다.
- Telemetry Node (Optional): Ceilometer 백엔드 스토리지로 MongoDB가 올라와있는 노드이다.
- Monitor Node (Optional): Kibana/ElasticSearch, Grafana/InfluxDB, Nagios가 설치되는 노드로
로그 확인 및 모니터링, 장애 알림을 제공한다.

## Network Design

Mirantis OpenStack은 총 5개 목적의 네트워크를 가진다.

- Admin(PXE) Network: Fuel Master 노드에서 Slave 노드를 PXE 부팅시키고 OS 프로비저닝 및 OpenStack 배포를 수행하는데 사용된다.
- Management Network: 클러스터 네트워크로 거의 모든 노드가 사용하며 API들간의 내부 통신에 쓰인다.
- Public Network: Controller 노드의 경우 외부에서 API에 접속하는 네트워크이며 SNAT 통신에도 쓰인다.
Neutron DVR을 사용할 것이므로 Compute 노드에서도 DNAT(=FIP) 통신에 쓰인다.
- Private Network: Compute 노드들간의 테넌트 내, 또는 테넌트들간의 사설 네트워크 통신에 쓰인다.
- Storage Network: Ceph의 Public/Replication 네트워크로 VM의 스토리지 I/O 및 Ceph들간의 데이터 리플리케이션에 사용된다.
(Liberty 때는 Ceph Public 네트워크로 Management 네트워크를 사용하였으나, Mitaka 부터는 Ceph Public/Replication 모두 Storage 네트워크만을 사용한다)

아래는 이들 네트워크의 VLAN 및 서브넷 예제이다.

|                    | VLAN           | Subnet        |
|--------------------|----------------|---------------|
| Admin Network      | 120 (untagged) | 172.16.1.0/24 |
| Management Network | 140            | 172.17.0.0/24 |
| Public Network     | 160            | 최소 /26 이상의 공인 IP가 필요하며, 가능한 서브넷이 클수록 좋다. 현재의 Mirantis Fuel은 서브넷이 연속적인 풀만 지원한다. |
| Private Network    | 200~1000       | 192.168.122.0/24 |
| Storage Network    | 180            | 172.18.0.0/24 |

종합하면 아래와 같은 네트워크 구성을 가진다.

![fuel_network_design](/media/openstack/fuel_network_design.png)

## Hardware

각 노드에 대한 하드웨어 구성은 다음과 같다. Ceph OSD를 제외하면 전부 SSD인데, 어느 정도 규모 이하에서는 Ceph Journal을 제외하고는 HDD를 사용해도 되긴하다.
이 경우 VM 성능 및 I/O에는 영향을 주지 않겠지만 OpenStack 서비스를 사용하는(=API 콜 등) 작업은 느릴 수 있다.

- Fuel Master: 1EA
  - CPU: 4C8T x 1way
  - RAM: 64GB
  - Storage: SSD 200GB x 1
  - NIC
    - 1G x 1: Admin Network
    - 1G x 1: Public Network
  - Size: 1U
- Controller Node: 3EA
  - CPU: 4C8T x 2way
  - RAM: 128GB
  - Storage
    - SSD 400GB x 1: OS
    - SSD 400GB x 1: MongoDB
  - NIC
    - 10G x 2 (LACP): Public, Management, Storage Network
    - 1G x 1: Admin Network
  - Size: 1U
- Compute Node: 3EA
  - CPU: 8C16T x 2way
  - RAM: 256GB
  - Storage: SSD 200GB x 1
  - NIC
    - 10G x 2 (LACP): Public, Private, Storage, Management Network
    - 1G x 1: Admin Network
  - Size: 1U
- Storage Node: 3EA
  - CPU: 4C8T x 2way
  - RAM: 128GB
  - Storage
    - SSD 200GB x 1: OS
    - SSD 400GB x 2: Ceph Journal
    - HDD 1.2TB x 20: Ceph OSD
  - NIC
    - 10G x 2 (LACP): Management Network
    - 10G x 2 (LACP): Storage Network
    - 1G x 2: Admin Network
  - Size: 2U
- Telemetry Node (Optional): 1EA
  - CPU: 4C8T x 2way
  - RAM: 64GB
  - Storage:
    - SSD 200GB x 1: OS
    - SSD 400GB x 1: MongoDB
  - NIC
    - 10G x 1: Management Network
    - 1G x 1: Admin Network
  - Size: 1U
- Monitor Node (Optional): 1EA
  - CPU: 4C8T x 2way
  - RAM: 128GB
  - Storage:
    - SSD 200GB x 1: OS, Nagios
    - SSD 400GB x 2: InfluxDB, Elastic Search
  - NIC
    - 10G x 1: Management Network
    - 1G x 1: Admin Network
  - Size: 1U

## Scaling

환경에 따라 다르겠지만, Mirantis에서는 일반적으로 3개의 Controller 노드가 최대 100개의 Compute 노드를 서비스 할 수 있다고 한다.
만약 Compute 노드의 vCPU와 물리 코어의 비율을 4:1로 둔다면, 100개의 Compute 노드는 16Thread x 2way x 100개 노드 x 4Ratio = 12,800 vCPU를 제공할 것이다.
RAM 용량은 오버커밋 비율을 주지 않는 것을 추천하기 때문에 256GB x 100개 노드 = 25TB 메모리가 제공된다.

아래 표는 1개의 42U Full Rack에서 구성할 수 있는 노드와 해당 구성에 대한 VM 개수이다.
여기서 VM 사양은 vCPU 4개와 8GB RAM을 사용한다고 가정한다.

|                   | tiny | tiny+ | small | small+ | medium | medium+ |
|-------------------|------|-------|-------|--------|--------|---------|
| Controller 노드 개수 | 3   | 3     | 3     | 3      | 3      | 3       |
| Compute 노드 개수    | 6   | 8     | 12    | 16     | 20     | 24      |
| Storage 노드 개수    | 3   | 3     | 3     | 4      | 5      | 6       |
| 최대 VM 개수         | 192 | 256   | 384   | 512    | 640    | 768     |

medium+ 로 4개 랙까지는 현재의 Fuel 아키텍쳐로 가능할 것으로 예상되나, 성능에 여유를 두고자 한다면 3개 Rack 까지가 한계일 것이다.

