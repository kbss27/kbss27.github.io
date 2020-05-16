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
