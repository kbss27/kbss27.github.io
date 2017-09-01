---
layout: post
title: "Docker Swarm"
date: 2016-04-20
categories: docker
---

* content
{:toc}

Docker Swarm is native clustering for Docker. It allows you create and access to a pool of Docker hosts using the full suite of Docker tools. Because Docker Swarm serves the standard Docker API, any tool that already communicates with a Docker daemon can use Swarm to transparently scale to multiple hosts.

## 테스트 구축 환경

- Docker Host #1 : 192.168.11.15 / Cent OS 7.1 / Docker 1.7.1
- Docker Host #2 : 192.168.11.17 / Cent OS 7.1 / Docker 1.7.1

## Docker 설치

> 모든 호스트를 동일하게 설치

```bash
yum install docker
```

## Docker 데몬 설정 / 시작

> 모든 호스트를 동일하게 설정

```bash
vim /etc/sysconfig/docker
...
# Modify these options if you want to change the way the docker daemon runs
OPTIONS='-H tcp://0.0.0.0:2376 -H unix:///var/run/docker.sock'
...
```

```bash
systemctl daemon-reload
systemctl start docker
systemctl enable docker # 부팅 이후 Docker 서비스를 자동으로 시작하고자 할 때

curl -L 'http://127.0.0.1:2376/version'
# => {"Version":"1.7.1" ...과 같이 JSON Response가 정상적으로 왔다면 성공
```

## Zookeeper 클러스터 구축

> 모든 호스트를 동일하게 설치 & 설정 (중간에 myid 부분은 노드마다 달라야 한다)

- Java 설치

```bash
# 개인적으로 Oracle jdk-8u60-linux-x64 를 사용한다.
tar -xzf jdk-8u60-linux-x64.tar.gz
mv jdk1.8.0_60 /opt/
chown root:root -R /opt/jdk1.8.0_60
ln -s /opt/jdk1.8.0_60 /opt/jdk8
```

- Zookeeper 다운로드 및 설정

```bash
wget http://apache.mirror.cdnetworks.com/zookeeper/zookeeper-3.4.6/zookeeper-3.4.6.tar.gz
tar -xzf zookeeper-3.4.6.tar.gz
mv zookeeper-3.4.6 /opt/ # 앞으로 /opt/zookeeper-3.4.6 에서 진행한다.
cd /opt/zookeeper-3.4.6/conf/zoo_sample.cfg /opt/zookeeper-3.4.6/conf/zoo.cfg

vim /opt/zookeeper-3.4.6/conf/zoo.cfg
...
# the directory where the snapshot is stored.
# do not use /tmp for storage, /tmp here is just
# example sakes.
dataDir=/data/zookeeper # /data/zookeeper 에 데이터를 저장한다.
# the port at which the clients will connect
clientPort=2181
...
server.1=192.168.11.15:2888:3888 # Zookeeper 노드들을 나열한다.
server.2=192.168.11.17:2888:3888
...

echo 1 > /data/zookeeper/myid # !주의! myid 파일에 현재 노드의 번호가 기록되어있어야 한다.

vim /opt/zookeeper-3.4.6/conf/log4j.properties
...
zookeeper.root.logger=INFO, ROLLINGFILE
zookeeper.console.threshold=INFO
zookeeper.log.dir=/data/zookeeper/logs # /data/zookeeper/logs 에 로그를 저장한다.
zookeeper.log.file=zookeeper.log
zookeeper.log.threshold=INFO
zookeeper.tracelog.dir=/data/zookeeper/logs
zookeeper.tracelog.file=zookeeper_trace.log
...
og4j.appender.ROLLINGFILE.MaxFileSize=100MB
...

vim /opt/zookeeper-3.4.6/bin/zkEnv.sh
...
ZOOBINDIR="/opt/zookeeper-3.4.6/bin"
ZOOKEEPER_PREFIX="${ZOOBINDIR}/.."
JAVA_HOME="/opt/jdk8"
ZOO_LOG_DIR="/data/zookeeper/logs"
ZOO_LOG4J_PROP="INFO,ROLLINGFILE"
...

mkdir -p /data/zookeeper/logs
chown inter6:inter6 -R /opt/zookeeper-3.4.6 # 개인적으로 inter6:inter6 권한으로 실행한다.
chown inter6:inter6 -R /data/zookeeper

vim my-zkServer.sh # su 가 귀찮아서 따로 스크립트를 만든다.
...
#!/bin/bash
su inter6 -c "/opt/zookeeper-3.4.6/bin/zkServer.sh $1"
...

chmod 700 my-zkServer.sh
```

- Zookeeper 실행

```bash
./my-zkServer.sh start

/opt/zookeeper-3.4.6/bin/zkCli.sh # 잘 실행됐는지 확인 용도
...
help
# => ZooKeeper -server ...와 같이 Response가 출력되면 성공
```

## Docker Swarm 클러스터 구축


## Docker Manage 컨테이너 올리기


## Docker Manage API 사용