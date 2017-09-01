---
layout: post
title: "Fuel KeyError: u'dpdk' 이슈"
date: 2016-10-22
categories: openstack
---

* content
{:toc}

## 문제 현상

Enviroment 최초 배포 완료 후 새로운 노드를 배포할 때, 초반부터 Nailgun에서 KeyError: u'dpdk' 오류를 내고 Nailgun 및 웹 UI가 멈춰버린다.
Nailgun이 뻗으므로 fuel 명령어도 먹히지 않는다.

Launchpad에도 해당 이슈가 등록되어있다.
- [Fuel Launchpad: deployment can't be started because of KeyError: u'dpdk'](https://bugs.launchpad.net/fuel/+bug/1616119)


## 해결책

### Puppet 수정

```/etc/puppet/mitaka-9.0/modules/osnailyfacter/modular/netconfig/tasks.yaml``` 파일의 39번 라인을 아래와 같이 수정한다.

```
# 수정 전
changedAny($.network_scheme, $.dpdk, $.get('use_ovs'), $.get('set_rps'),

# 수정 후
changedAny($.network_scheme, $.get('dpdk'), $.get('use_ovs'), $.get('set_rps'),
```

57번 라인 또한 수정해준다.

```
# 수정 전
changedAny($.network_scheme, $.dpdk, $.get('use_ovs'), $.get('set_rps'),

# 수정 후
changedAny($.network_scheme, $.get('dpdk'), $.get('use_ovs'), $.get('set_rps'),
```

```/etc/puppet/mitaka-9.0/modules/openstack_tasks/examples/roles/tasks.yaml``` 파일의 31번 라인을 아래와 같이 변경한다.

```
# 수정 전
$.get('kombu_compression', ''), $.dpdk, $.get('glance_api_servers', ''),

# 수정 후
$.get('kombu_compression', ''), $.get('dpdk'), $.get('glance_api_servers', ''),
```

### Enviroment의 Task 수정

이미 배포된 Enviroment의 Task에 있는 문구도 수정이 필요하다.
우선 Task 목록을 받은 다음, ```$.dpdk``` 문구를 ```$.get('dpdk')```로 바꾸어준다.

```bash
# Task 목록 다운로드
[root@fuel ~] fuel env --env <Env ID> --deployment-tasks --download

# $.dpdk 문구 확인
[root@fuel ~] grep -r "$.dpdk" cluster_1/deployment_tasks.yaml
    yaql_exp: "changedAny($.network_scheme, $.dpdk, $.get('use_ovs'), $.get('set_rps'),\
    yaql_exp: "changedAny($.network_scheme, $.dpdk, $.get('use_ovs'), $.get('set_rps'),\
    ...

[root@fuel ~] # cluster_1/deployment_tasks.yaml 파일의 모든 $.dpdk 문구를 $.get('dpdk')로 바꾸어준다.

# 수정한 Task 업로드
[root@fuel ~] fuel env --env <Env ID> --deployment-tasks --upload
```

이 후, 정상 배포가 수행된다.
