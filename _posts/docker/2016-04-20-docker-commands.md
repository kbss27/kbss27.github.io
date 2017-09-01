---
layout: post
title: "Docker 유용한 명령어"
date: 2016-04-20
categories: docker
---

* content
{:toc}

### 모든 컨테이너/이미지 삭제

```bash
docker rm $(docker ps -a -q)
docker rmi $(docker images -q)
```