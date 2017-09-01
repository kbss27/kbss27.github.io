---
layout: post
title: "Docker Compose"
date: 2016-04-20
categories: docker
---

* content
{:toc}

https://docs.docker.com/compose

여러 컨테이너들이 뭉쳐서 하나의 서비스를 수행할 경우, 각 컨테이너들을 일일이 설정하고 켜고 끄고하는 것은 스마트하지 못하다.
Docker Compose 는 docker-compose.yml 파일에 컨테이너들의 설정과 디펜던시 등을 기록한 뒤, 커맨드 한 줄로 run/start/stop 을 한방에 해준다.


## 설치

```bash
curl -L https://github.com/docker/compose/releases/download/1.2.0/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```