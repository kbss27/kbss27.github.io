---
layout: post
title: "docker.io/registry"
date: 2016-04-20
categories: docker
---

* content
{:toc}

이전에는 [docker.io/registry](https://registry.hub.docker.com/_/registry/) 가 SSL 및 인증 기능을 제공하지 않아서 [marvambass/nginx-registry-proxy](https://registry.hub.docker.com/u/marvambass/nginx-registry-proxy/) 를 사용하였으나
현재는 [docker.io/registry](https://registry.hub.docker.com/_/registry/) 가 단독으로 SSL 및 인증을 제공하고 있다.


## docker-compose.yml

싱글 컨테이너이지만 개인적으로 docker-compose를 사용하는 것이 편리하기 때문에 compose로 실행시킨다.

- docker-compose.yml

```bash
registry:
  image: registry:2
  ports:
    - 5000:5000
  environment:
    REGISTRY_HTTP_TLS_CERTIFICATE: /certs/domain.crt
    REGISTRY_HTTP_TLS_KEY: /certs/domain.key
    REGISTRY_AUTH: htpasswd
    REGISTRY_AUTH_HTPASSWD_PATH: /certs/htpasswd
    REGISTRY_AUTH_HTPASSWD_REALM: Registry Realm
  volumes:
    - /data/docker/registry/repository:/var/lib/registry
    - /data/docker/registry/certs:/certs
```

- /data/docker/registry/repository:/var/lib/registry - 푸쉬된 이미지가 저장되는 위치
- /data/docker/registry/certs:/certs - 인증서 및 패스워드 파일을 읽어오는 위치
  - REGISTRY_HTTP_TLS_CERTIFICATE: /certs/domain.crt - 공개키 파일. /certs 맵핑을 /data/docker/registry/certs로 하였기 때문에 /data/docker/registry/certs/domain.crt 위치에 있으면 된다.
  - REGISTRY_HTTP_TLS_KEY: /certs/domain.key - 비밀키 파일
  - REGISTRY_AUTH_HTPASSWD_PATH: /certs/htpasswd - 유저 및 패스워드가 기록된 htpasswd 파일

- Example

```bash
[root@daou-inter6-2 certs]# pwd
/data/docker/registry/certs
[root@daou-inter6-2 certs]# ll
합계 24
drwxr-xr-x 2 root root 4096 12월  6 06:20 .
drwxr-xr-x 4 root root 4096 12월  6 06:39 ..
-rw-r--r-- 1 root root 2094 12월  6 05:32 domain.crt
-rw-r--r-- 1 root root 3264 12월  6 05:32 domain.key
-rw-r--r-- 1 root root   69 12월  6 06:20 htpasswd
[root@daou-inter6-2 certs]#
```


## htpasswd 생성

```bash
docker run --entrypoint htpasswd registry:2 -Bbn username password > htpasswd
```