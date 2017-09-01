---
layout: post
title: "iptables 초기화"
date: 2016-10-01
categories: linux
---

* content
{:toc}

## Rule Save

```
iptables-save > /etc/sysconfig/iptables
```

## Rule Reset

```
iptables -P INPUT ACCEPT
iptables -P FORWARD ACCEPT
iptables -P OUTPUT ACCEPT
iptables -t nat -F
iptables -t mangle -F
iptables -F
iptables -X
```

## Rule Load

```
iptables-restore < /etc/sysconfig/iptables
```
