---
layout: post
title: "docker.io/postgres"
date: 2016-04-20
categories: docker
---

* content
{:toc}

https://registry.hub.docker.com/_/postgres/


## 이미지 다운받기

```bash
docker pull postgres
```


## 컨테이너 실행하기

### pstgresql 인스턴스를 생성하는 컨테이너

```bash
docker run --name inter6-postgresql -d -e POSTGRES_PASSWORD=패스워드 postgres
```

- --name inter6-postgresql : 컨테이너 이름을 inter6-postgresql로 지정
- -d : 데몬 컨테이너
- -e POSTGRES_PASSWORD=패스워드 : DB 패스워드 지정

기본적으로 postgres 라는 유저를 생성하고 public 스키마를 생성한다.
호스트->컨테이너로 포트 포워딩을 할려면 -p 5432:5432 옵션을 사용한다.


### psql을 실행하는 컨테이너

```bash
docker run -it --link inter6-postgresql:postgres --rm postgres sh -c 'exec psql -h "$POSTGRES_PORT_5432_TCP_ADDR" -p "$POSTGRES_PORT_5432_TCP_PORT" -U postgres'
```

- -it : [[docker:docker_시작하기|-i -t]] 와 동일
- --link inter6-postgresql:postgres : 접속할 postgresql 인스턴스가 있는 컨테이너:이미지 이름
- --rm : psql 종료시 컨테이너를 자동으로 삭제


### 다른 컨테이너가 postgresql 컨테이너에 있는 인스턴스를 사용할려면

```bash
docker run --name inter6-centos -d --link inter6-postgresql:postgres centos
```


## 환경 변수

- POSTGRES_USER=유저 이름
- POSTGRES_PASSWORD=패스워드
