---
layout: post
title: "Fuel for OpenStack 소개"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

## Introduction

많은 기업이나 개인들이 [OpenStack](https://www.openstack.org)에 관심은 많지만, 이를 설치하는 것은 쉽지 않은 일이다.
OpenStack을 이루는 구성 요소가 1\~2개가 아니며, 설치해야 할 서버도 여러대이기 때문이다. 서버 10대로 OpenStack 시스템을 구축한다고 쳤을 때, OS 설치만해도 1\~2일은 소요될 것이다.
여기에 Keystoen, Neutron, Nova 등 OpenStack 구성 요소 또한 설치 및 설정을 진행하면 일주일은 손쉽게 지나간다. 가장 큰 문제는 이 모든 일을 사람이 한다는 것이다.
사람이 하다보면 실수가 있기마련인데 다수의 구성 요소 및 시스템으로 이루어진 OpenStack에서, 이를 디버깅하고 오류를 고쳐나간다는 것은 많은 지식과 시간이 필요하다.
때문에 OpenStack을 처음 접하게되는 이들은 설치 단계에서부터 많은 어려움을 토하고 있다.


## Fuel for OpenStack

[Fuel for OpenStack](https://www.mirantis.com/products/mirantis-openstack-software/)은 Mirantis가 주도하는 OpenStack 자동 배포 솔루션이다.
물론 오픈 소스이다. 이를 이용하면 웹 UI로 손쉽게 OpenStack을 설치할 수 있다. 현재는 OpenStack Liberty 버전의 설치를 지원하고 있다.
Fuel은 다음 기능과 특성으로 여러대의 서버에 OS 및 OpenStack 자동 배포를 가능케한다.


### Web UI를 통한 OpenStack 프리셋 설정

사용자는 자동 배포를 진행하기 전에 노드나 네트워크, OpenStack 설정들을 Web UI를 통해 설정할 수 있다. 이런 설정들 이후에 OS Provision과 OpenStack Deploy를 자동으로 시작하게 된다.

![fuel_intro_node](/media/openstack/fuel_intro_node.png)
![fuel_intro_disk](/media/openstack/fuel_intro_disk.png)
![fuel_intro_nic](/media/openstack/fuel_intro_nic.png)
![fuel_intro_service](/media/openstack/fuel_intro_service.png)


### PXE + TFTP를 이용한 OS Provisioning

Fuel이 설치된 서버는 [Cobbler](http://cobbler.github.io)를 이용해 PXE 서버 역할을 한다.
동일 네트워크에서 OpenStack이 설치될 깡통(어떤 OS도 설치되지 않은) 서버를 PXE로 부팅시키면, Fuel로부터 기본적인 리눅스 이미지를 가져와 부팅을 진행하게된다.
이 후, OS Provision 과정에 따라 노드의 실제 디스크에 Ubuntu OS를 자동으로 설치하게된다.


### Puppet을 통한 OpenStack Deploy

OS Provision 이 후, 각 노드들은 Puppet 배포/설정 자동화 스크립트를 시작하여 OpenStack 구성 요소를 설치하고 설정 또한 진행하게 된다.
자동으로 진행되기 때문에 배포가 끝날 때까지 느긋하게 기다려주면 된다. 


### OSTF를 이용한 설치 이후 테스트

OpenStack 배포가 완료되고나서 제대로 설치되고 잘 작동하는지 검증이 필요하다. 이 또한 미리 만들어져있는 테스트 스크립트를 통해 기능들을 점검하게 된다.

![fuel_intro_healthcheck](/media/openstack/fuel_intro_healthcheck.png)


## Conclusion

배포 자동화에는 Fuel 말고도 [RDO Project](https://www.rdoproject.org)나 상용 솔루션들도 존재하는데,
Fuel은 오픈 소스이기도 하고 프로젝트가 오랜 기간 진행되어왔기 때문에 배포 성공률 및 문서화 수준이 높은 편이다.
특히 Web UI를 기본으로 제공해주기 때문에 좀 더 쉽게 OpenStack 배포를 진행할 수 있다.
배포에 쓰이는 모든 스크립트가 오픈되어 있기 때문에 Puppet 작성법과 Fuel의 배포 과정을 담고 있는 Task Graph를 이해한다면,
자신만의 설정을 담고있는 OpenStack 시스템을 구축하고 운영 또한 스크립트로 진행할 수 있다.

현재 우리나라의 OpenStack 커뮤니티 등에서는 Fuel과 관련된 의견이나 질답이 오고가지 않아서 해외 커뮤니티를 참고해야한다는 단점이 있으나,
그럼에도 불구하고 OpenStack 자동 배포에 있어서 Fuel for OpenStack은 매력적이다.


## Links

- [Fuel for OpenStack](https://www.mirantis.com/products/mirantis-openstack-software/)
- [Mirantis OpenStack Documentation Center](https://docs.mirantis.com/openstack/fuel/fuel-8.0/)
- [Launchpad 이슈 트래커 - Fuel for OpenStack](https://launchpad.net/fuel)
- [OpenStack GitHub](https://github.com/openstack)
- [작성자의 OpenStack 관련 위키](https://github.com/inter6/wiki/tree/master/OpenStack)