---
layout: post
title: "sameersbn/docker-gitlab"
date: 2016-04-20
categories: docker
---

* content
{:toc}

https://github.com/sameersbn/docker-gitlab

git 원격지 + 관리 웹 클라이언트를 제공하는 오픈 소스 중에 [GitLab](https://about.gitlab.com|GitLab)이 있다.
GitLab은 RDB 및 ruby, httpd 등을 요구하기 때문에 구축하기가 쉽지 않은데 sameersbn/docker-gitlab 이미지를 사용하면 Docker 컨테이너로 간단히 GitLab을 구축할 수 있다.


## 컨테이너 실행하기

docker-compose.yml 파일을 제공해주기 때문에 [Docker Compose](./Docker%20Compose.md) 설치 후, 아래 2줄만 실행해주면 된다.

```bash
wget https://raw.githubusercontent.com/sameersbn/docker-gitlab/master/docker-compose.yml
docker-compose up
```

gitlab에 postgresql과 redis 컨테이너를 함께 올리는 것을 볼 수 있다.
이 후의 운영은 Docker Compose 명령어를 사용하면 유용하다.


## 환경 변수

설정을 위해서는 docker-compose.yml 을 수정한다.
굉장히 많은 환경 변수가 존재하는데 [README](https://github.com/sameersbn/docker-gitlab/blob/master/README.md) 페이지를 참고한다.


## SignIn (로그인) 기능 다시 켜기

관리자 페이지에서 SignIn 즉, 로그인 기능을 Off하면 "No authentication methods configured." 메세지가 출력되고 로그인을 할 수 없다.
SignIn을 다시 On 할려면 DB 레코드를 수정해야한다.

```bash
docker exec -it git_gitlab_1 /bin/bash
psql -h 172.17.0.2 -d gitlabhq_production -U gitlab
update application_settings set signin_enabled=true;
```