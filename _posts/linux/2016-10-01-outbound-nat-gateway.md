---
layout: post
title: "Outbound NAT Gateway 설정"
date: 2016-10-01
categories: linux
---

* content
{:toc}

## Enviroment

- 공인망에 연결된 eth0 이름의 NIC이 존재
- 사설망에 연결된 eth1 이름의 NIC이 존재, 네트워크가 10.0.0.0/24


## Enable IP Forwarding

```
sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.d/ip_forward.conf
```

## Enable NAT

```
firewall-cmd --permanent --direct --passthrough ipv4 -t nat -I POSTROUTING -o eth0 -j MASQUERADE -s 10.0.0.0/24
firewall-cmd --direct --add-rule ipv4 nat POSTROUTING 0 -o eth0 -j MASQUERADE
firewall-cmd --direct --add-rule ipv4 filter FORWARD 0 -i eth1 -o eth0 -j ACCEPT
firewall-cmd --direct --add-rule ipv4 filter FORWARD 0 -i eth0 -o ethic -m state --state RELATED,ESTABLISHED -j ACCEPT
firewall-cmd --reload
```
