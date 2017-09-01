---
layout: post
title: "Cent OS 오래된 커널 삭제"
date: 2016-05-06
categories: linux
---

* content
{:toc}

## 현재 설치되어있는 커널 조회

```bash
[root@localhost ~] rpm -q kernel
kernel-3.10.0-229.14.1.el7.x86_64
kernel-3.10.0-229.20.1.el7.x86_64
kernel-3.10.0-327.3.1.el7.x86_64
kernel-3.10.0-327.10.1.el7.x86_64
kernel-3.10.0-327.13.1.el7.x86_64
```

## 오래된 커널 삭제

```bash
# yum-utils 설치
[root@localhost ~] yum install yum-utils

# 최신 2개의 커널만을 남기고 나머지 삭제
[root@localhost ~] package-cleanup --oldkernels --count=2
```