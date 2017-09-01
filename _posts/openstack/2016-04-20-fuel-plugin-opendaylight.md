---
layout: post
title: "fuel-plugin-opendaylight"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

[GitHub::fuel-plugin-opendaylight](https://github.com/openstack/fuel-plugin-opendaylight)

현재는 Fuel 8.0 Liberty 버전에서 설치가 가능하다.

## 빌드

다음은 별도의 Cent OS 7 + Docker 환경을 갖고있는 장비에서 빌드를 수행하였다. -- 서비스 중인 Fuel 노드에서 하지 말자. --

fpb(Fuel Plugin Builder)로 Docker 컨테이너를 생성하여 빌드를 하기 때문에 Docker 환경이 필요하다.

```bash
git clone https://github.com/openstack/fuel-plugin-opendaylight

yum install python-pip
pip install ipython==2.4.1
pip install fuel-plugin-builder

yum install ruby-devel rubygems
gem install fpm

fpb --debug --build fuel-plugin-opendaylight/
```

이 후, fuel-plugin-opendaylight/opendaylight-0.8-0.8.0-1.noarch.rpm 파일이 생성된다.

## 설치

Fuel 노드에 opendaylight-0.8-0.8.0-1.noarch.rpm 파일을 업로드 한 다음, 설치해준다.

```bash
fuel plugins --install opendaylight-0.8-0.8.0-1.noarch.rpm
```