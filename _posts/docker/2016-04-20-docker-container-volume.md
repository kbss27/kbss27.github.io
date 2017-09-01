---
layout: post
title: "컨테이너의 데이터 볼륨"
date: 2016-04-20
categories: docker
---

* content
{:toc}

이미지로부터 각각의 컨테이너가 생성될 때 각 컨테이너마다 개별로 사용할 수 있는 데이터 볼륨이 만들어진다.
이미지 내의 데이터는 경로(마운트 포인트)에 대한 속성을 가지고 있는데, 데이터 볼륨이 만들어지면서 데이터를 해당 경로로 복사한다.

데이터 볼륨은 다음과 같은 특징을 가진다.

- 데이터 볼륨은 다른 컨테이너와 공유하거나 재사용할 수 있다.
- 이미지를 업데이트 할 때, 데이터 볼륨에 대한 변경 사항은 업데이트에 포함되지 않는다.
- 컨테이너가 삭제되어도 해당 컨테이너에 물려있던 데이터 볼륨은 즉시 삭제되지 않고 GC에 의해 삭제된다.
  - rm -v로 컨테이너를 삭제할 경우 즉시 지워진다.
  - 호스트 디렉토리를 데이터 볼륨으로서 사용할 경우, 호스트 디렉토리 및 하위 파일들이 지워지지는 않는다.
  - 다른(A) 컨테이너의 데이터 볼륨을 사용하고 있는 컨테이너를 삭제할 경우, A 컨테이너의 데이터 볼륨이 지워지지는 않는다.


## 컨테이너에 데이터 볼륨 추가

```bash
docker run --name inter6-centos -it -v /inter6 centos /bin/bash
```

- -v /inter6 : /inter6 마운트 포인트에 해당하는 데이터 볼륨 생성

- Example

```bash
[root@inter6-docker /]# docker run --name inter6-centos -it -v /inter6 centos /bin/bash
[root@ccf7b1e8aa71 /]# ls -la
total 48
...
drwxr-xr-x.  47 root root 4096 May 30 08:37 etc
drwxr-xr-x.   2 root root 4096 Jun 10  2014 home
drwxr-xr-x.   2 root root    6 May 30 08:37 inter6
lrwxrwxrwx.   1 root root    7 Apr 15 14:28 lib -> usr/lib
lrwxrwxrwx.   1 root root    9 Apr 15 14:28 lib64 -> usr/lib64
...
[root@ccf7b1e8aa71 /]#
```

컨테이너 내에 기존에는 없을 /inter6 디렉토리가 존재하는 것을 볼 수 있다.


## 호스트 디렉토리를 컨테이너에 데이터 볼륨으로서 마운트

```bash
docker run --name inter6-centos -it -v /data/inter6-centos:/data:rw centos /bin/bash
```

-v /data/inter6-centos:/data:rw : 호스트의 /data/inter6-centos 디렉토리를 /data에 해당하는 데이터 볼륨으로서 마운트. 또한 rw 옵션을 추가함으로서 컨테이너에서도 추가/수정이 가능

- Example

```bash
[root@inter6-docker inter6-centos]# cd /data/inter6-centos/
[root@inter6-docker inter6-centos]# ll
합계 0
-rw-r--r--. 1 root root 0  5월 30 17:58 test.file
[root@inter6-docker inter6-centos]# docker run --name inter6-centos -it -v /data/inter6-centos:/data:rw centos /bin/bash
[root@cebf55fc7706 /]# cd /data/
[root@cebf55fc7706 data]# ll
total 0
-rw-r--r--. 1 root root 0 May 30 08:58 test.file
[root@cebf55fc7706 data]# touch test1.file
[root@cebf55fc7706 data]# ll
total 0
-rw-r--r--. 1 root root 0 May 30 08:58 test.file
-rw-r--r--. 1 root root 0 May 30 09:01 test1.file
[root@cebf55fc7706 data]# exit
[root@inter6-docker inter6-centos]# ll
합계 0
-rw-r--r--. 1 root root 0  5월 30 17:58 test.file
-rw-r--r--. 1 root root 0  5월 30 18:01 test1.file
[root@inter6-docker inter6-centos]#
```


## 데이터 볼륨용 컨테이너
