---
layout: post
title: "Fuel Backup and Restore"
date: 2016-04-21
categories: openstack
---

* content
{:toc}

## Intro

Fuel은 HA를 지원하지 않기 때문에 배포 이후 백업을 해놓는 것을 추천한다.
Fuel Master 노드에서만 백업을 수행하면 되며, 다운 타임없이 백업을 진행할 수 있다.

> Docker 컨테이너들을 Commit하는 과정에서 컨테이너들이 정지되었다가 재개된다. 디스크 속도가 느리면 오래 걸릴 수 있으므로 주의한다.

백업된 데이터는 다른 호스트로 SCP 등을 통해 전송시킨다.


## 백업/복구 대상

Docker 컨테이너를 Commit 한 뒤 이미지를 백업하고 복구하는 방식을 취하며,
컨테이너 이미지에는 다음과 같은 정보들을 포함하고 있다.

- Fuel DB
- PXE로 인식한 노드들의 정보
- 모든 Environment들의 설정
- Package repositories
- Deployment SSH keys
- Puppet manifests

> OpenStack 설정들은 백업하지 않는다는 것에 주의한다.
또한 각 Fuel 노드의 로그가 쌓여있는 /var/log 디렉토리는 별개로 백업을 수행해줘야 한다.


## 수행 방법

### 백업

백업을 수행하기 전에 /var 디렉토리로 마운트된 파티션의 남은 용량이 20GB 이상인지 확인한다.
최종 압축된 백업 데이터는 5GB 정도이나, Archive 과정 중에 많은 용량을 소모한다.
기본적으로 /dev/mapper/os-var 이름의 LVM-VG가 마운트하고 있을 것이다.

```bash
[root@fuel ~] df -Th
Filesystem            Type      Size  Used Avail Use% Mounted on
...
/dev/mapper/os-var    ext4       32G  8.6G   22G  29% /var
...
```

다음 명령어로 간단히 백업을 수행할 수 있다.

```bash
dockerctl backup
```

```/var/backup/fuel``` 위치에 tar.lrz 형식의 백업 파일을 생성하게 된다.
다음과 같은 백업 파일들이 압축되어 있다.

```bash
fuel_backup.tar.lrz
├── docker-images.tar : Docker 이미지
├── system-dirs.tar
│   ├── /etc/fuel 디렉토리
│   ├── /var/lib/fuel 디렉토리
│   ├── /root/.ssh/ 디렉토리
└── └── /var/www/nailgun 디렉토리
postgres_backup.sql : Fuel DB를 덤프한 sql 파일
```

필요하다면 ```/var/log``` 디렉토리 또한 백업을 해준다.

```bash
tar -czvf fuel-log.tar.gz /var/log
```

이 후, 백업된 데이터를 SCP를 이용하여 다른 안전한 호스트로 전송한다.


### 복구

백업된 데이터를 복구시, 다음과 같은 제약사항이 존재한다.

- 동일한 Fuel 버전의 백업 데이터만 복구할 수 있다.
- 복구할 Fuel 노드는 이전과 동일한 설정으로 Fuel Setup을 수행했어야 한다.
  - Public 네트워크 설정은 달라도 되나 PXE 네트워크 설정은 반드시 같아야 한다.
- 별도의 배포된 Environment가 있어서는 안된다.
- /var 위치에 적어도 20GB 정도의 여유 용량은 있어야 한다.

다음 명령어로 복구를 수행할 수 있다.

```bash
#Usage: dockerctl restore {백업 파일의 절대 경로}
dockerctl restore /root/fuel_backup.tar.lrz
```

이 후, 백업 데이터의 압축을 풀고 Docker 컨테이너 이미지를 복사한 뒤, 컨테이너를 재시작시키며
디렉토리들 또한 복사하는 형태로 복구가 진행된다.


## References

- [HowTo: Backup and restore Fuel Master - Mirantis Docs](https://docs.mirantis.com/openstack/fuel/fuel-8.0/operations.html#howto-backup-and-restore-fuel-master)
