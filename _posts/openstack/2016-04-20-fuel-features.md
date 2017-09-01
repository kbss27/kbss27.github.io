---
layout: post
title: "Fuel Features"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

Fuel 설치시 추가적으로 Advanced와 Experimental features를 활성화 할 수 있는데, 다음 기능들이 적용된다.

> 아래는 Fuel 7.0 Kilo 기준으로 작성되었다.


## Advanced features

Reduced footprint feature

- 모든 노드에 VM을 생성시킬 수 있는 기능
- 다음과 같은 환경에서 쓸만하나, Mirantis에서 지원하는 영역은 아님
  - 적은 노드들로 클러스터를 구성했을 때
  - 컨트롤러나 모니터링 노드 등에 VM을 생성시키고 싶을 때


## Experimental features

Murano

- 애플리케이션의 Versioning을 지원. 유저는 서로 다른 버전의 애플리케이션을 사용할 수 있음.
- Glance v3 API를 이용하여 팩키지 스토리지에 대한 백엔드 지원. 이걸 사용할려면 수동으로 Glance의 V3를 활성화하고 Murano도 V3를 사용하겠다고 활성화해야 함.
- Cloud Foundry의 카탈로그를 사용할 수 있음.

Enable Ubuntu bootstrap

- Fuel 7.0부터는 기본적으로 CentOS 부트스트랩을 사용하고 있는데, 우분투 부트스트랩을 사용할 수 있음

NIC bonding in LACP mode

- NIC 본딩 설정시 LACP 모드를 사용할 수 있음. (Fuel 8.0부터는 기본 기능)
