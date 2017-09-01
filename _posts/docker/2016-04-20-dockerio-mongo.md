---
layout: post
title: "docker.io/mongo"
date: 2016-04-20
categories: docker
---

* content
{:toc}

https://hub.docker.com/_/mongo/

NoSQL 중 하나인 [mongoDB](https://www.mongodb.org) 를 담은 이미지.

## 이미지 다운받기

```bash
docker pull mongo
```


## 컨테이너 실행하기

```bash
docker run --name inter6-mongo -d \
-p 27017:27017 \
-v /data/mongo/db:/data/db \
mongo
```

- --name inter6-mongo : 컨테이너 이름을 inter6-mongo로 지정
- -d : 데몬 컨테이너
- -p 27017: 27017 : [옵션] 호스트의 27017 포트로 들어오는 연결을 컨테이너의 mongoDB 인터페이스인 27017 포트로 포워딩
- -v /data/mongo/db:/data/db : [옵션] 호스트 디렉토리에 mongoDB 의 데이터를 저장