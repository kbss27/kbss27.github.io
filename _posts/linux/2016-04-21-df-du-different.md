---
layout: post
title: "df 용량과 du 용량이 다를 때"
date: 2016-04-21
categories: linux
---

* content
{:toc}

## 문제 현상

```df``` 명령어와 ```du``` 명령어의 사용 용량이 다른 현상


## 원인

특정 프로세스가 file descriptor를 열고 file descriptor가 가리키는 파일을 지웠으나
file descriptor를 닫지 않았다면, ```df```에는 지운 용량이 반영되지 않는다.


## 해결책

```lsof``` 명령어로 ```SIZE/OFF``` 컬럼의 값이 매우 큰 프로세스를 죽였다 살린다.

다음 예제는 nginx 프로세스가 로그 파일을 지웠음에도 FD를 닫지 않고 있다.
Docker 컨테이너 내의 nginx 라서 컨테이너를 재시작하였다. 이 후, df 명령어에 바로 반영되었다.

```
[root@fuel ~] df -Th
Filesystem            Type      Size  Used Avail Use% Mounted on
...
/dev/mapper/os-varlog ext4       49G   45G  1.6G  97% /var/log
...

[root@fuel ~] lsof
COMMAND     PID   TID       USER   FD      TYPE             DEVICE    SIZE/OFF       NODE NAME
...
nginx     24462             root    6w      REG              253,2   271915137    1441867 /var/log/nginx/access_nailgun.log-20160310 (deleted)
nginx     24462             root    7w      REG              253,2 45138699516    1441868 /var/log/nginx/error_nailgun.log-20160310 (deleted)
nginx     24462             root    8w      REG              253,2     2841905    1441869 /var/log/nginx/access_repo.log-20160310 (deleted)
nginx     24462             root    9w      REG              253,2    59821192    1441870 /var/log/nginx/error_repo.log-20160310 (deleted)
...

[root@fuel ~] docker stop nginx
[root@fuel ~] docker start nginx

[root@fuel ~] df -Th
Filesystem            Type      Size  Used Avail Use% Mounted on
...
/dev/mapper/os-varlog ext4       49G  1.7G   44G   4% /var/log
...
```
