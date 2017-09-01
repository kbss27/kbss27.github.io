---
layout: post
title: "BURG (Brand-new Universal loadeR from GRUB) 부트로더"
date: 2016-04-20
categories: linux
---

* content
{:toc}

## 개요

burg is a brand-new boot loader based on GRUB.
It uses a new object format which allows it to be built in a wider range of OS, including Linux/Windows/OSX/Solaris/FreeBSD, etc.
It also has a highly configurable menu system which works in both text and graphic mode.

- Code: https://launchpad.net/burg
- Document: https://help.ubuntu.com/community/Burg
- Forum: http://www.burgloader.com/bbs
- Mailing list: http://groups.google.com/group/burg-devel
- Screenshots: http://code.google.com/p/burg/wiki/Screenshots


## 소스 체크아웃

```bash
yum install bzr
cd ${HOME}
bzr branch lp:burg
bzr pull
```

~/burg 디렉토리에 소스를 체크아웃 받는다.


## 컴파일 (MBR용)

```bash
yum install autoconf automake bison flex make gcc ruby python gettext-devel freetype-devel
cd ${HOME}/burg
./autogen.sh
mkdir bin_pc
cd bin_pc
../configure --with-platform=pc --prefix=${HOME}/burg_pc
make
make install
```

~/burg_pc 디렉토리에 팩키지 파일들이 생성된다.


## 사전 설치 작업

```bash
cd ${HOME}/burg_pc/bin
ln -s /usr/bin/gettext.sh gettext.sh
```


## 부트로더 설치

```bash
cd ~/burg_pc/sbin
cat /boot/grub/device.map --> burg-install 하기 전에 반드시 stage1이 설치될 디스크를 확인하라.
./burg-install "(hd0)"
```

지정한 디스크의 MBR에 stage1이 설치되며 /boot/burg에 stage2가 설치된다.


## 테마 설치

```bash
cd /boot/burg
cp /tmp/burg-theme-20100623.zip . --> 첨부된 burg-theme-20100623.zip 파일
unzip burg-theme-20100623.zip
```

/boot/burg/fonts 와 /boot/burg/themes 디렉토리가 생성되며 /boot/burgenv 파일을 오버라이드한다.


## 부트로더 설정 파일 generate

```bash
mkdir -p ${HOME}/burg_pc/etc/default
cp /tmp/burg ${HOME}/burg_pc/etc/default/  --> 첨부된 burg 파일
cd ${HOME}/burg_pc/sbin
./burg-mkconfig -o /boot/burg/burg.cfg
```

/boot/burg/burg.cfg 파일이 생성된다.