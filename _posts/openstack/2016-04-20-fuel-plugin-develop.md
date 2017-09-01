---
layout: post
title: "Fuel Plugin 개발"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

## Introduction

Fuel은 6.0/Juno부터 플러그인 기능을 지원한다.
플러그인을 통해 Fuel에서 지원하는 기본 설정들 외의 커스텀 설정 등을 배포할 수 있다.
Fuel이 가지고있는 노드들의 정보와 배포 환경 등을 플러그인에서도 사용할 수 있으므로, 플러그인에서 별도로 노드 정보/환경들을 Detection 할 필요가 없다.

Fuel 플러그인을 사용함에 따른 이점은 다음과 같다.

- 매뉴얼로 진행되는 복잡한 배포 수행 절차를 자동화한다.
- Human Error를 줄인다.
- 배포 실패와 불안정함, 보안 문제를 줄인다.

사용자는 플러그인을 개발할 수 있으며, 플러그인 개발에 관련한 문서들을 제공하고 있다.

[Fuel/Plugins - OpenStack Docs](https://wiki.openstack.org/wiki/Fuel/Plugins)

플러그인은 주로 Puppet과 Python으로 개발되나 필수는 아니며 여러 언어들을 사용할 수 있다.
또한 Major/Minor Version을 매길 수 있으며 Fuel-master 노드에서 yum을 이용하여 플러그인의 설치/업그레이드를 진행한다.
플러그인 개발시 주의할 점은 모든 코드는 멱등성(idempotent)을 지켜야한다.

또한 다음과 같은 제한을 가지고 있다.

- OpenStack 코어 기능을 핸들하는 플러그인은 Environment가 배포된 이후에는 설치는 가능해도 Environment Task에 추가되지 않으므로 작동하지 않는다.
이 경우에는 Environment를 새로 구성하여야 한다.
- Application 레벨의 플러그인은 배포 이후에도 Environment Task에 추가되어 플러그인 코드들이 수행될 수 있다.
- 다른 Major 버전으로 업그레이드는 불가하다.
- SDN 관련 플러그인을 개발할 경우, Fuel UI에 새로운 네트워크 옵션을 만들 수 없다는 점에 주의.

배포 이후에 설치/작동할 수 있는 플러그인은 Application 레벨의 플러그인으로 다음과 같은 특징을 갖는다.

- 새로운 App을 배포
- 새로운 노드에 App을 설치
- 기존에 작동하고있는 서비스나 App을 건드리지 않는다.
- 기존에 존재하는 Fuel Task들을 건드리지 않는다.
- metadata.yaml 파일에 is_hotpluggable = true 속성을 가지고 있다.

다음은 현재 GitHub에 있는 Core 레벨 플러그인과 Application 레벨 플러그인 목록이다. (일부)

### Core Level Fuel Plugins

- [fuel-plugin-nsxv](https://github.com/openstack/fuel-plugin-nsxv) : Fuel plugin for NSX-V integration
- [fuel-plugin-external-emc](https://github.com/openstack/fuel-plugin-external-emc) : Fuel plugin for Cinder with EMC integration
- [fuel-plugin-vmware-dvs](https://github.com/openstack/fuel-plugin-vmware-dvs) : Fuel plugin for VMware DVS integration
- [fuel-plugin-xenserver](https://github.com/openstack/fuel-plugin-xenserver) : Fuel plugin for XenServer integration
- [fuel-plugin-opendaylight](https://github.com/openstack/fuel-plugin-opendaylight) : Fuel plugin for OpenDaylight integration
- [fuel-plugin-calamari](https://github.com/openstack/fuel-plugin-calamari) : Fuel plugin for Calamari integration
- [fuel-plugin-dbaas-trove](https://github.com/openstack/fuel-plugin-dbaas-trove) : Fuel plugin which enables option to deploy Trove
- [fuel-plugin-ceilometer-redis](https://github.com/openstack/fuel-plugin-ceilometer-redis) : Fuel plugin to enable central agent HA and workload partitioning
- [fuel-plugin-ovs](https://github.com/openstack/fuel-plugin-ovs) : Fuel plugin to deploy OVS with NSH and DPDK
- [fuel-plugin-external-lb](https://github.com/openstack/fuel-plugin-external-lb) : Fuel plugin to enable use of external LB instead of default VIPs and HAproxy
- [fuel-plugin-neutron-fwaas](https://github.com/openstack/fuel-plugin-neutron-fwaas) : Fuel plugin for FWaaS for Neutron
- [fuel-plugin-neutron-lbaas](https://github.com/openstack/fuel-plugin-neutron-lbaas) : Fuel plugin for LBaaS for Neutron
- [fuel-plugin-neutron-vpnaas](https://github.com/openstack/fuel-plugin-neutron-vpnaas) : Fuel plugin for VPNaaS for Neutron
- [fuel-plugin-availability-zones](https://github.com/openstack/fuel-plugin-availability-zones) : Fuel plugin to manage availability zones
- [fuel-plugin-glance-nfs](https://github.com/openstack/fuel-plugin-glance-nfs) : Fuel plugin for nfs as storage backend for images (glance)

### Application Level Fuel Plugins

- [fuel-plugin-lma-collector](https://github.com/openstack/fuel-plugin-lma-collector) : Fuel plugin to collect Logging Monitoring and Alerting metrics
- [fuel-plugin-lma-infrastructure-alerting](https://github.com/openstack/fuel-plugin-lma-infrastructure-alerting) : The LMA Infrastructure Alerting plugin installs necessary tools to provide the alerting functionality of the LMA toolchain
- [fuel-plugin-elasticsearch-kibana](https://github.com/openstack/fuel-plugin-elasticsearch-kibana) : Integrate Elasticsearch and Kibana with Fuel
- [fuel-plugin-influxdb-grafana](https://github.com/openstack/fuel-plugin-influxdb-grafana) : Fuel plugin to manage InfluxDB and Grafana


## 개발 환경

Ubuntu 14.04, CentOS 6.5에서 개발을 시작할 수 있으며 여기서는 Ubuntu 14.04 기준으로 설명한다.

```bash
# 기본 개발 환경 설치
apt-get install createrepo rpm dpkg-dev python-setuptools git

# Fuel Plugin Builder 설치 (GitHub에 있는 최신 FPB 설치)
easy_install pip
git clone https://github.com/stackforge/fuel-plugins.git
cd fuel-plugins
python setup.py develop
```

### 프로젝트 생성

FPB로 프로젝트 디렉토리를 생성한다.

```bash
# Usage: fpb --create {fuel_plugin_name}
fpb --create fuel-plugin-example
```

최신 FPB로 생성하였기 때문에 기본적으로 Fuel 9.0/Mitaka에서 작동하게끔 만들어진다.
Fuel 8.0/Liberty를 사용한다면 ```metadata.yaml``` 파일의 내용을 다음과 같이 변경한다.

```yaml
fuel_version: ['8.0']
releases:
  - os: ubuntu
    version: liberty-8.0	# 최초에는 mitaka-9.0 이였다.
    mode: ['ha']
    deployment_scripts_path: deployment_scripts/
    repository_path: repositories/ubuntu
```

이 후 생성된 디렉토리를 Repository로 업로드한다. 다음은 Git Repo로 Push하는 절차이다.

```bash
cd fuel-plugin-example
git init
git add -A
git commit -m "Create Fuel Plugin Project"
git remote add origin https://github.com/inter6/fuel-plugin-example.git
git push -u origin master
```

### 프로젝트 빌드

```bash
# Usage: fpb --debug --build {fuel_plugin_name}
fpb --debug --build fuel-plugin-example
```

프로젝트 디렉토리 내에 플러그인 RPM이 생성되며, 해당 RPM을 Fuel-master 노드에 설치하여 플러그인을 사용할 수 있다.


## 프로젝트 구성

```bash
root@fuel-plugin-develop:~/fuel-plugin-example# tree
.
├── components.yaml # 다른 컴포넌트들과의 호환성을 정의하는 파일
├── deployment_scripts # Puppet 및 쉘 스크립트 등 Task가 수행하는 파일들을 넣어두는 디렉토리
├── deployment_tasks.yaml # Task를 정의하는 파일
├── environment_config.yaml # Fuel Wed UI에 표시되어 사용자로부터 설정값을 받게끔 정의하는 파일
├── metadata.yaml # 플러그인에 대한 메타데이터를 정의하는 파일
├── network_roles.yaml # 새로운 네트워크 Role을 정의하는 파일
├── node_roles.yaml # 새로운 노드 Role을 정의하는 파일
├── pre_build_hook # 플러그인 빌드에 사용하는 스크립트
├── repositories # 플러그인이 필요로하는 팩키지 파일들을 넣어두는 디렉토리
│   ├── centos
│   └── ubuntu
├── tasks.yaml # 더 이상 사용하지않는 파일 (deprecated)
└── volumes.yaml # 새로운 노드 Role을 정의했을 때, 해당 Role이 필요로하는 볼륨 및 크기를 정의하는 파일
```

### deployment_tasks.yaml

플러그인의 Task들을 정의해두는 파일이다. 이 파일에 정의된 Task가 기본 Task에 추가되어 배포가 이루어진다.
Task는 다음과 같은 속성들을 담고 있다.

- Example

```yaml
- id: fuel-plugin-etckeeper-install	# Task의 이름
  type: puppet	# Task가 수행하는 일의 종류
  version: 2.0.0
  role: '*'	# Task가 수행되는 노드의 Role
  required_for: [post_deployment_end]	# 이 Task를 필요로하는 Task의 이름들
  requires: [enable_quorum]	# 이 Task가 실행하기 앞서 실행이 필요한 Task의 이름들
  parameters:
    puppet_manifest: 'etckeeper_install.pp'	# (type: puppet일 경우) Task가 실행하는 Puppet 파일
    puppet_modules: '/etc/puppet/modules'	# (type: puppet일 경우) Puppet의 모듈 위치
    timeout: 600	# Puppet이 종료될 때까지 기다리는 시간
    cwd: /	# Puppet 수행시의 작업 디렉토리
```

그 외의 속성에 대한 내용은 다음 링크를 참고한다. [deployment_tasks.yaml - OpenStack Docs](https://wiki.openstack.org/wiki/Fuel/Plugins#deployment_tasks.yaml)


### environment_config.yaml

사용자로부터 설정값을 받을 필요가 있을 경우, Fuel Web에서 설정값을 받을수있는 UI 컴포넌트를 정의할 수 있다.

- Example

```yaml
attributes:
  vcs:
    label: "Version Control System"
    description: "VCS system to use to track changes"
    weight: 25
    type: "radio"
    value: "git"
    values:
      - data: "git"
        label: "Git"
      - data: "bzr"
        label: "Bazaar"
      - data: "hg"
        label: "Mercurial"
```

사용 가능한 UI 정의는 다음 링크를 참고한다. [Plugin elements in the Fuel web UI - OpenStack Docs](https://wiki.openstack.org/wiki/Fuel/Plugins#Plugin_elements_in_the_Fuel_web_UI)


## LBaaS v1 플러그인 개발 예제

Neutron의 LBaaS v1 기능을 활성화하는 플러그인을 예제로 개발해본다.
이미 [fuel-plugin-neutron-lbaas](https://github.com/openstack/fuel-plugin-neutron-lbaas) 플러그인이 존재하나 Fuel 8.0/Liberty에서는 작동하지 않으므로 새롭게 개발해본다.
주의할 점은 이 예제에서는 Environment가 배포된 상황에서 LBaaS를 활성화하기 위해, Core 레벨이 아닌 Application 레벨의 플러그인으로 개발하고자 한다.

### 준비물

- Ubuntu 14.04가 설치되어있는 환경
- Fuel 8.0/Liberty Environment가 배포되어있는 환경
- Git Repository


### 프로젝트 생성

FPB로 neutron-lbaas-v1 라는 이름의 프로젝트를 생성한다. 생성 이후 Git Repo로 Push 하였다.

```bash
fpb --create neutron-lbaas-v1
cd neutron-lbaas-v1
git init
git add -A
git commit -m "Create Fuel Plugin Project"
git remote add origin https://github.com/inter6/fuel-plugin-lbaas-v1.git
git push -u origin master
```

플러그인의 정보를 담고있는 ```metadata.yaml``` 파일을 다음과 같이 수정하였다.

```yaml
# Plugin name
name: neutron-lbaas-v1
# Human-readable name for your plugin
title: Neutron LBaaSv1 Plugin
# Plugin version
version: '1.0.0'
# Description
description: Enable/Disable Neutron LBaaSv1
# Required fuel version
fuel_version: ['8.0']
# Specify license of your plugin
licenses: ['Apache License Version 2.0']
# Specify author or company name
authors: ['inter6 <inter6@naver.com>']
# A link to the plugin's page
homepage: 'https://github.com/inter6/fuel-plugin-lbaas-v1'
# Specify a group which your plugin implements, possible options:
# network, storage, storage::cinder, storage::glance, hypervisor,
# equipment
groups: ['network']
# Change `false` to `true` if the plugin can be installed in the environment
# after the deployment.
is_hotpluggable: true

# The plugin is compatible with releases in the list
releases:
  - os: ubuntu
    version: liberty-8.0
    mode: ['ha']
    deployment_scripts_path: deployment_scripts/
    repository_path: repositories/ubuntu

# Version of plugin package
package_version: '4.0.0'
```

Fuel Web UI에 LBaaS를 활성화할지에 대한 체크박스를 표시하기위해 ```environment_config.yaml```을 수정하였다.
또한 Neutron을 사용했을 때만 플러그인을 사용할 수 있도록 restrictions도 추가하였다.

```yaml
attributes:
  metadata:
    # Settings group can be one of "general", "security", "compute", "network",
    # "storage", "logging", "openstack_services" and "other".
    group: 'network'
    restrictions:
      - condition: cluster:net_provider != 'neutron'
        message: "This environment not used Neutron"
  lbaas_enable:
    type: "checkbox"
    weight: 30
    value: false
    label: "Enable Neutron LBaaSv1"
    description: "Enable Neutron LBaaSv1"
```

현재 시점에서 빌드하고 설치를 수행해본다.

```bash
fpb --debug --build .
fuel plugins --install neutron-lbaas-v1-1.0-1.0.0-1.noarch.rpm --force
```

```environment_config.yaml```에서 ```network``` 그룹으로 지정하였기 때문에 네트워크 탭의 Other 메뉴에서 설정 UI가 표시되는 것을 확인할 수 있다.


### Task 생성

LBaaSv1를 활성화하기 위해서는 크게 4가지 스텝을 진행해야한다.

1. (모든 Controller 노드) LBaaS Agent 설치
2. (모든 Controller 노드) LBaaS 설정
3. (모든 Controller 노드) Horizon의 LB 패널 활성화
4. (모든 Controller 노드) neutron-lbaas-agent, neutron-server, apache 재시작

궃이 나눌 필요는 없어보이므로 1~4번을 모두 1개의 Task로 취급해도 무방하다.
다만 Neutron과 Horizon이 이미 설치되어 있어야 하기에 post_deployment_start와 post_deployment_end 사이에 Task를 추가하도록 하자.

```yaml
# These tasks will be merged into deployment graph. Here you
# can specify new tasks for any roles, even built-in ones.
- id: neutron-lbaas-v1
  version: 2.0.0
  requires: [post_deployment_start]
  required_for: [post_deployment_end]
  role: [controller]
  type: puppet
  parameters:
    puppet_manifest: neutron_lbaas_v1.pp
    puppet_modules: /etc/puppet/modules
    timeout: 300
```

마지막으로 deployment_scripts 디렉토리에 LBaaS를 활성화하는 neutron_lbaas_v1.pp를 생성한다.

```puppet
TODO
```


### Task 실행

TODO