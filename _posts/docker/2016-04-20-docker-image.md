---
layout: post
title: "Docker 이미지 관리"
date: 2016-04-20
categories: docker
---

* content
{:toc}

## Docker Hub에 있는 이미지

### 이미지 검색

```bash
docker search centos
```


### 이미지 받기

```bash
docker pull docker.io/centos
```


### 이미지 로컬 커밋

```bash
docker commit -m "test" -a "inter6" 90db9983763a docker.io/centos:test
```

- Example

```bash
[root@inter6-docker-test ~]# docker run --name centos -it docker.io/centos /bin/bash
[root@90db9983763a /]# touch inter6.test
[root@90db9983763a /]# exit
[root@inter6-docker-test ~]# docker commit -m "test" -a "inter6" 90db9983763a docker.io/centos:test
9337414d79d6b8f8a13eac4bf79eb9a6740036fcc66e76c7b9f89234f5a9cda4
[root@inter6-docker-test ~]# docker images
REPOSITORY                   TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
docker.io/centos             test                9337414d79d6        25 seconds ago      215.7 MB
docker.io/centos             latest              fd44297e2ddb        6 weeks ago         215.7 MB
```


### Docker Hub로 이미지 푸쉬

```bash
docker push docker.io/centos
```


### 이미지 삭제

```bash
docker rmi docker.io/centos:test
```


## Docker Registry에 있는 이미지

### 사설 Registry 컨테이너 생성

```bash
docker pull registry:latest
docker run --name registry -d -p 15500:5000 -e STORAGE_PATH=/registry -v /data/registry:/registry:rw registry
```

- -e STORAGE_PATH=/registry : 컨테이너 내의 데이터 볼륨 경로


### 사설 Registry로 푸쉬 허용 설정

```bash
vi /etc/sysconfig/docker
...
INSECURE_REGISTRY='--insecure-registry 0.0.0.0:15500'
...
```


### 기존 이미지의 새로운 태그 및 Registry 위치 지정

```bash
docker tag docker.io/centos:test 0.0.0.0:15500/docker-test
```


### Registry로 이미지 푸쉬

```bash
docker push 0.0.0.0:15500/docker-test
```

- Example

```bash
[root@inter6-docker-test ~]# docker run --name centos -it docker.io/centos /bin/bash
[root@90db9983763a /]# touch inter6.test
[root@90db9983763a /]# exit
[root@inter6-docker-test ~]# docker commit -m "test" -a "inter6" 90db9983763a docker.io/centos:test
9337414d79d6b8f8a13eac4bf79eb9a6740036fcc66e76c7b9f89234f5a9cda4
[root@inter6-docker-test ~]# docker images
REPOSITORY                   TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
docker.io/centos             test                9337414d79d6        25 seconds ago      215.7 MB
docker.io/centos             latest              fd44297e2ddb        6 weeks ago         215.7 MB
[root@inter6-docker-test ~]# docker tag docker.io/centos:test 0.0.0.0:15500/docker-test
[root@inter6-docker-test ~]# docker images
REPOSITORY                   TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
docker.io/centos             test                9337414d79d6        41 minutes ago      215.7 MB
0.0.0.0:15500/docker-test    latest              9337414d79d6        41 minutes ago      215.7 MB
docker.io/centos             latest              fd44297e2ddb        6 weeks ago         215.7 MB
[root@inter6-docker-test ~]# docker push 0.0.0.0:15500/docker-test
The push refers to a repository [0.0.0.0:15500/docker-test] (len: 1)
Sending image list
Pushing repository 0.0.0.0:15500/docker-test (1 tags)
6941bfcbbfca: Image successfully pushed
41459f052977: Image successfully pushed
fd44297e2ddb: Image successfully pushed
9337414d79d6: Image successfully pushed
Pushing tag for rev [9337414d79d6] on {http://0.0.0.0:15500/v1/repositories/docker-test/tags/latest}
```


### Registry에 있는 이미지 받기

```bash
docker pull 0.0.0.0:15500/docker-test
```