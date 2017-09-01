---
layout: post
title: "디스크 모니터링"
date: 2016-05-06
categories: linux
---

* content
{:toc}

## iostat

```bash
iostat 3
```


## vmstat

```bash
vmstat -d
```

```bash
vmstat -p sdb5
```

└ read/write 정보를 출력해준다. 몇몇 장치(LVM, RAID 등)에서는 동작하지 않는다.


## lsof

```bash
lsof | less
```

└ 현재 열려있는 file이나 directory를 표시한다.


```bash
lsof -c bash
```

└ bash shell에 의해 열려있는 파일을 확인한다.


```bash
lsof -d cwd
```

└ 각 프로세스의 현재 directory를 표기한다.


```bash
lsof -u greenfish
```

└ 사용자별 열린 file과 directory를 표기한다.


```bash
lsof /mnt/sda1
```

└ /mnt/sda1를 열은 process를 나열한다.


```bash
lsof +d /mnt/sda1/test_lock/
```

└ /mnt/sda1/test_lock 하부 경로를 열은 process를 나열한다.