---
layout: post
title: "How to install psycop2 with pip on OSX ?"
date: 2017-03-04
categories: mac-osx
---

아래 사이트에서 ```Postgres.app```을 다운로드 하여 ```/Applications``` 또는 적당한 디렉토리에 위치시킨다.

> [Postgres.app – the easiest way to get started with PostgreSQL on the Mac](http://postgresapp.com)

PATH env에 ```Postgres.app/Contents/Versions/9.4/bin/```를 추가한다.
예로 ```/Applications``` 디렉토리에 ```Postgres.app```을 두었다면 아래와 같은 명령어로 추가할 것이다.

```
export PATH=$PATH:/Applications/Postgres.app/Contents/Versions/9.4/bin/
```

이 후, ```pip``` 명령어로 ```psycopg2```를 설치해준다.

```
pip install psycopg2
```
