---
layout: post
title: "CentOS 6 인스턴스 자동으로 루트 파티션 크기 확장"
date: 2016-06-09
categories: openstack
---

* content
{:toc}

## 문제 현상

http://cloud.centos.org/centos/ 에서 배포하는 CentOS 6.x 이미지로 인스턴스를 생성할 경우,
루트 파티션 크기가 자동으로 확장되지 않고 8GB 고정 크기를 가지게 된다.

블럭 디바이스 자체는 Flavor에서 제공하는 용량을 가지기 때문에, 인스턴스 init 시점에 cloud-init에서 파티션 및 파일시스템 용량을 늘려주면 된다.

## 해결책

이전과 같이 CentOS 6.x 인스턴스를 생성한 뒤, 다음 팩키지를 설치한다.

```bash
[root@test1 ~]$ yum install -y epel-release
[root@test1 ~]$ yum install -y cloud-init dracut-modules-growroot
```

이 후, initramfs를 재빌딩한 뒤 인스턴스를 재시작한다.

```bash
[root@test1 ~]$ rpm -qa kernel | sed 's/^kernel-//' | xargs -I {} dracut -f /boot/initramfs-{}.img {}
[root@test1 ~]$ reboot
```

재시작 후 파티션 및 파일시스템까지 Flavor에서 지정한 용량만큼 늘어난 것을 볼 수 있다.

```bash
# 80GB 루트 볼륨을 가지는 Flavor에서

# 작업 전
[root@test1 ~]$ df -Th
Filesystem     Type   Size  Used Avail Use% Mounted on
/dev/vda1      ext4   7.8G  613M  6.8G   9% /
tmpfs          tmpfs  7.8G     0  7.8G   0% /dev/shm

# 작업 후
[root@test1 ~]$ df -Th
Filesystem     Type   Size  Used Avail Use% Mounted on
/dev/vda1      ext4    79G  699M   74G   1% /
tmpfs          tmpfs  7.8G     0  7.8G   0% /dev/shm
```

작업 이후에는 ```cinder extend```로 볼륨 크기를 늘리지 않는 한, 인스턴스를 재시작하더라도 용량이 변경되지 않는다.