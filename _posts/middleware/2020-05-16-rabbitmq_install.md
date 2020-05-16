---
layout: post
title: "rabbitmq 설치"
date: 2020-05-16
categories: middleware
---

* content
{:toc}

RabbitMq 설치를 진행해보자.  
설치 환경은 CentOS7.4 64bit이다.

## RabbitMq Install

### 1. Erlang Install

RabbitMq는 Erlang으로 만들어졌다. Erlang을 먼저 설치하자.  
우선 자신이 설치하고자 하는 rabbitMq server 버전을 확인하고 호환되는 erlang 버전을 확인하자.  
호환되지 않는 erlang버전을 설치했을시에, rabbitmq설치를 진행할 수 없다. 미리미리 문제될 사항은 처리해놓자.  
[RabbitMq Erlang Version](https://www.rabbitmq.com/which-erlang.html)

sudo yum install erlang으로 설치된 erlang 버전이 rabbitmq 버전과 호환될수도 있지만, rabbitmq 버전이 높을수록 호환이 안될 가능성이 높다.  
명시적으로 yum repo에 설정해주자.  
[Erlang 버전 Yum Repo 설정 방법](https://github.com/rabbitmq/erlang-rpm)

여기서는 현재 시점 rabbitmq 최신버전인 3.8.3을 기준으로 하겠다.  
rabbitmq 3.8.3에 호환되는 Erlang 버전은 22.x이다.

```bash
sudo vim /etc/yum.repos.d/rabbitmq_erlang.repo
```

```bash
[rabbitmq_erlang]
name=rabbitmq_erlang
baseurl=https://packagecloud.io/rabbitmq/erlang/el/7/$basearch
repo_gpgcheck=1
gpgcheck=1
enabled=1
# PackageCloud's repository key and RabbitMQ package signing key
gpgkey=https://packagecloud.io/rabbitmq/erlang/gpgkey
       https://dl.bintray.com/rabbitmq/Keys/rabbitmq-release-signing-key.asc
sslverify=1
sslcacert=/etc/pki/tls/certs/ca-bundle.crt
metadata_expire=300

[rabbitmq_erlang-source]
name=rabbitmq_erlang-source
baseurl=https://packagecloud.io/rabbitmq/erlang/el/7/SRPMS
repo_gpgcheck=1
gpgcheck=0
enabled=1
# PackageCloud's repository key and RabbitMQ package signing key
gpgkey=https://packagecloud.io/rabbitmq/erlang/gpgkey
       https://dl.bintray.com/rabbitmq/Keys/rabbitmq-release-signing-key.asc
sslverify=1
sslcacert=/etc/pki/tls/certs/ca-bundle.crt
metadata_expire=300
```

다음으로 RPM을 다운로드하자.
```bash
wget https://github.com/rabbitmq/rabbitmq-server/releases/download/v3.8.3/rabbitmq-server-3.8.3-1.el7.noarch.rpm
```

그 다음, rabbitMq signingkey를 import하고 다운로드 받은 rabbitmq rpm을 설치하자.
```bash
sudo rpm --import https://www.rabbitmq.com/rabbitmq-signing-key-public.asc
sudo yum install rabbitmq-server-3.8.3-1.el7.noarch.rpm
```

rabbitmq의 장점 중에 하나는 management UI가 아닐까 싶다.  
management plugin을 활성화하자.
```bash
sudo /usr/sbin/rabbitmq-plugins enable rabbitmq_management
```
plugin 활성화가 잘 되었는지 확인해보자.
```bash
sudo /usr/sbin/rabbitmq-plugins list
[  ] rabbitmq_amqp1_0                  3.8.3
[  ] rabbitmq_auth_backend_cache       3.8.3
[  ] rabbitmq_auth_backend_http        3.8.3
[  ] rabbitmq_auth_backend_ldap        3.8.3
[  ] rabbitmq_auth_backend_oauth2      3.8.3
[  ] rabbitmq_auth_mechanism_ssl       3.8.3
[  ] rabbitmq_consistent_hash_exchange 3.8.3
[  ] rabbitmq_event_exchange           3.8.3
[  ] rabbitmq_federation               3.8.3
[  ] rabbitmq_federation_management    3.8.3
[  ] rabbitmq_jms_topic_exchange       3.8.3
[E ] rabbitmq_management               3.8.3
[e ] rabbitmq_management_agent         3.8.3
[  ] rabbitmq_mqtt                     3.8.3
[  ] rabbitmq_peer_discovery_aws       3.8.3
[  ] rabbitmq_peer_discovery_common    3.8.3
[  ] rabbitmq_peer_discovery_consul    3.8.3
[  ] rabbitmq_peer_discovery_etcd      3.8.3
[  ] rabbitmq_peer_discovery_k8s       3.8.3
[  ] rabbitmq_prometheus               3.8.3
[  ] rabbitmq_random_exchange          3.8.3
[  ] rabbitmq_recent_history_exchange  3.8.3
[  ] rabbitmq_sharding                 3.8.3
[  ] rabbitmq_shovel                   3.8.3
[  ] rabbitmq_shovel_management        3.8.3
[  ] rabbitmq_stomp                    3.8.3
[  ] rabbitmq_top                      3.8.3
[  ] rabbitmq_tracing                  3.8.3
[  ] rabbitmq_trust_store              3.8.3
[e ] rabbitmq_web_dispatch             3.8.3
[  ] rabbitmq_web_mqtt                 3.8.3
[  ] rabbitmq_web_mqtt_examples        3.8.3
[  ] rabbitmq_web_stomp                3.8.3
[  ] rabbitmq_web_stomp_examples       3.8.3
```
위와 같이 rabbitmq_management, rabbitmq_management_agent, rabbitmq_web_dispatch가 활성화 되어 있으면 된다.  
이제 rabbitmq server를 시작해보자.
```bash
sudo systemctl start rabbitmq-server
```

management UI에 접속해보자. http://{server주소}:15672/  
![_config.yml](/media/middleware/rabbitmq/rabbitmq_management1.png){: .center}  
만약 자신의 local 환경에 rabbitmq를 설치했다면, guest/guest로 접속이 될것이다.  
하지만, 외부환경에 설치했다면, guest/guest로 접속이 되지않고, 친절하게 guest계정은 local환경에서만 가능하다는 경고를 보여준다.  
따로 user를 생성해주고, 해당 user에게 admin tag를 설정한다. 
생성한 user 계정으로 접속하자.
```bash
sudo /usr/sbin/rabbitmqctl add_user rabbitmq rabbitmq123
sudo /usr/sbin/rabbitmqctl set_user_tags rabbitmq administrator
```

이제 제대로 접속이 되는것을 확인할 수 있다.  
![_config.yml](/media/middleware/rabbitmq/rabbitmq_management2.png){: .center}  
