---
layout: post
title: "docker.io/tomcat"
date: 2016-04-20
categories: docker
---

* content
{:toc}

https://registry.hub.docker.com/_/tomcat/


## 이미지 다운받기

```bash
docker pull tomcat
```


## 컨테이너 실행하기

### tomcat 인스턴스를 생성하는 컨테이너

```bash
docker run --name inter6-tomcat -it --rm -p 8080:8080 tomcat
```

기본적으로 다음과 같은 환경변수를 가지고있다. 물론 컨테이너 내에서의 환경변수이다.

```bash
CATALINA_BASE:   /usr/local/tomcat
CATALINA_HOME:   /usr/local/tomcat
CATALINA_TMPDIR: /usr/local/tomcat/temp
JRE_HOME:        /usr
CLASSPATH:       /usr/local/tomcat/bin/bootstrap.jar:/usr/local/tomcat/bin/tomcat-juli.jar
```