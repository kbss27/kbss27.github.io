---
layout: post
title: "Ceph SSD Tier"
date: 2016-04-21
categories: openstack
---

* content
{:toc}

## Intro

클라우드 스토리지를 SSD로 모두 채워넣기에는 비용 문제가 크다. 때문에 SSD와 HDD를 혼합하여 클라우드 스토리지를 구축하는 경우가 많다.
사용자는 성능과 비용에 따라 SSD 또는 HDD를 선택하여 볼륨을 생성할 것이다.

이 글에서는 하나의 Ceph 클러스터에 SSD와 HDD 각각의 Pool를 생성하여 Cinder 백엔드로 물리는 것까지 설명한다.
기본적으로 Ceph 클러스터가 준비되어있고 HDD OSD들과 Pool만이 존재하는 환경에서 시작하기로 한다.

## 설정법

### SSD OSD 추가

물리적으로 SSD들을 추가한다. 참고로 SSD를 데이터 용도로 사용할 경우, 별도의 저널링 디스크는 필요없다.
장착 후, Ceph 노드에서 다음 명령어로 SSD들을 Ceph OSD로 만든다.

```ceph
# 디스크 인식이 잘 안되면
root@storage001:~] ls /sys/class/scsi_host/ | while read host ; do echo "- - -" > /sys/class/scsi_host/$host/scan ; done

root@storage001:~] lsblk
NAME               MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
...
sdh                  8:112  0    30G  0 disk
sdi                  8:128  0    30G  0 disk

# storage001 노드의 sdh와 sdi를 OSD로 만든다.
root@storage001:~] ceph-deploy osd prepare storage001:/dev/sdh
root@storage001:~] ceph-deploy osd prepare storage001:/dev/sdi

root@storage001:~] lsblk
NAME               MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
...
sdh                  8:112  0    30G  0 disk
├─sdh1               8:113  0    28G  0 part /var/lib/ceph/osd/ceph-6
└─sdh2               8:114  0     2G  0 part
sdi                  8:128  0    30G  0 disk
├─sdi1               8:129  0    28G  0 part /var/lib/ceph/osd/ceph-7
└─sdi2               8:130  0     2G  0 part

# storage002 노드 또한 sdh와 sdi를 OSD로 만든다.
root@storage001:~] ceph-deploy osd prepare storage002:/dev/sdh
root@storage001:~] ceph-deploy osd prepare storage002:/dev/sdi

root@storage001:~] ceph osd tree
ID WEIGHT  TYPE NAME           UP/DOWN REWEIGHT PRIMARY-AFFINITY
-1 0.41992 root default
-2 0.20996     host storage002
 0 0.04999         osd.0            up  1.00000          1.00000
 2 0.04999         osd.2            up  1.00000          1.00000
 3 0.04999         osd.3            up  1.00000          1.00000
 8 0.03000         osd.8            up  1.00000          1.00000
 9 0.03000         osd.9            up  1.00000          1.00000
-3 0.20996     host storage001
 1 0.04999         osd.1            up  1.00000          1.00000
 4 0.04999         osd.4            up  1.00000          1.00000
 5 0.04999         osd.5            up  1.00000          1.00000
 6 0.03000         osd.6            up  1.00000          1.00000
 7 0.03000         osd.7            up  1.00000          1.00000
```

### CRUSH 맵 수정

```bash
# CRUSH 맵 다운로드
root@storage001:~] ceph osd getcrushmap -o /tmp/crushmap
root@storage001:~] crushtool -d /tmp/crushmap -o crush_map
root@storage001:~] vi crush_map
```

수정 전 Bucket과 Rule은 다음과 같다.

```
# buckets
host storage001 {
        id -3           # do not change unnecessarily
        # weight 0.210
        alg straw
        hash 0  # rjenkins1
        item osd.1 weight 0.050
        item osd.4 weight 0.050
        item osd.5 weight 0.050
        item osd.6 weight 0.030
        item osd.7 weight 0.030
}
host storage002 {
        id -2           # do not change unnecessarily
        # weight 0.210
        alg straw
        hash 0  # rjenkins1
        item osd.0 weight 0.050
        item osd.2 weight 0.050
        item osd.3 weight 0.050
        item osd.8 weight 0.030
        item osd.9 weight 0.030
}
root default {
        id -1           # do not change unnecessarily
        # weight 0.420
        alg straw
        hash 0  # rjenkins1
        item storage001 weight 0.210
        item storage002 weight 0.210
}

# rules
rule replicated_ruleset {
        ruleset 0
        type replicated
        min_size 1
        max_size 10
        step take default
        step chooseleaf firstn 0 type host
        step emit
}
```

이제 HDD와 SSD별로 Bucket과 Rule을 각각 생성한다.
기존 ```default``` Bucket과 ```replicated_ruleset``` Rule 이름은 바꾸지 않았다.
참고로 item에 지정할 이름들은 그 전에 선언되어있어야 한다.

```
# buckets
host storage001_hdd {
        id -3           # do not change unnecessarily
        # weight 0.150
        alg straw
        hash 0  # rjenkins1
        item osd.1 weight 0.050
        item osd.4 weight 0.050
        item osd.5 weight 0.050
}
host storage002_hdd {
        id -2           # do not change unnecessarily
        # weight 0.150
        alg straw
        hash 0  # rjenkins1
        item osd.0 weight 0.050
        item osd.2 weight 0.050
        item osd.3 weight 0.050
}
root default {
        id -1           # do not change unnecessarily
        # weight 0.300
        alg straw
        hash 0  # rjenkins1
        item storage001_hdd weight 0.150
        item storage002_hdd weight 0.150
}

host storage001_ssd {
        id -11           # do not change unnecessarily
        # weight 0.060
        alg straw
        hash 0  # rjenkins1
        item osd.6 weight 0.030
        item osd.7 weight 0.030
}
host storage002_ssd {
        id -12           # do not change unnecessarily
        # weight 0.060
        alg straw
        hash 0  # rjenkins1
        item osd.8 weight 0.030
        item osd.9 weight 0.030
}
root ssd {
        id -10           # do not change unnecessarily
        # weight 0.120
        alg straw
        hash 0  # rjenkins1
        item storage001_ssd weight 0.060
        item storage002_ssd weight 0.060
}

# rules
rule replicated_ruleset {
        ruleset 0
        type replicated
        min_size 1
        max_size 10
        step take default
        step chooseleaf firstn 0 type host
        step emit
}
rule replicated_ruleset_ssd {
        ruleset 1
        type replicated
        min_size 1
        max_size 10
        step take ssd
        step chooseleaf firstn 0 type host
        step emit
}
```

수정한 CRUSH 맵을 업로드해준다.

```bash
root@storage001:~] crushtool -c crush_map -o /tmp/crushmap
root@storage001:~] ceph osd setcrushmap -i /tmp/crushmap
root@storage001:~] ceph osd tree
ID  WEIGHT  TYPE NAME               UP/DOWN REWEIGHT PRIMARY-AFFINITY
-10 0.12000 root ssd
-11 0.06000     host storage001_ssd
  6 0.03000         osd.6                up  1.00000          1.00000
  7 0.03000         osd.7                up  1.00000          1.00000
-12 0.06000     host storage002_ssd
  8 0.03000         osd.8                up  1.00000          1.00000
  9 0.03000         osd.9                up  1.00000          1.00000
 -1 0.29999 root default
 -3 0.14999     host storage001_hdd
  1 0.04999         osd.1                up  1.00000          1.00000
  4 0.04999         osd.4                up  1.00000          1.00000
  5 0.04999         osd.5                up  1.00000          1.00000
 -2 0.14999     host storage002_hdd
  0 0.04999         osd.0                up  1.00000          1.00000
  2 0.04999         osd.2                up  1.00000          1.00000
  3 0.04999         osd.3                up  1.00000          1.00000
```

### OSD 활성화

아직 추가한 OSD들을 activate 하지 않았는데, 다음과 같이 activate 해준다.

```ceph
root@storage001:~] ceph-deploy osd activate storage001:/dev/sdh1:/dev/sdh2
root@storage001:~] ceph-deploy osd activate storage001:/dev/sdi1:/dev/sdi2

root@storage001:~] ceph-deploy osd activate storage002:/dev/sdh1:/dev/sdh2
root@storage001:~] ceph-deploy osd activate storage002:/dev/sdi1:/dev/sdi2
```

### SSD 전용 Pool 생성 및 Rule 할당

여기서는 ```volumes_ssd``` 이름의 Pool을 만들고 PG 개수를 128로 주었다.
앞서 CRUSH 맵을 수정할 때 SSD ruleset 번호를 1로 지정하였기 때문에, 해당 Pool의 crush_ruleset 번호를 1로 준다.

```bash
root@storage001:~] ceph osd pool create volumes_ssd 128 128
root@storage001:~] ceph osd pool set volumes_ssd crush_ruleset 1

root@storage001:~] ceph osd lspools
...
2 volumes,	# 기존 default Rule을 사용하는 Pool
13 volumes_ssd,	# 생성한 ssd Rule을 사용하는 Pool
```

### Cinder Backend 설정

다음 링크를 참고하여 ```volumes```와 ```volumes_ssd``` Pool을 Cinder에 물리고, 볼륨 타입을 생성한다.
[Ceph Multi-Pool and Cinder Multi-Backend - inter6 wiki](https://inter6.github.io/2016/04/20/cinder-multi-ceph-backend/)

이 후 해당 볼륨 타입으로 볼륨을 생성한 뒤 ```ceph df```로 실제 용량을 먹어들어가는지 확인한다.

```bash
root@controller001:~] ceph df
GLOBAL:
    SIZE     AVAIL     RAW USED     %RAW USED
    408G      407G         706M          0.17
POOLS:
    NAME             ID     USED       %USED     MAX AVAIL     OBJECTS
    ...
    volumes          2        608M      0.15          147G         164
    volumes_ssd      13       704M      0.17        56425M         178
```


## References

- [Ceph: mix SATA and SSD within the same box - Sébastien Han](http://www.sebastien-han.fr/blog/2014/08/25/ceph-mix-sata-and-ssd-within-the-same-box/)
