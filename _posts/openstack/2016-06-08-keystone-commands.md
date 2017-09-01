---
layout: post
title: "Keystone 관련 명령어 모음"
date: 2016-06-08
categories: openstack
---

* content
{:toc}

### Endpoint 변경

```
keystone endpoint-delete e07374363cd1444a8b300524b7983924

keystone endpoint-create \
--region RegionOne \
--publicurl https://cloud.inter6.com:9696 \
--internalurl http://10.10.10.2:9696 \
--adminurl http://10.10.10.2:9696 \
--service-id fdd6f8063f164ced83861ee4248fe2fb
```