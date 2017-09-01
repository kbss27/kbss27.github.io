---
layout: post
title: "Nova 인스턴스 강제 삭제"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

## 문제 현상

Openstack 설치 후 테스트 과정 중, 잘못된 설정으로 인스턴스 생성 테스트를 진행.
이 후 인스턴스가 지워지지 않는 문제 발생.

## 해결책

```bash
root@controller:~# nova list
+--------------------------------------+------------------------------------------+--------+------------+-------------+----------+
| ID                                   | Name                                     | Status | Task State | Power State | Networks |
+--------------------------------------+------------------------------------------+--------+------------+-------------+----------+
| bc72696f-5f71-423b-a766-8902e0c77fb5 | ost1_test-boot-volume-instance1386731136 | ERROR  | deleting   | NOSTATE     |          |
+--------------------------------------+------------------------------------------+--------+------------+-------------+----------+
root@controller:~# nova reset-state bc72696f-5f71-423b-a766-8902e0c77fb5
root@controller:~# nova delete bc72696f-5f71-423b-a766-8902e0c77fb5
Request to delete server bc72696f-5f71-423b-a766-8902e0c77fb5 has been accepted.
```