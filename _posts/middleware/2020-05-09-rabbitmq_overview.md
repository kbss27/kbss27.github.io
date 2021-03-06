---
layout: post
title: "rabbitmq overview"
date: 2020-05-09
categories: middleware
---

* content
{:toc}

RabbitMq에 대해 간략하게 정리하자.

## RabbitMq Overview

RabbitMq는 Message Broker이다. 요새는 Kafka를 많이 사용하지만, RabbitMq에서 제공해주는 Management UI의 편리성과 메시지에 대한 모니터링의 편리함 때문에, 대량의 transaction이 발생하는 환경이나, 초당 100k 이상 event가 발생하는 환경 등을 제외하면, RabbitMq 도입을 우선적으로 검토하는 편이다.  
Message Broker는 우체국과 같다고 볼 수 있다. 메일을 우체통에 넣으면서, 우체부가 수신자에게 메일을 배달해 줄것이라 확신할 수 있는 것처럼, rabbitmq 자체는
우체통, 우체국, 그리고 우체부의 역할을 한다.

**RabbitMq 특징**
* ISO 표준 AMQP 구현  
  - RabbitMq는 AMQP라는 표준 mq(message queue) 프로토콜로 만들어져 있다. 여러 mq들이 그들만의 방식으로 구성되어 이기종간에 통신이 어려운 문제로 표준화된 AMQP가 나오게 되었고, RabbitMQ는 그 프로토콜을 기반으로 구현되었다. 
* Erlang과 java로 만들어짐
  - RabbitMq의 core는 erlang으로 만들어져 있다. 따라서 erlang을 설치해야 한다.
* High Availability 보장
  - RabbitMq는 클러스터를 구성하고 클러스터 내의 노드들 간에 미러링을 설정해주는 방식으로 고가용성을 보장한다.
* publish/subscribe 방식 지원
  - RabbitMq는 publish와 subscribe 방식을 지원한다. producer는 exchange에 publishing하고 consumer는 각자 할당받은 queue를 subscribing해서 message를 받게 된다.
* 다양한 plugin 지원
  - RabbitMq는 성숙도가 높은 Mq이고 생태계가 잘 갖춰져있다. 그에 따라 다양하고 유용한 plugin들도 많이 있다.

![_config.yml](/media/middleware/rabbitmq/rabbitmq_overview.png){: width="347px" height="452px"}{: .center}

위의 그림은 rabbitmq의 메시지 흐름을 잘 보여주고 있다. 
1. Producer가 Message를 publishing한다. 이 message는 exchange queue에 전달된다.
2. exchange queue에 도착한 메시지는 설정된 exchange type(fanout, direct, topic, header)에 맞춰 binding된 queue에 메시지를 전송한다.
3. queue에 메세지가 쌓이게 되고 queue를 consuming하고 있는 consumer는 해당 message를 가져와서 처리한다.

Next Posting : [RabbitMq 설치](https://kbss27.github.io/2020/05/16/rabbitmq_install/)  
Next Posting : [RabbitMq Tutorial](https://kbss27.github.io/2020/05/11/rabbitmq_tutorial/)  
Next Posting : [RabbitMq Clustering](https://kbss27.github.io/2020/05/16/rabbitmq_clustering/)
