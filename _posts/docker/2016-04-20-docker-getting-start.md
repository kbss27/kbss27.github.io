---
layout: post
title: "Docker 시작하기 with CentOS"
date: 2016-04-20
categories: docker
---

* content
{:toc}

## CentOS 요구사항

CentOS 7 64bit 또는 6.5 64bit 이상부터 Docker를 설치할 수 있다.
커널 버전은 2.6.32-431 이상이여야 한다.


## Docker 설치 및 설정

yum으로 설치

```bash
yum install docker
```

Docker 서비스 시작 및 정지

```bash
systemctl start docker
```

부팅 이후 Docker 서비스를 자동으로 시작할려면

```bash
systemctl enable docker
```

Docker 버전 확인

```bash
[root@inter6-docker ~]# docker version
Client version: 1.6.0
Client API version: 1.18
Go version (client): go1.4.2
Git commit (client): 8aae715/1.6.0
OS/Arch (client): linux/amd64
Server version: 1.6.0
Server API version: 1.18
Go version (server): go1.4.2
Git commit (server): 8aae715/1.6.0
OS/Arch (server): linux/amd64
```


## Docker 위에 CentOS 이미지 올리기

centos 이미지 받기

```bash
docker pull centos
```

이미지 리스트 보기

```bash
docker images
```


## CentOS 컨테이너 사용하기

### 새로운 컨테이너를 만들고 Hello World 출력시키기

```bash
[root@inter6-docker ~]# docker run centos /bin/echo 'Hello World'
Hello World
```

컨테이너는 Hello World 를 출력하고 정지된다.


### 컨테이너의 bash 쉘 실행하기

```bash
docker run -i -t centos /bin/bash
```

- -t : assigns a pseudo-tty or terminal inside our new container
- -i : make an interactive connection by grabbing the standard in (STDIN) of the container

- Example

```bash
[root@inter6-docker ~]# docker run -i -t centos /bin/bash
[root@b0a1df7bf64a /]# ls
bin  dev  etc  home  lib  lib64  lost+found  media  mnt  ...
[root@b0a1df7bf64a ~]# df -Th
Filesystem                            Type   Size  Used Avail Use% Mounted on
/dev/mapper/docker-253:0-202308155... ext4   9.8G  268M  9.0G   3% /
tmpfs                                 tmpfs  1.9G     0  1.9G   0% /dev
shm                                   tmpfs   64M     0   64M   0% /dev/shm
tmpfs                                 tmpfs  1.9G     0  1.9G   0% /run
tmpfs                                 tmpfs  1.9G     0  1.9G   0% /tmp
/dev/mapper/centos-root               xfs     36G  1.9G   34G   6% /etc/hosts
tmpfs                                 tmpfs  1.9G     0  1.9G   0% /run/secrets
tmpfs                                 tmpfs  1.9G     0  1.9G   0% /proc/kcore
[root@b0a1df7bf64a ~]# exit
[root@inter6-docker ~]#
```

- Example

```bash
[root@inter6-docker ~]# docker run -i -t centos /bin/bash
[root@a241a2c0984a /]# touch /tmp/test | ll /tmp/test
-rw-r--r--. 1 root root 0 May 29 14:18 /tmp/test
[root@a241a2c0984a /]# exit
[root@inter6-docker ~]# docker run -i -t centos /bin/bash
[root@3709e166a708 /]# ll /tmp/test
ls: cannot access /tmp/test: No such file or directory
[root@3709e166a708 /]# exit
[root@inter6-docker ~]#
```


### 컨테이너 데몬화하기

5초마다 Hello World를 찍는 데몬 컨테이너

```bash
docker run -d centos /bin/sh -c "while true; do echo Hello World; sleep 5; done"
```

- -d : tells Docker to run the container and put it in the background, to daemonize it.

docker ps -a로 모든 컨테이너들을 확인할 수 있고, docker logs $NAMES로 NAMES에 해당하는 컨테이너의 표준 출력을 볼 수 있다. docker stop $NAMES로 정지시킨다. 정지된 컨테이너는 docker start $NAMES로 다시 살리거나 docker run으로 새로운 컨테이너를 실행시킬 수도 있다. 컨테이너를 완전히 날릴려면 stop 이후 docker rm $NAMES을 하면 된다.

- Example

```bash
[root@inter6-docker ~]# docker run -d centos /bin/sh -c "while true; do echo Hello World; sleep 5; done"
202baf9508fe04319d141683ab8ff057182eccda8db4b85f0693aac77dcc31d0
[root@inter6-docker ~]# docker ps -a
CONTAINER ID        IMAGE               COMMAND                CREATED              STATUS              PORTS               NAMES
202baf9508fe        centos:latest       /bin/sh -c while t   About a minute ago   Up About a minute                       nostalgic_goldstine
[root@inter6-docker ~]# docker logs nostalgic_goldstine
Hello World
Hello World
Hello World
...
[root@inter6-docker ~]# docker stop nostalgic_goldstine
[root@inter6-docker ~]# docker ps -a
CONTAINER ID        IMAGE               COMMAND                CREATED             STATUS                        PORTS               NAMES
202baf9508fe        centos:latest       /bin/sh -c while t   5 minutes ago      Exited (137) 2 minutes ago                       nostalgic_goldstine
[root@inter6-docker ~]# docker rm nostalgic_goldstine
[root@inter6-docker ~]# docker ps -a
CONTAINER ID        IMAGE               COMMAND                CREATED             STATUS                        PORTS               NAMES
[root@inter6-docker ~]#
```