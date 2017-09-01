---
layout: post
title: "Ceph OSD 추가"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

OSD는 파일시스템 위에 데이터를 기록하므로 ext4 또는 xfs로 포맷된 디스크가 OS 상에 마운트되어 있어야 한다.
추가로 저널 디스크를 사용한다면, 저널은 파일시스템이 아닌 블럭 디바이스 그대로 사용하므로 포맷 및 마운트가 필요없다.
그러나 1개의 OSD는 1개의 저널 블럭 디바이스를 소유하므로, 1개의 저널 디스크를 여러개의 OSD가 같이 사용하고 싶다면 저널 디스크를 파티션해야한다.

## 파티션, 포맷(ext4 또는 xfs), 마운트 수행

OSD 스토어에 쓸 디스크를 파티션/포맷/마운트까지 수행하고, 저널 디스크는 파티션까지만 하면된다.
RedHat Ceph이나 커스터마이징된 ceph-deploy 툴을 사용할 경우 이 과정이 필요없을 수도 있다.


## OSD 생성

```bash
cd /etc/ceph/

# 노드명:OSD 경로[:저널 디바이스]
ceph-deploy osd prepare ceph0:/ceph/osd0_1:/dev/sdb2
 
ceph osd tree
```


## OSD 데몬 시작

```bash
cd /etc/ceph/

ceph-deploy osd activate ceph0:/ceph/osd0_1:/dev/sdb2
```