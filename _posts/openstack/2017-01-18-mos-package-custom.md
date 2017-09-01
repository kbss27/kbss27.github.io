---
layout: post
title: "Mirantis OpenStack 소스/팩키지 커스텀"
date: 2017-01-18
categories: openstack
---

* content
{:toc}

## Intro

Mirantis OpenStack 플랫폼은 [MOS APT Repository](http://mirror.fuel-infra.org/mos-repos/ubuntu/)에 있는 OpenStack 팩키지를 설치한다.
주로 Fuel 마이너 버전이 릴리즈될 때 최신 소스가 반영된 팩키지를 배포하는 것 같은데 대략 3개월 주기로 상당히 길다.
만약 현재 설치된 팩키지의 버그로 인해 방금 Merge된 최신 소스가 필요할 경우 3개월동안 기다릴 수는 없을 것이다.
수정된 몇몇 소스 파일만 교체해버릴 수도 있으나, 버전 관리나 배포에 있어서 좋은 방법은 아니다.

Fuel은 커스텀 소스를 위해 Fuel 노드에 사설 Repository를 제공하고 있으며, 이 Repo에 우리가 빌드한 팩키지를 넣어둘 수 있다.
(팩키지 버전은 살짜쿵 올려주어야 한다) 이 후에는 Fuel Task에 의해 모든 노드가 커스텀 팩키지로 APT 업데이트를 수행할 것이다.


## 팩키징

> 우분투를 많이 다뤄본 사람이라면 아래보다 좋은 방법으로 팩키징을 진행하실 듯 한데,
데비안 팩키징을 처음 해보는 입잡이라 무식한 방법으로 진행을 한다.

아래의 예제는 Cinder의 몇몇 소스를 수정하여 데비안 팩키징을 수행해본다.

```bash
root@jenkins-os:~# cd ~
root@jenkins-os:~# git clone https://github.com/openstack/cinder.git
root@jenkins-os:~# cd cinder/
root@jenkins-os:~/cinder# git checkout stable/mitaka

# 소스 수정 !
```


Step 1. 소스 수정 이후, 본격적인 팩키징에 들어가보자.
팩키징을 위해 팩키지에 대한 메타데이터 등을 담고있는 파일들이 필요한데, 일일이 작성하기보다는 이미 MOS Repo에 있는 기존 팩키지를 까보면 얻을 수 있다.

```bash
root@jenkins-os:~# cd ~
root@jenkins-os:~# mkdir build
root@jenkins-os:~# cd build/

root@jenkins-os:~/build# apt-get install devscripts
root@jenkins-os:~/build# dget http://mirror.fuel-infra.org/mos-repos/ubuntu/9.0/pool/main/c/cinder/cinder_8.1.0-6~u14.04%2bmos14.dsc --allow-unauthenticated

root@jenkins-os:~/build# ll
total 3840
drwxr-xr-x  3 root root    4096 Dec 20 07:25 ./
drwx------  7 root root    4096 Dec 20 07:21 ../
drwxr-xr-x 11 root root    4096 Dec 20 07:25 cinder-8.1.0/
-rw-r--r--  1 root root    3612 Dec 20 07:24 cinder_8.1.0-6~u14.04%2bmos14.dsc
-rw-r--r--  1 root root   38429 Dec 20 07:25 cinder_8.1.0-6~u14.04+mos14.debian.tar.gz
-rw-r--r--  1 root root 3872621 Dec 20 07:25 cinder_8.1.0.orig.tar.gz
```


Step 2. cinder_8.1.0-6~u14.04+mos14.debian.tar.gz 파일에 팩키징을 위한 debian 디렉토리가 들어있다.
이 debian 디렉토리를 현재 수정 중인 소스 디렉토리로 카피해온다.

```bash
root@jenkins-os:~/build# tar -xzvf cinder_8.1.0-6~u14.04+mos14.debian.tar.gz
root@jenkins-os:~/build# ll
total 3844
drwxr-xr-x  4 root root    4096 Dec 20 07:25 ./
drwx------  7 root root    4096 Dec 20 07:21 ../
drwxr-xr-x 11 root root    4096 Dec 20 07:25 cinder-8.1.0/
-rw-r--r--  1 root root    3612 Dec 20 07:24 cinder_8.1.0-6~u14.04%2bmos14.dsc
-rw-r--r--  1 root root   38429 Dec 20 07:25 cinder_8.1.0-6~u14.04+mos14.debian.tar.gz
-rw-r--r--  1 root root 3872621 Dec 20 07:25 cinder_8.1.0.orig.tar.gz
drwxr-xr-x  6 root root    4096 Sep  9 17:42 debian/

root@jenkins-os:~/build# cp -R debian/ ~/cinder/

root@jenkins-os:~/build# cd ~/cinder
root@jenkins-os:~/cinder# ll
...
drwxr-xr-x  6 root root  4096 Dec 20 07:00 debian/
...
```


Step 3. 딱히 팩키지에 대한 디펜던시를 건드릴 게 없다면, 빌드될 팩키지의 버전만 올려주면 된다.
debian 디렉토리의 changelog 파일로 버전 및 이력을 정의할 수 있다.

```bash
root@jenkins-os:~/cinder# vi debian/changelog
```

```
cinder (2:8.1.0-6~u14.04+mos15) mos9.0; urgency=medium

  * 빌드될 버전의 내용

 -- inter6 <inter6@naver.com>  Tue, 20 Dec 2016 15:41:47 +0900

cinder (2:8.0.0-6~u14.04+mos14) mos9.0; urgency=medium

  * 이전 버전의 내용

 -- inter6 <inter6@naver.com>  Sat, 20 Aug 2016 11:08:02 +0900
...
```

기존 버전은 ```2:8.0.0-6~u14.04+mos14``` 이였고, 빌드될 최신 버전은 ```2:8.1.0-6~u14.04+mos15```로 정의하였다.
버전명에 대한 상세 룰은 다음 [링크](https://specs.openstack.org/openstack/fuel-specs/specs/8.0/deb-packages-naming-policy.html)를 참고하면 된다.
MOS Repo에 팩키지가 업데이트되면 리비전 필드부터 넘버링이 올라가기 때문에, MOS Repo와의 버전 충돌을 방지하기 위해서 mos 넘버링만을 올리는 것이 안전할 것이다.


Step 4. 실제 빌드를 수행하기에 앞서, 빌드를 위해 디펜던시를 가지는 팩키지들이 설치되어있는지 체크 및 설치를 수행한다.

```bash
root@jenkins-os:~/cinder# dpkg-checkbuilddeps
dpkg-checkbuilddeps: Unmet build dependencies: debhelper (>= 9) dh-systemd openstack-pkg-tools (>= 40~) po-debconf python-all python-pbr (>= 1.8) python-setuptools (>= 16.0) python-sphinx (>= 1.1.2) bandit (>= 0.13.2) python-anyjson (>= 0.3.3) python-babel (>= 1.3) python-barbicanclient (>= 3.3.0) python-coverage (>= 3.6) python-crypto (>= 2.6) python-decorator (>= 3.4.0) python-ddt (>= 1.0.1) python-enum34 python-eventlet (>= 0.18.4) python-fixtures (>= 1.3.1) python-glanceclient (>= 1:2.0.0) python-googleapi (>= 1.4.2) python-greenlet (>= 0.3.2) python-hacking (>= 0.10.2) python-httplib2 (>= 0.7.5) python-iso8601 (>= 0.1.9) python-keystoneclient (>= 1:1.6.0) python-keystonemiddleware (>= 4.0.0) python-lxml (>= 2.3) python-migrate (>= 0.9.6) python-mock (>= 1.3) python-mox3 (>= 0.7.0) python-mysqldb python-novaclient (>= 2:2.29.0) python-oauth2client (>= 1.5.0) python-os-brick (>= 1.2.0-4~) python-os-testr (>= 0.4.2) python-os-win (>= 0.2.3) python-oslo.concurrency (>= 3.5.0) python-oslo.config (>= 1:3.7.0) python-oslo.context (>= 0.2.0) python-oslo.db (>= 4.1.0) python-oslo.i18n (>= 2.1.0) python-oslo.log (>= 2.0.0) python-oslo.messaging (>= 4.0.0) python-oslo.middleware (>= 3.0.0) python-oslo.policy (>= 0.5.0) python-oslo.reports (>= 1.0.0) python-oslo.rootwrap (>= 2.0.0) python-oslo.serialization (>= 2.0.0) python-oslo.service (>= 1.0.0) python-oslo.utils (>= 3.5.0) python-oslo.versionedobjects (>= 1.5.0) python-oslo.vmware (>= 1.16.0) python-oslosphinx (>= 2.5.0) python-oslotest (>= 1.10.0) python-osprofiler (>= 1.1.0) python-paramiko (>= 1.16.0) python-paste python-pastedeploy (>= 1.5.0) python-psutil (>= 1.1.1) python-psycopg2 (>= 2.5) python-pymysql (>= 0.6.2) python-pyparsing (>= 2.0.1) python-pywbem python-requests (>= 2.8.1) python-retrying (>= 1.2.3) python-routes (>= 1.12.3) python-rtslib-fb (>= 2.1.57) python-simplejson (>= 2.2.0) python-six (>= 1.9.0) python-sqlalchemy (>= 1.0.10) python-stevedore (>= 1.5.0) python-swiftclient (>= 1:2.2.0) python-taskflow (>= 1.26.0) python-tempest-lib (>= 0.14.0) python-testresources (>= 0.2.4) python-testscenarios (>= 0.4) python-testtools (>= 1.4.0) python-tooz (>= 1.28.0) python-tz (>= 2013.6) python-webob (>= 1.2.3) subunit testrepository

root@jenkins-os:~/cinder# apt-get install ...
```


Step 5. 실제 빌드를 수행한다. 빠른 빌드를 위해 테스트를 스킵할 수도 있다.

```bash
root@jenkins-os:~/cinder# # export DEB_BUILD_OPTIONS=nocheck

root@jenkins-os:~/cinder# dpkg-buildpackage -b
```

이 후, 상위 디렉토리에 .deb 팩키지들과 .changes 파일이 생성된다.


## 팩키지를 Fuel 노드의 사설 Repository에 업로드

> 마찬가지로 무식한 방법으로 빌드된 팩키지를 Repo에 올리고 메타데이터를 갱신해본다. 분명 다른 방법이 있어보이는데 잘 모르겠다;

Fuel 노드의 ```/var/www/nailgun/mitaka-9.0/ubuntu/auxiliary``` 위치에 우리가 빌드한 데비안 팩키지 및 메타데이터를 두면,
모든 노드가 이 위치에 있는 팩키지를 조회하고 설치할 수 있게된다.

Step 1. 빌드한 .deb 팩키지 파일들을 기존 MOS Repo와 동일한 패턴의 디렉토리에 복사해둔다.

```
root@jenkins-os:~# scp ~/*.deb root@fuel:/var/www/nailgun/mitaka-9.0/ubuntu/auxiliary/pool/main/c/cinder/
```


Step 2. 팩키지에 대한 메타데이터 파일을 작성해준다.

```
[root@fuel ~]# vi /var/www/nailgun/mitaka-9.0/ubuntu/auxiliary/dists/auxiliary/main/binary-amd64/Packages
```

```
Package: cinder-api
Source: cinder
Version: 2:8.1.0-6~u14.04+mos15
Architecture: all
Maintainer: PKG OpenStack <openstack-devel@lists.alioth.debian.org>
Installed-Size: 161
Depends: adduser, cinder-common (= 2:8.0.0-5~u14.04+mos38), debconf, python-keystoneclient (>= 1.6.0), python-openstackclient (>= 2.1.0), q-text-as-data, debconf (>= 0.5) | debconf-2.0, init-system-helpers (>= 1.18~), sysv-rc (>= 2.88dsf-24) | file-rc (>= 0.8.16), python2.7
Homepage: https://github.com/openstack/cinder
Priority: extra
Section: net
Filename: pool/main/c/cinder/cinder-api_8.1.0-6~u14.04+mos15_all.deb
Size: 33098
SHA256: d70e318e3a80e120722588ead6d4237589ec346865935e8a4c8bf21927051306
SHA1: 021694f5da9797fb71b2e453be43939020a6ed8a
MD5sum: b1577c4fbb92046564999a515f647cf4
Description: OpenStack block storage system - API server

...
```

이 또한 MOS Repo에 있는 내용을 베낀 뒤, Version과 Size, 해쉬값(SHA256, SHA1, MD5sum)만 변경해주면 된다.
크기와 해쉬값은 빌드 이후에 생성된 .changes 파일을 참고하면 된다.


Step 3. 수정한 Packages 파일에 대한 메타데이터를 갱신해준다.

```
[root@fuel ~]# vi /var/www/nailgun/mitaka-9.0/ubuntu/auxiliary/dists/auxiliary/Release
```

```
Origin: Mirantis
Label: auxiliary
Suite: auxiliary
Codename: auxiliary
Date: Mon, 15 Apr 2015 00:00:01 UTC
Architectures: amd64
Components: main restricted
Description: Auxiliary
MD5Sum:
 cca19ac1ce586af52f304ab682ab7968 1586679 main/binary-amd64/Packages
 dbf57d312f8a27eb0e6d07a701a68104 122 main/binary-amd64/Release
SHA1:
 a64ea2983682ab05436c86c035e19738a4e1afa7 1586679 main/binary-amd64/Packages
 10c286679f13601c32defbf442ada0f2f40fd2df 122 main/binary-amd64/Release
SHA256:
 8fd637f79738e819d71b7fb0e62160f4dd5092afda8305f2afa7704d061ea43f 1586679 main/binary-amd64/Packages
 aff0d577d0c0596a0c4beaef7a9547188bd2269e372d584bbc9d6aad13065a78 122 main/binary-amd64/Release
```

Step 2에서 수정한 ```/var/www/nailgun/mitaka-9.0/ubuntu/auxiliary/dists/auxiliary/main/binary-amd64/Packages``` 파일의 해쉬값을 넣어주면 된다.


이 후, 각 노드에서 ```apt-get update```를 한 다음, ```apt-cache policy cinder-api```에서 우리가 빌드한 팩키지 버전을 볼 수 있다.
Fuel Deploy를 돌리거나 직접 ```apt-get upgrade```를 입력하면 업그레이드를 수행하게 된다.


## Conclusion

OpenStack 소스를 수정하여 사용하는 순간, 업스트림 커밋과 커스텀 커밋과의 Merge 싸움이 시작된다.
Merge가 쉽지 않거나 꺼림칙한 커밋을 만나게되면... 거기다 테스트를 교묘히 피해가는 놈이라면...

그래서 OpenStack 소스를 수정하지 않고, API를 통한 연계 모듈을 만드는 편이 좋을 것이다.
커스텀 기능은 그런 방향으로 진행할 수 있는 부분이 많은데, 버그는 소스 수정을 하지 않는 한 답이 없을 수 있다.
