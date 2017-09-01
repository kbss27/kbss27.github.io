---
layout: post
title: "Linux 명령어 모음"
date: 2016-06-18
categories: linux
---

* content
{:toc}

### CentOS 7 - ifconfig 설치

```bash
yum install net-tools
```

### CentOS - OpenVPN 클라이언트 설치

```bash
# 팩키지 설치
yum install epel-release
yum install openvpn

# 실행
openvpn --config ~/path/to/client.ovpn
```

### CentOS - YUM Repo에서 RPM만 다운로드

```bash
yum install yum-plugin-downloadonly
yum install --downloadonly --downloaddir=디렉토리 팩키지명
```

### 새로운 디스크 스캔

```bash
ls /sys/class/scsi_host/ | while read host; do echo "- - -" > /sys/class/scsi_host/$host/scan; done
```