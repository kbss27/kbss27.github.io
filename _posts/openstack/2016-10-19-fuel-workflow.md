---
layout: post
title: "Fuel Workflow"
date: 2016-10-19
categories: openstack
---

* content
{:toc}

## Intro

Fuel로 OpenStack을 배포했을 때 몇가지 불편한 점 중 하나가, 간단한 설정이라도 수정이 쉽지 않다는 것이다.
노드를 추가하거나 제거했을 때 ```deploy-changes```를 수행하게 되는데, 이 후 직접 설정한 내용들이 Puppet에 의해 초기화된다.
이를 막기 위해서는 기존 Puppet을 수정하거나 별도의 플러그인을 만들어야 한다.

물론 코드에 의한 배포 및 멱등성은 옳은 일이지만, 이를 위해 엄청 길고 복잡한 ```Enviroment Task Graph```를 수정하거나 플러그인 만드는 일이 그닥 스마트하지 않다.
특히 Fuel이 업그레이드되면 Puppet 및 Task Graph에 변화가 생기기 때문에 업그레이드 하기가 부담스러워진다. 
또한 ```deploy-changes```가 모든 노드에 영향을 주기 때문에 노드가 많으면 많을수록 시간 또한 오래 걸린다. 
 
이번 Fuel 9.1 에서는 커스텀 Task를 실행시킬 수 있는 ```Workflow``` 기능을 제공한다.
Enviroment Task와는 별개이기 때문에, Enviroment Task Graph와는 상관없는 독립적인 커스텀 Task Garph를 실행시킬 수 있다.
이 글에서는 간단한 ```Workflow``` 예제를 소개해본다.


## Example

### Step 1. Custom Puppet 작성

간단히, 정적 파일 하나를 위치시키는 Puppet을 작성한다.

```
file { '/tmp/test.txt' :
  source   => 'puppet:///modules/inter6_test/test.txt',
  ensure   => 'present',
}
```


### Step 2. Custom Puppet을 Fuel Master로 업로드

Fuel Master 노드에 아래와 같은 디렉토리 구조로 커스텀 Puppet 파일들을 위치시킨다.
```/etc/puppet/modules```에 위치시키지 않는 이유는, 추후 Fuel 업그레이드시 영향을 받지 않기 위해서이다. 

```
/etc
└── puppet
    ├── inter6.com  // 여기서부터 커스텀 Puppet 소스를 위치시킨다.
    │   └── modules
    │       └── inter6_test
    │           ├── files
    │           │   └── test.txt
    │           └── manifests
    │               └── create_test_file.pp
    ├── mitaka-9.0  // 기존 Puppet
    │   ├── manifests
    │   └── modules
    └── modules -> /etc/puppet/mitaka-9.0/modules
```

이 후 Workflow를 실행시켰을 때, Fuel Slave 노드에는 아래와 같은 디렉토리 구조로 rsync를 때리고자 한다.

```
/etc
└── puppet
    ├── inter6.com
    │   └── modules
    │       └── inter6_test
    │           ├── files
    │           │   └── test.txt
    │           └── manifests
    │               └── create_test_file.pp
    └── modules  // 기존 Puppet
```

여기서 잠깐, 위 디렉토리 구조에서 ```create_test_file.pp```을 직접 실행하고자 한다면 아래와 같은 명령으로 실행해야 할 것이다.
모듈 경로가 ```/etc/puppet/inter6.com/modules```인 점을 알아두자.

```
puppet apply --modulepath=/etc/puppet/inter6.com/modules /etc/puppet/inter6.com/modules/inter6_test/manifests/create_test_file.pp
```


### Step 3. Task JSON 작성

아래와 같이 무엇을 실행할 것인지에 대한 Task JSON을 작성한다.

```
[
  {
    "id": "rsync-puppet",
    "task_name": "rsync-puppet",
    "version": "2.0.0",
    "groups": [
      "/.*/"
    ],
    "type": "sync",
    "parameters": {
      "src": "rsync://{MASTER_IP}:/puppet/inter6.com/modules/",
      "dst": "/etc/puppet/inter6.com/modules",
      "timeout": 180
    },
    "required_for": [
      "create-test-file"
    ]
  },
  {
    "id": "create-test-file",
    "task_name": "create-test-file",
    "version": "2.1.0",
    "groups": [
      "/.*/"
    ],
    "type": "puppet",
    "parameters": {
      "puppet_modules": "/etc/puppet/inter6.com/modules",
      "puppet_manifest": "/etc/puppet/inter6.com/modules/inter6_test/manifests/create_test_file.pp",
      "timeout": 600
    },
    "requires": [
      "rsync-puppet"
    ]
  }
]

```

1. ```rsync-puppet``` : 커스텀 Puppet 파일들을 Slave 노드들로 rsync 받아온다.
2. ```create-test-file``` : ```create_test_file.pp```를 실행시킨다.

다른 Task에 상관없이, 오로지 2개 Task끼리만 관계를 맺은 것을 볼 수 있다.
각 항목별 상세 설명은 [OpenStack Docs: Workflow task structure](http://docs.openstack.org/developer/fuel-docs/userdocs/fuel-user-guide/configure-environment/workflows/workflows-create/structure.html) 페이지를 참고한다.


### Step 4. Task JSON 업로드

작성된 Task JSON 파일을 ```Fuel UI > Workflows``` 탭의 ```Upload New Workflow``` 버튼을 통해 업로드시킨다.


### Step 5. Workflow 실행

등록 이후, ```Fuel UI > Dashboard``` 탭에서 커스텀 Workflow를 실행시킬 수 있는 UI가 생긴다.
```Run Workflow on {n} Nodes``` 버튼을 클릭하면 정의한 Task들이 실행된다.
기본은 전체 노드에서 실행되며 ```Choose nodes``` 버튼을 통해 실행할 노드를 선택할 수 있다.


## References

- [OpenStack Docs: Fuel Manage workflows](http://docs.openstack.org/developer/fuel-docs/userdocs/fuel-user-guide/maintain-environment/workflows-manage.html)