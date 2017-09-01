---
layout: post
title: "Cinder Volume QoS"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

## Intro

볼륨에 대한 QoS가 없는 채로 볼륨을 사용하게되면, 물리 디스크의 IO 경합이 발생하여 전체 볼륨들의 속도를 떨어뜨릴 수 있다.
이 글에서는 아래 QoS 스펙을 생성하여 볼륨에 대한 속도 제한을 설정해본다.

|QoS Name	|Total IOPS	|Total MB/s	|
|-----------|-----------|-----------|
|General	|5000		|160 MB/s	|
|High-speed	|15000		|320 MB/s	|
|Low-speed	|1000		|80 MB/s	|


## 설정

다음과 같이 Cinder의 QoS 스펙을 생성한다.

```bash
cinder qos-create General consumer="front-end" total_iops_sec=5000 total_bytes_sec=167772160
cinder qos-create High-speed consumer="front-end" total_iops_sec=15000 total_bytes_sec=335544320
cinder qos-create Low-speed consumer="front-end" total_iops_sec=1000 total_bytes_sec=83886080
```

또는 Horizon의 ```시스템 > 볼륨 > 볼륨 타입 > QoS 사양```에서 UI를 통해 생성할 수 있다.

consumer에 사용할 수 있는 값은 다음과 같다.

- front-end : Hypervisor 에서 수행
- back-end : Storage Sub-System 에서 수행
- both : 2군데 모두

> Cinder의 Backend 스토리지로 Ceph을 사용할 경우, 현재 RBD 드라이버가 QoS 지원을 하지 않기 때문에 back-end 및 both는 사용할 수 없다.


또한 여기서는 total_iops_sec와 total_bytes_sec로만 제한을 걸었는데, 다음 키들을 추가로 사용할 수 있다.

- total_bytes_sec: the total allowed bandwidth for the guest per second
- read_bytes_sec: sequential read limitation
- write_bytes_sec: sequential write limitation
- total_iops_sec: the total allowed IOPS for the guest per second
- read_iops_sec: random read limitation
- write_iops_sec: random write limitation


생성한 QoS 스펙은 볼륨 타입에 연결할 수 있는데, 사용자는 QoS가 맵핑된 볼륨 타입을 통해 볼륨을 생성할 것이다.
따라서 볼륨 타입에 QoS 스펙을 연결해준다. -- 볼륨 타입이 없다면 만들어준다.
CLI에서 ```cinder qos-associate``` 또는 Horizon의 ```QoS 스펙 연결 관리```를 통해 연결할 수 있다.


## 성능 측정

IO를 측정하는 벤치마크 툴이 여러개 있으나 여기서는 FIO를 사용하기로 한다.
Cent OS 7 인스턴스를 생성하고 다음과 같이 FIO를 설치한다.

```bash
wget http://pkgs.repoforge.org/fio/fio-2.1.10-1.el7.rf.x86_64.rpm
rpm -iv fio-2.1.10-1.el7.rf.x86_64.rpm
```

이 후, 각 볼륨 타입으로 볼륨들을 생성하고 인스턴스에 추가해준다. 파티션 및 포맷, 마운트까지 완료한다.
다음과 같이 FIO 벤치를 수행한다. 각 볼륨이 마운트된 디렉토리별로 반복 수행해준다.
주의할 점은 매번 벤치를 수행한 후, 다음 벤치를 수행하기 전에 디렉토리를 클린해준다.

```bash
# Random 4K Write
fio --directory={Mount Path} \
--name fio_test_file --direct=1 --rw=randwrite --bs=4k --size=1G \
--numjobs=16 --time_based --runtime=60 --group_reporting --norandommap
rm -rf {Mount Path}/*

# Random 4K Read
fio --directory={Mount Path} \
--name fio_test_file --direct=1 --rw=randread --bs=4k --size=1G \
--numjobs=16 --time_based --runtime=60 --group_reporting --norandommap
rm -rf {Mount Path}/*

# Seq 4K Write
fio --directory={Mount Path} \
--name fio_test_file --direct=1 --rw=write --bs=4k --size=1G \
--numjobs=16 --time_based --runtime=60 --group_reporting --norandommap
rm -rf {Mount Path}/*

# Seq 4K Read
fio --directory={Mount Path} \
--name fio_test_file --direct=1 --rw=read --bs=4k --size=1G \
--numjobs=16 --time_based --runtime=60 --group_reporting --norandommap
rm -rf {Mount Path}/*

# Seq 32K Write
fio --directory={Mount Path} \
--name fio_test_file --direct=1 --rw=write --bs=32k --size=1G \
--numjobs=16 --time_based --runtime=60 --group_reporting --norandommap
rm -rf {Mount Path}/*

# Seq 32K Read
fio --directory={Mount Path} \
--name fio_test_file --direct=1 --rw=read --bs=32k --size=1G \
--numjobs=16 --time_based --runtime=60 --group_reporting --norandommap
rm -rf {Mount Path}/*
```

설정한 QoS에 따라 속도가 제한되는 것을 볼 수 있다.


## References

- [OPENSTACK, CEPH RBD AND QOS - Ceph Blog](http://ceph.com/planet/openstack-ceph-rbd-and-qos/)
- [Ceph RBD QoS - hwguo.github.io](http://hwguo.github.io/blog/2015/09/23/ceph-rbd-qos/)
- [볼륨 벤치마크 - AWS Manual](http://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/benchmark_piops.html)
- [Fio Benchmarking - wiki.mikejung.biz](https://wiki.mikejung.biz/Benchmarking#Fio)
