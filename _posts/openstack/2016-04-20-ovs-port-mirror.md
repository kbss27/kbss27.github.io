---
layout: post
title: "Open vSwitch 포트 미러링"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

Open vSwitch 에서 흐르는 패킷을 확인하고자 할 때, OVS 포트에 대한 미러링 포트를 생성하여 tcpdump 등으로 패킷을 확인할 수 있다.

## 미러링 포트 추가

아래 예제는 br-int 포트를 미러링하는 mirror-tun 포트를 생성한다.

```bash
ip link add name mirror-tun type dummy
ip link set dev mirror-tun up
ovs-vsctl add-port br-int mirror-tun

ovs-vsctl -- set Bridge br-int mirrors=@m  -- --id=@mirror-tun \
get Port mirror-tun  -- --id=@patch-tun get Port patch-tun \
-- --id=@m create Mirror name=mirror-tun select-dst-port=@patch-tun \
select-src-port=@patch-tun output-port=@mirror-tun select_all=1
```

## 미러링 포트로부터 패킷 확인

```bash
tcpdump -i mirror-tun
```

## 미러링 포트 삭제

```bash
ovs-vsctl del-port br-int mirror-tun
ip link del mirror-tun
```