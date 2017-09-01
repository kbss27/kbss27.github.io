---
layout: post
title: "CLI 사용을 위한 Shell Enviroment"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

## 문제 현상

Controller 노드 등에서 SSH로 접속 후 CLI 명령어를 입력하였으나 다음과 같은 오류 발생.

```bash
root@controller:~# nova list
ERROR (CommandError): You must provide a username or user id via --os-username, --os-user-id, env[OS_USERNAME] or env[OS_USER_ID]
```

## 해결책

```bash
root@controller:~# vi ~/.bash_profile

export OS_USERNAME=admin # 사용자명
export OS_TENANT_NAME=admin # Tenant명
export OS_PASSWORD=패스워드
export OS_AUTH_URL=http://10.10.10.3:35357/v2.0/ # Keystone 인증 URL

저장 후,

root@controller:~# source ~/.bash_profile
root@controller:~# nova list
+--------------------------------------+-----------------------------------+--------+------------+-------------+--------------------------------------------+
| ID                                   | Name                              | Status | Task State | Power State | Networks                                   |
+--------------------------------------+-----------------------------------+--------+------------+-------------+--------------------------------------------+
| eb1ec4df-cd98-418d-8eeb-55aaee3c15fa | ost1_test-server-smoke-1584046712 | BUILD  | spawning   | NOSTATE     | ost1_test-server-smoke-1584046712=10.0.7.3 |
+--------------------------------------+-----------------------------------+--------+------------+-------------+--------------------------------------------+
```

다른 사용자, 다른 Tenant를 관리해야한다면 수정해주어야 한다.