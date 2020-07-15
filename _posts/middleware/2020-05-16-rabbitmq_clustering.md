---
layout: post
title: "rabbitmq clustering"
date: 2020-05-16
categories: middleware
---

* content
{:toc}

RabbitMq Clustering 구성을 해보자.

## RabbitMq Clustering

RabbitMq의 broker자체는 안정적이지만, SPF(단일 장애점)이 발생할 수 있기 때문에, 이것을 해결하기 위한 클러스터 구성이 필요하다.  
다음 그림과 같이 서버 3대에 rabbitMq Clustering / Mirroring 구성을 해보겠다.

![_config.yml](/media/middleware/rabbitmq/rabbitmq_cluster_1.png){: .center}  

### 1. Clustering 구성할 노드간 erlang cookie 맞추기  
RabbitMq는 erlang의 클러스터링 기능에 의존한다.  
클러스터 내의 노드간 인증을 위한 수단으로 쿠키를 사용하기 때문에, erlang.cookie파일 내용이 클러스터링을 구성할 노드들과 동일한지 확인해야 한다.  
erlang cookie의 위치는 환경마다 다를 수 있다. 리눅스에서는 보통 /var/lib/rabbitmq/.erlang.cookie 위치에 erlang cookie가 있다.  
서버 3대 (dev1, dev2, dev3) 중 dev1의 erlang cookie를 복사하여 dev2 dev3의 erlang cookie에 붙여넣자.

***dev1***
```bash
sudo cat /var/lib/rabbitmq/.erlang.cookie
RXDIDPSOGJCVKWTKAZSG
```

***dev2***
```bash
sudo vim /var/lib/rabbitmq/.erlang.cookie
sudo cat /var/lib/rabbitmq/.erlang.cookie
RXDIDPSOGJCVKWTKAZSG
```

***dev3***
```bash
sudo vim /var/lib/rabbitmq/.erlang.cookie
sudo cat /var/lib/rabbitmq/.erlang.cookie
RXDIDPSOGJCVKWTKAZSG
```

dev1의 cookie를 복사하여, dev2, dev3에 vim을 열고 기존 cookie를 지우고 복사한 dev1의 cookie를 넣어줬다.  

### 2. Cluster로 노드 묶기
노드를 클러스터에 연결하면 해당 노드는 초기화되고 user, virtual host, exchange queue, policy 포함해서 자동으로 동기화된다.

클러스터 구성 전에 개별 노드별로 클러스터 상태를 확인해보자.  
```bash
sudo /usr/sbin/rabbitmqctl cluster_status
```
```bash
Basics

Cluster name: rabbit@dev-rabbitmqtest001-ncl.nfra.io

Disk Nodes

rabbit@dev-rabbitmqtest001-ncl

Running Nodes

rabbit@dev-rabbitmqtest001-ncl

Versions

rabbit@dev-rabbitmqtest001-ncl: RabbitMQ 3.8.3 on Erlang 23.0

Alarms

(none)

Network Partitions

(none)

Listeners

Node: rabbit@dev-rabbitmqtest001-ncl, interface: [::], port: 25672, protocol: clustering, purpose: inter-node and CLI tool communication
Node: rabbit@dev-rabbitmqtest001-ncl, interface: [::], port: 5672, protocol: amqp, purpose: AMQP 0-9-1 and AMQP 1.0
Node: rabbit@dev-rabbitmqtest001-ncl, interface: [::], port: 15672, protocol: http, purpose: HTTP API

Feature flags

Flag: drop_unroutable_metric, state: enabled
Flag: empty_basic_get_metric, state: enabled
Flag: implicit_default_bindings, state: enabled
Flag: quorum_queue, state: enabled
Flag: virtual_host_metadata, state: enabled
```
```bash
Basics

Cluster name: rabbit@dev-rabbitmqtest002-ncl.nfra.io

Disk Nodes

rabbit@dev-rabbitmqtest002-ncl

Running Nodes

rabbit@dev-rabbitmqtest002-ncl

Versions

rabbit@dev-rabbitmqtest002-ncl: RabbitMQ 3.8.3 on Erlang 23.0

Alarms

(none)

Network Partitions

(none)

Listeners

Node: rabbit@dev-rabbitmqtest002-ncl, interface: [::], port: 25672, protocol: clustering, purpose: inter-node and CLI tool communication
Node: rabbit@dev-rabbitmqtest002-ncl, interface: [::], port: 5672, protocol: amqp, purpose: AMQP 0-9-1 and AMQP 1.0
Node: rabbit@dev-rabbitmqtest002-ncl, interface: [::], port: 15672, protocol: http, purpose: HTTP API

Feature flags

Flag: drop_unroutable_metric, state: enabled
Flag: empty_basic_get_metric, state: enabled
Flag: implicit_default_bindings, state: enabled
Flag: quorum_queue, state: enabled
Flag: virtual_host_metadata, state: enabled
```
```bash
Basics

Cluster name: rabbit@dev-rabbitmqtest003-ncl.nfra.io

Disk Nodes

rabbit@dev-rabbitmqtest003-ncl

Running Nodes

rabbit@dev-rabbitmqtest003-ncl

Versions

rabbit@dev-rabbitmqtest003-ncl: RabbitMQ 3.8.3 on Erlang 23.0

Alarms

(none)

Network Partitions

(none)

Listeners

Node: rabbit@dev-rabbitmqtest003-ncl, interface: [::], port: 25672, protocol: clustering, purpose: inter-node and CLI tool communication
Node: rabbit@dev-rabbitmqtest003-ncl, interface: [::], port: 5672, protocol: amqp, purpose: AMQP 0-9-1 and AMQP 1.0
Node: rabbit@dev-rabbitmqtest003-ncl, interface: [::], port: 15672, protocol: http, purpose: HTTP API

Feature flags

Flag: drop_unroutable_metric, state: enabled
Flag: empty_basic_get_metric, state: enabled
Flag: implicit_default_bindings, state: enabled
Flag: quorum_queue, state: enabled
Flag: virtual_host_metadata, state: enabled
```

클러스터 구성을 시작한다. Rabbitmq는 고가용성을 위해 클러스터내의 최소 한대 이상의 노드를 Disk type으로 해야한다.  
여기서는 1번 노드를 Disk Type, 나머지 2번 3번을 Ram Type으로 구성하겠다.  
우선, 2번 노드를 멈추고, 1번 노드에 ram type으로 join시킨다.
```bash
sudo /usr/sbin/rabbitmqctl stop_app
Stopping rabbit application on node rabbit@dev1-test ...

sudo /usr/sbin/rabbitmqctl join_cluster --ram rabbit@dev1-test

sudo /usr/sbin/rabbitmqctl start_app
Starting node rabbit@dev-rabbitmqtest002-ncl ...
 completed with 3 plugins.

sudo /usr/sbin/rabbitmqctl cluster_status
Cluster status of node rabbit@dev-rabbitmqtest002-ncl ...
Basics

Cluster name: rabbit@dev-rabbitmqtest001-ncl.nfra.io

Disk Nodes

rabbit@dev-rabbitmqtest001-ncl

RAM Nodes

rabbit@dev-rabbitmqtest002-ncl

Running Nodes

rabbit@dev-rabbitmqtest001-ncl
rabbit@dev-rabbitmqtest002-ncl

Versions

rabbit@dev-rabbitmqtest001-ncl: RabbitMQ 3.8.3 on Erlang 23.0
rabbit@dev-rabbitmqtest002-ncl: RabbitMQ 3.8.3 on Erlang 23.0

Alarms

(none)

Network Partitions

(none)

Listeners

Node: rabbit@dev-rabbitmqtest001-ncl, interface: [::], port: 25672, protocol: clustering, purpose: inter-node and CLI tool communication
Node: rabbit@dev-rabbitmqtest001-ncl, interface: [::], port: 5672, protocol: amqp, purpose: AMQP 0-9-1 and AMQP 1.0
Node: rabbit@dev-rabbitmqtest001-ncl, interface: [::], port: 15672, protocol: http, purpose: HTTP API
Node: rabbit@dev-rabbitmqtest002-ncl, interface: [::], port: 25672, protocol: clustering, purpose: inter-node and CLI tool communication
Node: rabbit@dev-rabbitmqtest002-ncl, interface: [::], port: 5672, protocol: amqp, purpose: AMQP 0-9-1 and AMQP 1.0
Node: rabbit@dev-rabbitmqtest002-ncl, interface: [::], port: 15672, protocol: http, purpose: HTTP API

Feature flags

Flag: drop_unroutable_metric, state: enabled
Flag: empty_basic_get_metric, state: enabled
Flag: implicit_default_bindings, state: enabled
Flag: quorum_queue, state: enabled
Flag: virtual_host_metadata, state: enabled
```
1번 노드와 2번 노드 모두 cluster status를 확인했을때, 제대로 join되었다는것을 확인 할 수 있다.  
이제 3번 노드도 마찬가지로 ram type으로 cluster에 join 시키자.  
이미 1번노드와 2번노드가 cluster 구성이 되어있기 때문에, 어느곳이든 선택해서 join시키면 된다.  
```bash
sudo /usr/sbin/rabbitmqctl stop_app
Stopping rabbit application on node rabbit@dev3-test ...

sudo /usr/sbin/rabbitmqctl join_cluster --ram rabbit@dev-rabbitmqtest002-ncl

sudo /usr/sbin/rabbitmqctl start_app
Starting node rabbit@dev-rabbitmqtest003-ncl ...
 completed with 3 plugins.

sudo /usr/sbin/rabbitmqctl cluster_status
Cluster status of node rabbit@dev-rabbitmqtest003-ncl ...
Basics

Cluster name: rabbit@dev-rabbitmqtest001-ncl.nfra.io

Disk Nodes

rabbit@dev-rabbitmqtest001-ncl

RAM Nodes

rabbit@dev-rabbitmqtest002-ncl
rabbit@dev-rabbitmqtest003-ncl

Running Nodes

rabbit@dev-rabbitmqtest001-ncl
rabbit@dev-rabbitmqtest002-ncl
rabbit@dev-rabbitmqtest003-ncl

Versions

rabbit@dev-rabbitmqtest001-ncl: RabbitMQ 3.8.3 on Erlang 23.0
rabbit@dev-rabbitmqtest002-ncl: RabbitMQ 3.8.3 on Erlang 23.0
rabbit@dev-rabbitmqtest003-ncl: RabbitMQ 3.8.3 on Erlang 23.0

Alarms

(none)

Network Partitions

(none)

Listeners

Node: rabbit@dev-rabbitmqtest001-ncl, interface: [::], port: 25672, protocol: clustering, purpose: inter-node and CLI tool communication
Node: rabbit@dev-rabbitmqtest001-ncl, interface: [::], port: 5672, protocol: amqp, purpose: AMQP 0-9-1 and AMQP 1.0
Node: rabbit@dev-rabbitmqtest001-ncl, interface: [::], port: 15672, protocol: http, purpose: HTTP API
Node: rabbit@dev-rabbitmqtest002-ncl, interface: [::], port: 25672, protocol: clustering, purpose: inter-node and CLI tool communication
Node: rabbit@dev-rabbitmqtest002-ncl, interface: [::], port: 5672, protocol: amqp, purpose: AMQP 0-9-1 and AMQP 1.0
Node: rabbit@dev-rabbitmqtest002-ncl, interface: [::], port: 15672, protocol: http, purpose: HTTP API
Node: rabbit@dev-rabbitmqtest003-ncl, interface: [::], port: 25672, protocol: clustering, purpose: inter-node and CLI tool communication
Node: rabbit@dev-rabbitmqtest003-ncl, interface: [::], port: 5672, protocol: amqp, purpose: AMQP 0-9-1 and AMQP 1.0
Node: rabbit@dev-rabbitmqtest003-ncl, interface: [::], port: 15672, protocol: http, purpose: HTTP API

Feature flags

Flag: drop_unroutable_metric, state: enabled
Flag: empty_basic_get_metric, state: enabled
Flag: implicit_default_bindings, state: enabled
Flag: quorum_queue, state: enabled
Flag: virtual_host_metadata, state: enabled
```

노드를 클러스터에 연결하면 user, virtual host, exchange queue, policy 포함해서 join하는 cluster에 동기화된다.  
1번 노드를 Disk node로 설정하였는데, 만약 클러스터가 다운되었을시, Disk node 에 저장된 데이터로 어느정도 복구 할 수 있다.  
특히, disk 노드에는 persistent 큐에 대한 데이터가 저장되어 있어서, clustering에 꼭 필요하다.  
Ram 노드는 메타데이터를 메모리에 가지고 있는데, Ram 노드의 퍼포먼스는 publishing, consuming 속도에 영향을 미치는게 아니라, exchange, 큐 관리 (생성, 삭제), vhost 관리 같은 리소스 매니지먼트에만 영향이 있다. 나중에 설명하겠지만, 결국 master queue에서 slave queue로 데이터를 전파하는 구조이기 때문에, ram 노드가 publishing, consuming의 속도에 영향을 끼치진 않는다.  

![_config.yml](/media/middleware/rabbitmq/rabbitmq_cluster_2.png){: .center}  

이제 위와 같이 Cluster가 구성 되었다. 
하지만, 아직 high availability가 구성되었다고는 볼 수 없다. 클러스터내의 노드들은 큐 정보나 policy같은 정보들을 공유하기는 하지만 message까지 공유하지는 않는다. 따라서, 어떠한 노드가 다운되면 해당 노드가 가지고 있는 message는 유실된다. 이것을 방지하기 위해 message까지 클러스터내의 노드들이 복사 저장하여 공유하기 위해 설정해줘야 하는데 이를 mirroring이라 한다.  

## RabbitMq Mirroring

### 정책 설정

Mirroring은 정책을 통해 구성한다. 정책은 명령어를 사용해도 되고, Management UI를 통해서 설정해도 된다. 여기서는 명령어를 통해서 설정해보겠다.  
```bash
rabbitmqctl set_policy ha-all "^ha\." '{"ha-mode":"all"}'
rabbitmqctl set_policy -p test-vhost ha-all "^.*\.ha.*" '{"ha-mode":"all"}'
```
위의 예에서 ha-all은 policy name이고, 그 뒤에 "^ha\."는 regexp로 표현된 미러링할 queue의 이름, 뒤에 '{"ha-mode":"all"}'는 적용할 정책 세부사항이다. 여기에서는 ha-mode를 all로 주어 클러스터내의 모든 노드를 미러링할 수 있게 하였다.  
ha-mode에는 다음과 같이 세 가지 중 선택할 수 있는데, exactly나 nodes를 선택할 시에는 ha-params 옵션을 함께 주어 count나 node name을 지정할 수 있다.  
#### ha-mode  
* All : 클러스터내의 모든 노드를 미러링
* exactly : 특정 수 만큼의 노드만 미러링 
    * ex. {"ha-mode":"exactly", "ha-params": 2}
* nodes : 특정 이름의 노드들끼리 미러링
    * ex. {"ha-mode": "nodes", "ha-params": ["rabbit@dev-rabbitmqtest002-ncl", "rabbit@dev-rabbitmqtest003-ncl"]}

-p 옵션은 virtual host를 지정할 수 있는 옵션이다. virtual host를 분리시켜놓고 virtual host마다 다른 정책을 적용하는것도 가능하다.  

#### ha-sync-mode

미러링을 하면 정책에 맞춰 노드간 message가 복사된다. 하지만, 클러스터에 새로운 node가 join되었을 때, 이 노드에 기존 노드들이 가지고 있는 data를 Sync할 것인가, join 시점부터의 데이터만 sync할 것인가를 선택해야 한다. rabbitmq는 기본적으로 새로 join되거나, 죽었다 살아난 노드에 대해 기존 노드들이 가지고 있는 data를 sync하지 않는다. data sync하는 동안 해당 queue는 무응답 상태가 되어버려 서비스 가용성이 영향을 미칠 수 있기 때문이다. 그럼에도 불구하고 추가되는 노드에 다른 노드들이 이미 가지고 있는 데이터가 sync되어야 한다면 ha-sync-mode 옵션으로 다음과 같이 설정할 수 있다.
```bash
rabbitmqctl set_policy -p amigo-vhost ha-all "^.*\.ha.*" '{"ha-mode":"all", "ha-sync-mode":"automatic"}'
```

## RabbitMq Master Slave

클러스터 내의 Queue들은 하나의 master와 여러개의 slave로 구성된다.
message의 FIFO 순서를 필수적으로 보장하기 위해, queue에 대한 모든 명령은 명령은 master로 먼저 전달되고, slave는 master동기화를 통해 메시지를 업데이트 한다.  
master queue의 위치는 queue를 선언할 때 x-queue-master-locator를 사용해서 지정하거나, configuration file 내에 queue-master-locator 값을 정의하여 지정할 수 있다.  

#### queue master location 종류
* min masters : 클러스터 내의 노드들 중 master queue가 가장 적은 노드에 master queue 지정
* client-local : queue 선언할때 연결된 client에 master 지정. 설정 안할시 해당 값이 default
* random : random으로 master queue 지정