---
layout: post
title: "fuel-plugin-openldap"
date: 2016-07-04
categories: openstack
---

* content
{:toc}

## Intro

[GitHub::fuel-plugin-openldap](https://github.com/Mirantis/fuel-plugin-openldap.git)

OpenLDAP 노드를 구축하고 이를 Keystone 백엔드로 사용하게 해주는 플러그인.
OpenLDAP 노드를 구축해주기 때문에 기존에 LDAP 서버가 없어도 되나, OpenLDAP이 설치될 물리 노드가 있어야 한다.

Fuel/7.0-Kilo 버전에서만 사용할 수 있으나 딱히 Kilo 버전이여만하는 디펜던시는 없다.
때문에 ```metadata.yaml```을 수정하여 Fuel/8.0-Liberty 버전에도 사용할 수 있게 수정하면 된다.

노드 Role은 ```openldap``` 하나가 추가되며, 그룹은 LDAP 마스터 역할의 ```primary-openldap```과 슬레이브인 ```openldap```이 추가된다.
LDAP 마스터를 Enviroment 내에서 자체 구축할지, 아니면 외부 LDAP 서버를 마스터로 쓸지 선택할 수 있다.

Task는 다음 순서로 추가된다.

- openldap 노드: hosts -> ```openldap-master``` -> deploy_end
- primary-controller 노드: keystone -> ```openldap-slave``` -> openstack-cinder

코어 플러그인이기 때문에 Enviroment 배포 이후에는 추가/수정할 수 없다.


## 수정

Fuel/8.0-Liberty 버전에서 배포하기 위해, 다음 패치 내용과 같이 ```metadata.yaml``` 파일을 수정한다.

```
diff --git a/metadata.yaml b/metadata.yaml
index 902899d..c4a5c04 100644
--- a/metadata.yaml
+++ b/metadata.yaml
@@ -7,7 +7,7 @@ version: '1.2.0'
 # Description
 description: 'Enable to configure and install standalone OpenLDAP server/auth'
 # Required fuel version
-fuel_version: ['7.0']
+fuel_version: ['7.0', '8.0']
 # Specify license of your plugin
 licenses: ['Apache License Version 2.0']
 # Specify author or company name
@@ -23,6 +23,11 @@ releases:
     mode: ['ha', 'multinode']
     deployment_scripts_path: deployment_scripts/
     repository_path: repositories/ubuntu
+  - os: ubuntu
+    version: liberty-8.0
+    mode: ['ha', 'multinode']
+    deployment_scripts_path: deployment_scripts/
+    repository_path: repositories/ubuntu

 # Version of plugin package
 package_version: '3.0.0'
```


## 빌드

별도의 노드에서 fpb로 빌드해준다.

```bash
yum install python-pip
pip install fuel-plugin-builder

fpb --debug --build fuel-plugin-openldap
```

이 후, 빌드된 ```fuel-plugin-openldap/openldap-1.2-1.2.0-1.noarch.rpm``` 파일을 Fuel 노드로 업로드한다.


## 설치

Fuel 노드에서 다음 명령어로 설치해준다.

```
fuel plugins --install openldap-1.2-1.2.0-1.noarch.rpm
```
