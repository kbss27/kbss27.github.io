---
layout: post
title: "Fuel 플러그인 목록"
date: 2016-07-05
categories: openstack
---

* content
{:toc}

### Mirantis/fuel-plugin-openldap

https://github.com/Mirantis/fuel-plugin-openldap

OpenLDAP 노드를 배포하고 Keystone 백엔드로 LDAP을 사용할 수 있게하는 플러그인.


### Mirantis/fuel-plugin-etckeeper

https://github.com/Mirantis/fuel-plugin-etckeeper

etckeeper 팩키지를 설치하여 /etc 디렉토리에 대해 git init과 커밋을 수행한다.
이 후, 매번 Fuel Deploy가 일어날 때마다 커밋을 수행한다. 그러나 원격 Repo로 푸쉬하지는 않는다.


### openstack/fuel-plugin-lma-collector

https://github.com/openstack/fuel-plugin-lma-collector

LMA 툴체인 플러그인 중 하나.
노드/서비스들의 로그/모니터링/알람 정보를 수집하여 LMA 백엔드로 보내게 설정하는 플러그인


### openstack/fuel-plugin-lma-infrastructure-alerting

https://github.com/openstack/fuel-plugin-lma-infrastructure-alerting

LMA 툴체인 플러그인 중 하나.
Nagios 알람 서비스를 설치


### openstack/fuel-plugin-elasticsearch-kibana

https://github.com/openstack/fuel-plugin-elasticsearch-kibana

LMA 툴체인 플러그인 중 하나.
ElasticSearch 및 Kibana 서비스 설치


### openstack/fuel-plugin-influxdb-grafana

https://github.com/openstack/fuel-plugin-influxdb-grafana

LMA 툴체인 플러그인 중 하나.
InfluxDB 및 Grafana 서비스 설치


### Mirantis/fuel-plugin-backup

https://github.com/Mirantis/fuel-plugin-backup

Ceph, etc 디렉토리, Fuel, MySQL 데이터를 백업하는 플러그인.
Crontab에 백업을 수행하는 스크립트를 등록하며 스크립트 내용은 다음과 같다.

- Ceph: 각 이미지(볼륨)에 대해 스냅샷을 생성하고 파일르 Export 해둔다. 따로 다른 곳으로 업로드하지는 않는다.
- etc: etc 디렉토리를 tar로 묶고 Fuel 노드로 SCP 업로드한다.
- Fuel: fuel 디렉토리를 tar로 묶는다.
- MySQL: innobackupex 명령어로 증분 백업한 뒤, Fuel 노드로 업로드한다.

그러나 Fuel 스크립트가 Fuel/7.0-Kilo 이하 버전에 디펜던시가 있기 때문에 Fuel/8.0-Liberty 에서는 실행이 불가하다.
또한 모든 백업에 대한 공통 스크립트가 존재하는데 이 또한 Fuel/8.0-Liberty 에서는 실행할 수 없는 스크립트이다.


### openstack/fuel-plugin-calamari

https://github.com/openstack/fuel-plugin-calamari

Ceph 모니터링 툴인 Calamari 를 설치해주는 플러그인.
배포되는 Calamari 버전이 낮고, 플러그인 자체도 Fuel/7.0-Kilo 이하에서만 설치 가능한 구조라서 대대적인 수정이 필요하다.
