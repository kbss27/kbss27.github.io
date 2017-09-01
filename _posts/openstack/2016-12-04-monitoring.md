---
layout: post
title: "OpenStack Monitoring"
date: 2016-12-04
categories: openstack
---

* content
{:toc}

## Introduction

이 문서는 Mirnatis 사의 ```Mirantis OpenStack Monitoring Guide``` 문서를 기반으로,
OpenStack 플랫폼과 관련된 프로세스와 Metric 등의 모니터링 방법을 소개한다.


## Keystone

Keystone은 사용자 및 OpenStack 서비스에 대한 ID, 토큰, 카탈로그 및 정책 서비스를 제공하는 서비스이다.
따라서 모든 OpenStack 서비스의 가용성은 Keystone의 가용성에 달려 있다.

### Process Checks

| 프로세스명 | 바인드 포트 | Role | Dependencies | HA mode |
|:--|:--|:--|:--|:--|
| keystone-all | HTTP 5000 (public), 35357 (admin) | controller | db, memcached, Apache | active/active |

### Metrics

| Metrics | Source | 비고 |
|:--|:--|:--|
| 인증 오류 | 로그: ```POST /v2.0/tokens HTTP/1.1" 401 330 0.205647```에서 401 코드는 인증 오류를 나타낸다. | 빈번히 지속적으로 발생한다면 무차별 대입 공격일 수 있다. |
| 인증 응답 시간 | 로그: ```POST /v2.0/tokens HTTP/1.1" 200 4199 0.092479```에서 0.092479은 초 단위의 응답 시간이다. | |
| 토큰 Validation 오류 | 로그: ```/v3/auth/tokens HTTP/1.1" 404 7317 0.071319```에서 404 코드는 토큰 Validation 오류를 나타낸다. | |
| 토큰 Validation 응답 시간 | 로그: ```/v3/auth/tokens HTTP/1.1" 200 7317 0.071319```에서 0.071319은 초 단위의 토큰 Validation 응답 시간이다. | |
| 유저 개수 | API 폴링: ```/v2.0/users``` | |
| 프로젝트 개수 | API 폴링: ```/v2.0/tenants``` | |
| API 오류 | 로그 또는 HAProxy 로그: 모든 HTTP 500 오류 | |


## Nova

Nova는 VM을 실행하거나 VM과 관련된 여러 오퍼레이션을 수행하는 서비스이며 여러 프로세스로 구성되어 있다. 각 프로세스는 특정한 기능을 수행하며 컨트롤러 노드와 컴퓨팅 노드에 분산되어있다.

### Process Checks

| 프로세스명 | 바인드 포트 | Role | Dependencies | HA mode |
|:--|:--|:--|:--|:--|
| nova-api | HTTP 8774 (Nova API), 8773 (Nova EC2 API) | controller | amqp | active/active |
| nova-scheduler | RPC | controller | amqp | active/active |
| nova-conductor | RPC | controller | db, amqp | active/active |
| nova-consoleauth | RPC | controller | amqp | active/active |
| nova-console | RPC | controller | amqp | active/active |
| nova-novncproxy | RPC | controller | amqp | active/active |
| nova-cert | RPC | controller | amqp | active/active |
| nova-compute | RPC | compute | libvirt | not available |

### Metrics

몇몇 Metric은 SQL 쿼리로 수집하는 것이 속도 및 오버헤드에 유리하기도 하다. 단점은 업그레이드로 인해 스키마가 변경되면 제대로 작동하지 않을 것이다.

| Metrics | Source | 비고 |
|:--|:--|:--|
| 오류 상태의 VM 개수 | SQL 폴링: ```select count(*) from instances where vm_state='error' and deleted=0``` 또는 API 폴링: ```/v2/{tenant_id}/servers/detail/?all_tenan t=1``` | 유저의 잘못된 액션으로도 발생할 수 있다. |
| 비운영 상태의 Compute 노드 개수 | API 폴링: ```/v2/{tenant_id}/os-services``` 또는 SQL 폴링: ```select count(services.id) from services where disabled=0 and deleted=0 and services.binary = ‘nova-compute' and ti mestampdiff(SECOND,updated_at,utc_ti mestamp())>60``` | 비운영 상태인 Compute 노드 개수가 많으면 매우 심각한 문제가 발생하고 있는 상황이다. |
| 오프라인 상태의 서비스 개수 | API 폴링: ```/v2/{tenant_id}/os-services``` 또는 SQL 폴링: ```select count(*) from services where disabled=1 and deleted=0 and ti mestampdiff(SECOND,updated_at,utc_ti mestamp())>60``` | 오프라인 상태인 서비스 개수가 많으면 매우 심각한 문제가 발생하고 있는 상황이다. |
| Compute 노드별 VM 개수 | API 폴링: ```/v2/{tenant-id}/os-hypervisors/detail``` | |
| vCPU 총 개수 | SQL 폴링: ```select ifnull(sum(vcpus), 0) from compute_nodes where deleted=0``` 또는 API 폴링: ```/v2/{tenant_id}/os-hypervisors/statistics``` | |
| 남아있는 vCPU 개수 | API 폴링: ```/v2/{tenant_id}/os-hypervisors/statistics``` 이 후 이전 값으로부터 계산한다. | vCPU에 여유가 없으면 당장 Compute 노드를 추가할 필요가 있다. |
| vRAM 총 용량 | SQL 폴링: ```select ifnull(sum(memory_mb), 0) from compute_nodes where deleted=0``` 또는 API 폴링: ```/v2/{tenant_id}/os-hypervisors/statistics``` | |
| 남아있는 vRAM 용량 | API 폴링: ```/v2/{tenant_id}/os-hypervisors/statistics``` 이 후 이전 값으로부터 계산한다. | vRAM에 여유가 없으면 당장 Compute 노드를 추가할 필요가 있다. |
| API 오류 | 로그 또는 HAProxy 로그: 모든 HTTP 500 오류 | |


## Neutron

Neutron은 Nova와 같은 다른 OpenStack 서비스가 관리하는 vNIC 간의 네트워크 연결을 제공하는 서비스이다.

### Process Checks

| 프로세스명 | 바인드 포트 | Role | Dependencies | HA mode |
|:--|:--|:--|:--|:--|
| neutron-server | HTTP 9696 | controller | db, amqp | active/active |
| neutron-dhcp-agent | RPC | active controller | amqp, dnsmasq | active/passive |
| neutron-l3-agent | RPC | active controller | db, iptables | active/passive |
| neutron-metadata-agent | RPC | compute | amqp, db | active/active |
| neutron-ns-metadata-proxy | RPC | controller | amqp, db | active/passive |
| neutron-openvswitch-agent | RPC | 모든 노드 | amqp, ovs | active/passive |
| dnsmasq | UDP 67 | controller | | active/passive |
| ovsdb-server | | 모든 노드 | | not available |
| ovs-vswitchd | | 모든 노드 | | not available |

neutron-dhcp-agent는 VM의 DHCP 요청을 처리하기 위해 dnsmasq을 사용한다. DHCP를 사용하는 경우, 테넌트 네트워크 당 하나 이상의 dnsmasq 프로세스가 있어야한다.

### Metrics

| Metrics | Source | 비고 |
|:--|:--|:--|
| 네트워크 개수 | API 폴링: ```GET /v2.0/networks``` | Active 상태의 네트워크 개수가 적으면 심각한 문제가 발생하고 있는 것일 수 있다. |
| 서브넷 개수 | API 폴링: ```GET /v2.0/subnets``` | |
| 라우터 개수 | API 폴링: ```GET /v2.0/routers``` | |
| 포트 개수 | API 폴링: ```GET /v2.0/ports``` | |
| API 오류 | 로그 또는 HAProxy 로그: 모든 HTTP 500 오류 | |

OVS의 인터페이스별 오류 패킷 수를 수집하는 것도 좋은 방법이나, 완전한 서비스 오류를 나타내는 것은 아니다. OVS 로그는 ```/var/log/openvswitch/``` 에 저장된다.


## Glance

Glance는 VM 이미지 또는 인스턴스 스냅샷을 업로드할 수 있는 서비스이다.

### Process Checks

| 프로세스명 | 바인드 포트 | Role | Dependencies | HA mode |
|:--|:--|:--|:--|:--|
| glance-api | 9292 | controller | db, amqp | active/active |
| glance-registry | 9191 | controller | db, amqp, storage | active/active |

### Metrics

| Metrics | Source |
|:--|:--|
| Active 이미지 개수 | API 폴링: ```/v2/images``` |
| Active 이미지의 총 용량 | API 폴링: ```/v2/images?visibility=public&status=active``` |
| API 오류 | 로그 또는 HAProxy 로그: 모든 HTTP 500 오류 |


## Cinder

Cinder는 VM이 사용하는 블록 스토리지를 제공하는 서비스이다.

| 프로세스명 | 바인드 포트 | Role | Dependencies | HA mode |
|:--|:--|:--|:--|:--|
| cinder-api | 8776 | controller | db, amqp | active/active |
| cinder-scheduler | RPC | controller | amqp | active/active |
| cinder-volume | RPC | storage-cinder | db, amqp, storage | 백엔드로 Ceph을 사용할 경우: active/active 또는 LVM을 사용할 경우: n/a |

| Metrics | Source |
|:--|:--|
| 오류 상태의 볼륨 개수 | SQL 폴링: ```select count(*) from volumes where status='error'``` |
| 삭제 중인 볼륨 개수 | SQL 폴링: ```select count(*) from volumes where status='deleting'``` |
| 진행 중인 스냅샷 개수 | SQL 폴링: ```select count(*) from snapshots where progress NOT LIKE '100%'``` |
| 삭제 중인 스냅샷 개수 | SQL 폴링: ```select count(*) from snapshots where status='deleting'``` |
| 볼륨 총 개수 | SQL 폴링: ```select count(*) from volumes where deleted != 1``` |
| 볼륨 총 용량 | SQL 폴링: ```select sum(size) from volumes where deleted != 1 and status = 'available'``` |
| API 오류 | 로그 또는 HAProxy 로그: 모든 HTTP 500 오류 |


## Swift

TODO


## Libvirt

Nova는 libvirt를 사용하여 인스턴스를 관리한다. libvirt 데몬은 모든 Compute 노드에서 실행 중이여야 하며, 그렇지 않으면 해당 노드에 VM을 생성할 수 없다.

### Process Checks

| 프로세스명 | 바인드 포트 | Role | HA mode |
|:--|:--|:--|:--|
| libvirtd | RPC | compute | n/a |


## HAProxy

TODO


## RabbitMQ

TODO


## MySQL

TODO


## Memcached

TODO


## Corosync/Pacemaker

TODO


## Ceph

TODO


## Hardware

TODO


## OS

TODO
