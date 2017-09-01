---
layout: post
title: "윈도우 CMD 명령어 모음"
date: 2016-05-06
categories: windows
---

* content
{:toc}

### 최대 절전 모드 끄기

```
powercfg -h off
```


### BCD 부트로더 복구

```
bcdboot c:\windows /s c:
bootsect /nt60 c:
```