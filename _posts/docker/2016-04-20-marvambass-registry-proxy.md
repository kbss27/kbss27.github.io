---
layout: post
title: "marvambass/nginx-registry-proxy"
date: 2016-04-20
categories: docker
---

* content
{:toc}

[docker.io/registry](https://registry.hub.docker.com/_/registry/)는 그 자체만으로는 SSL 및 인증과 관련된 기능을 제공하지 않기 때문에 nginx나 httpd가 곁들여져야 한다.
[marvambass/nginx-registry-proxy](https://registry.hub.docker.com/u/marvambass/nginx-registry-proxy/)는 이를 위한 nginx 이미지이다.


## docker-compose.yml

nginx-registry-proxy는 이미지 내에 registry를 포함하고 있지는 않기 때문에 docker-compose를 사용하는 것이 편리하다.

- docker-compose.yml
```yml
registry:
  image: docker.io/registry:latest
  environment:
    - SETTINGS_FLAVOR=local
    - STORAGE_PATH=/registry
  volumes:
    - /data/registry/registry:/registry:rw
nginx:
  image: marvambass/nginx-registry-proxy:latest
  links:
    - registry:registry
  ports:
    - 15143:443
  environment:
  volumes:
    - /data/registry/nginx:/etc/nginx/external:rw
```


## 인증서 위치

인증서는 컨테이너 내의 /etc/nginx/external/ 또는 맵핑한 호스트 디렉토리에 두면 된다.
공개키는 cert.pem, 비밀키는 key.pem, DH는 dh.pem 파일명으로 지정하면 된다.

- Example
```bash
[root@inter6-docker-test nginx]# pwd
/data/registry/nginx
[root@inter6-docker-test nginx]# ll
합계 16
-rw-r--r--. 1 root root 1939  6월  6 23:02 cert.pem
-rw-r--r--. 1 root root  424  6월  6 23:02 dh.pem
-rw-r--r--. 1 root root   45  6월  6 23:11 docker-registry.htpasswd
-rw-r--r--. 1 root root 3264  6월  6 23:02 key.pem
```

## 유저 및 비밀번호 생성

htpasswd를 사용하여 마찬가지로 docker-registry.htpasswd 파일명으로 생성하면 된다.
만약 htpasswd가 없다면 yum install httpd-tools로 설치한다.

처음으로 htpasswd 파일을 만든다면

```bash
htpasswd -c docker-registry.htpasswd user1
```

이후에 htpasswd 파일에 유저를 추가한다면

```bash
htpasswd docker-registry.htpasswd user2
```