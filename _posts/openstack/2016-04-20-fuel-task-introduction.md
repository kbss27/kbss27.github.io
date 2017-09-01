---
layout: post
title: "Fuel Task 소개"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

OS Provision이 끝난 노드는 Fuel Task들에 의해 OpenStack 배포가 수행된다.
Task들이 어떤 일을 수행하고 어떤 순서로 Task를 실행하는지는 YAML 파일로 정의되어있다.
Fuel에서 다음 명령어로 Task들이 정의된 YAML 파일을 다운받을 수 있다.

```bash
fuel env --env 1 --deployment-tasks --download
```

각 Task들은 required_for와 requires 속성에 의해 방향 그래프 형태를 띄는데,
이를 시각화하는 것은 [Fuel Task 그래프 시각화](./Fuel%20Task%20그래프%20시각화.md)를 참고하라.

type과 parameters 속성에 각 Task가 실행하는 일이 명시되어 있으며 대부분은 Puppet을 실행시키고 있다.

```yaml
  id: top-role-ceph-osd
  parameters:
    puppet_manifest: /etc/puppet/modules/osnailyfacter/modular/ceph/ceph-osd.pp
    puppet_modules: /etc/puppet/modules
    timeout: 3600
  required_for:
  - deploy_end
  requires:
  - hosts
  - firewall
  type: puppet
  version: 2.0.0
```

쉘 명령어를 수행하는 Task들도 존재한다.

```yaml
id: ceph_ready_check
  parameters:
    cmd: ruby /etc/puppet/modules/osnailyfacter/modular/ceph/ceph_ready_check.rb
    timeout: 1800
  required_for:
  - enable_rados
  - upload_cirros
  requires:
  - post_deployment_start
  role:
  - primary-controller
  type: shell
  version: 2.0.0
```

만약 추가적인 Task가 필요하다면 YAML 파일에 새로운 Task를 정의하고 Fuel로 업로드한다. Fuel에서 다음 명령어로 업로드(갱신) 할 수 있다.

```bash
fuel env --env 1 --deployment-tasks --upload
```


## Puppet을 실행하는 Task

Fuel의 ```/etc/puppet/modules``` 경로에 Puppet 스크립트들이 존재한다.
이 경로의 모든 파일들은 ```rsync_core_puppet``` Task에 의해 모든 노드들에 싱크되며, 각 노드들은 정의된 Task에 따라 Puppet 파일을 실행시키게 된다.

Fuel은 실질적으로 ```/etc/puppet/modules/osnailyfacter``` 내에 있는 Puppet들만을 실행시키고,
이 Puppet들은  ```/etc/puppet/modules``` 내의 모듈들을 호출하는 식으로 수행된다.

```/etc/puppet/modules``` 경로의 모든 파일을 로컬로 가져온 다음, 필요한 부분을 수정하거나 추가한 뒤 다시 Fuel로 업로드한다.
노드들이 배포된 상태더라도 ```rsync_core_puppet``` Task에 의해 업로드한 모든 파일들이 해당 노드에 싱크된다.
> 물론 ```rsync_core_puppet``` Task를 실행시키지 않으면 수정한 Puppet들이 노드에 반영되지 않을 것이다.


## Task의 실행

노드들이 배포된 상황에서 OpenStack 설정을 변경하는 Task를 실행시키고 싶다면, 다음 스텝들을 진행할 것이다

1. 기존에 존재하는 Puppet 파일 중에 관련 내용이 담겨있는 Puppet 파일을 찾는다. (없다면 만든다.)
2. OpenStack 설정을 변경하는 스크립트 라인들을 작성한다.
3. (Puppet 파일을 추가적으로 만들었다면) YAML 파일에 Task를 추가한다
4. 해당 Task를 실행시킨다.

Fuel에서 Task를 실행시키는 명령어는 다음과 같다.

```bash
fuel node --node 1 --tasks horizon
```

위는 Task 하나만 실행시키는 명령어이나, 경우에 따라 관련된 여러 Task들을 실행시켜야 할 수도 있다.

```bash
fuel node --node 1,2 --start openstack-network-start --end openstack-network-end

```
