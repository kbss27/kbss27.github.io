---
layout: post
title: "Ceph RBD 관련 명령어 모음"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

### 인스턴스의 Persistence 블럭 디바이스 사용량 조회

```bash
[root@controller001 ~] nova volume-list
+--------------------------------------+-----------+--------------+------+-------------+-------------+
| ID                                   | Status    | Display Name | Size | Volume Type | Attached to |
+--------------------------------------+-----------+--------------+------+-------------+-------------+
| 655a6ba8-8195-4a1d-9d3d-57745e449dea | available | zz002        | 1    | -           |             |
| 9cc5d8fe-7320-458b-aa1f-f1a952bc1ce3 | available | zz001        | 1    | -           |             |
+--------------------------------------+-----------+--------------+------+-------------+-------------+

# Usage: rbd -p {Persistence로 사용하는 Pool의 이름} ls
[root@controller001 ~] rbd -p volumes ls
volume-655a6ba8-8195-4a1d-9d3d-57745e449dea
volume-9cc5d8fe-7320-458b-aa1f-f1a952bc1ce3
volume-e7982e0d-a490-4efa-9929-a79da88c801a
volume-eb69eef5-bcbc-4453-9363-34a67bb13b5f
volume-f85bca2e-bad1-4427-84e8-9b0030bd1a76

[root@controller001 ~] rbd -p volumes info volume-655a6ba8-8195-4a1d-9d3d-57745e449dea
rbd image 'volume-655a6ba8-8195-4a1d-9d3d-57745e449dea':
	size 1024 MB in 256 objects
	order 22 (4096 kB objects)
	block_name_prefix: rbd_data.98cf223d30812
	format: 2
	features: layering, striping
	flags:
	stripe unit: 4096 kB
	stripe count: 1
```

### 인스턴스의 Ephemeral 블럭 디바이스 사용량 조회

```bash
[root@controller001 ~] nova list
+--------------------------------------+-------+--------+------------+-------------+----------------------------------+
| ID                                   | Name  | Status | Task State | Power State | Networks                         |
+--------------------------------------+-------+--------+------------+-------------+----------------------------------+
| 08eecd0e-afcc-4102-aac3-ae2d20c82a5a | vm001 | ACTIVE | -          | Running     | admin_internal_net=192.168.111.5 |
+--------------------------------------+-------+--------+------------+-------------+----------------------------------+

# Usage: rbd -p {Ephemeral로 사용하는 Pool의 이름} ls
root@controller001 ~] rbd -p compute ls
05f7aa03-2096-450d-b932-dc4efbb16ecc_disk
08eecd0e-afcc-4102-aac3-ae2d20c82a5a_disk
53839872-f5c5-41e7-adad-cf4da0ccbedc_disk
a47e32f5-6a1e-44e3-9a27-e25605c37bc4_disk
a6edff7d-8cab-4d42-9111-87e06b9622d2_disk
d432f0db-fde6-4e89-8f6e-3a4e4390d71f_disk

[root@controller001 ~] rbd -p compute info 08eecd0e-afcc-4102-aac3-ae2d20c82a5a_disk
rbd image '08eecd0e-afcc-4102-aac3-ae2d20c82a5a_disk':
	size 20480 MB in 5120 objects
	order 22 (4096 kB objects)
	block_name_prefix: rbd_data.948732ae8944a
	format: 2
	features: layering
	flags:
```
