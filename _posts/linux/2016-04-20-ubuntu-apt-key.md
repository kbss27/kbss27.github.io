---
layout: post
title: "Ubuntu APT Repository 공개키 등록"
date: 2016-04-20
categories: linux
---

* content
{:toc}

## 문제 현상

```bash
root@controller001:~# apt-get update
...
W: GPG error: http://mirror.fuel-infra.org mos7.0-holdback Release: The following signatures couldn't be verified because the public key is not available: NO_PUBKEY CA2B20483E301371
W: GPG error: http://mirror.fuel-infra.org mos7.0-security Release: The following signatures couldn't be verified because the public key is not available: NO_PUBKEY CA2B20483E301371
W: GPG error: http://mirror.fuel-infra.org mos7.0-updates Release: The following signatures couldn't be verified because the public key is not available: NO_PUBKEY CA2B20483E301371
```

## 해결책

```bash
root@controller001:~# apt-key adv --keyserver keyserver.ubuntu.com --recv-keys CA2B20483E301371
```