---
layout: post
title: "Neutron Metadata 리퀘스트 경로"
date: 2016-05-10
categories: openstack
---

* content
{:toc}

## Routed network

기본적으로 메타데이터 서비스는 qrouter NS에서 작동하고 있다.
때문에 네트워크를 라우터에 연결하지 않으면, 메타데이터를 받아올 수 없다.

```bash
# qrouter-라우터ID

[root@controller001 ~] ip netns exec qrouter-28120946-9f6a-4638-9747-603977b49816 netstat -ntlp
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 0.0.0.0:9697            0.0.0.0:*               LISTEN      28521/python2

# -> 28521 PID를 가진 메타데이터 데몬이 qrouter NS의 9697 포트를 바인드하고 있다.

[root@controller001 ~] ps -f --pid 28521 | fold -s -w 100
UID        PID  PPID  C STIME TTY          TIME CMD
neutron  28521     1  0 03:56 ?        00:00:00 /usr/bin/python2 /bin/neutron-ns-metadata-proxy
--pid_file=/var/lib/neutron/external/pids/28120946-9f6a-4638-9747-603977b49816.pid
--metadata_proxy_socket=/var/lib/neutron/metadata_proxy
--router_id=28120946-9f6a-4638-9747-603977b49816 --state_path=/var/lib/neutron --metadata_port=9697
--metadata_proxy_user=998 --metadata_proxy_group=996 --debug
--log-file=neutron-ns-metadata-proxy-28120946-9f6a-4638-9747-603977b49816.log
--log-dir=/var/log/neutron

[root@controller001 ~] ip netns exec qrouter-28120946-9f6a-4638-9747-603977b49816 iptables-save | grep REDIRECT
-A neutron-l3-agent-PREROUTING -d 169.254.169.254/32 -i qr-+ -p tcp -m tcp --dport 80 -j REDIRECT --to-ports 9697

# -> 169.254.169.254:80 으로 들어오는 패킷을 9697 포트로 리다이렉션하고 있다.
```


## Isolated networks

그러나 ```/etc/neutron/dhcp_agent.ini``` 설정에서 ```enable_isolated_metadata = True``` 로 지정한 뒤
```neutron-dhcp-agent``` 서비스를 재시작하면 qdhcp NS에서 메타데이터 서비스가 작동한다.

> Fuel에서 Neutron DVR 환경으로 배포할 경우 ienable_isolated_metadata 가 활성화되어 배포된다.

qdhcp NS는 각 네트워크별로 생성되기 때문에 네트워크를 라우터에 연결하지 않더라도 메타데이터를 받아올 수 있다.

GW 없이, 192.168.111.0/24 CIDR을 가지는 서브넷으로 네트워크를 생성하면 다음과 같이 설정된다.

```bash
[root@controller001 ~] neutron net-create test-metadata-in-dhcp
[root@controller001 ~] neutron subnet-create --no-gateway --name test-metadata-in-dhcp test-metadata-in-dhcp 192.168.111.0/24

# qdhcp-네트워크ID

[root@controller001 ~] ip netns exec qdhcp-18b28e2a-30a2-4374-83e1-54bdfeda66a3 ip -4 a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
19: tap25fabc7f-c2: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UNKNOWN
    inet 192.168.111.1/24 brd 192.168.111.255 scope global tap25fabc7f-c2
       valid_lft forever preferred_lft forever
    inet 169.254.169.254/16 brd 169.254.255.255 scope global tap25fabc7f-c2
       valid_lft forever preferred_lft forever

# -> qdhcp NS에서 192.168.111.1 와 169.254.169.254 IP를 할당하고 있다.

[root@controller001 ~] ps -ef | grep meta | grep 18b28e2a-30a2-4374-83e1-54bdfeda66a3 | fold -s -w 100
UID        PID  PPID  C STIME TTY          TIME CMD
neutron   6422     1  0 06:35 ?        00:00:00 /usr/bin/python2 /bin/neutron-ns-metadata-proxy
--pid_file=/var/lib/neutron/external/pids/18b28e2a-30a2-4374-83e1-54bdfeda66a3.pid
--metadata_proxy_socket=/var/lib/neutron/metadata_proxy
--network_id=18b28e2a-30a2-4374-83e1-54bdfeda66a3 --state_path=/var/lib/neutron --metadata_port=80
--metadata_proxy_user=998 --metadata_proxy_group=996
--log-file=neutron-ns-metadata-proxy-18b28e2a-30a2-4374-83e1-54bdfeda66a3.log
--log-dir=/var/log/neutron

# -> 6422 PID를 가진 메타데이터 데몬이 해당 네트워크에 대해 서비스하고 있다.

[root@controller001 ~] ip netns exec qdhcp-18b28e2a-30a2-4374-83e1-54bdfeda66a3 netstat -ntlp | grep 6422
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      6422/python2

# -> 6422 PID를 가진 메타데이터 데몬이 qdhcp NS의 80 포트를 바인드하고 있다.
```

VM은 DHCP로부터 IP를 가져올 때 라우팅 경로를 함께 가져오는데, dnsmasq가 다음과 같이 static 라우팅 경로를 내려준다.

```bash
[root@controller001 ~] ps -ef | grep dnsmasq | grep 18b28e2a-30a2-4374-83e1-54bdfeda66a3 | fold -s -w 100
UID        PID  PPID  C STIME TTY          TIME CMD
nobody    6398     1  0 06:35 ?        00:00:00 dnsmasq --no-hosts --no-resolv --strict-order
--bind-interfaces --interface=tap25fabc7f-c2 --except-interface=lo
--pid-file=/var/lib/neutron/dhcp/18b28e2a-30a2-4374-83e1-54bdfeda66a3/pid
--dhcp-hostsfile=/var/lib/neutron/dhcp/18b28e2a-30a2-4374-83e1-54bdfeda66a3/host
--addn-hosts=/var/lib/neutron/dhcp/18b28e2a-30a2-4374-83e1-54bdfeda66a3/addn_hosts
--dhcp-optsfile=/var/lib/neutron/dhcp/18b28e2a-30a2-4374-83e1-54bdfeda66a3/opts
--dhcp-leasefile=/var/lib/neutron/dhcp/18b28e2a-30a2-4374-83e1-54bdfeda66a3/leases
--dhcp-range=set:tag0,192.168.111.0,static,86400s --dhcp-lease-max=256
--conf-file=/etc/neutron/dnsmasq-neutron.conf --domain=openstacklocal

# -> 해당 네트워크에 대해 서비스하고 있는 dnsmasq의 dhcp-optsfile 경로는 /var/lib/neutron/dhcp/18b28e2a-30a2-4374-83e1-54bdfeda66a3/opts 이다.

[root@controller001 ~] cat /var/lib/neutron/dhcp/18b28e2a-30a2-4374-83e1-54bdfeda66a3/opts
tag:tag0,option:classless-static-route,169.254.169.254/32,192.168.111.1
tag:tag0,249,169.254.169.254/32,192.168.111.1
tag:tag0,option:router
tag:tag0,option:dns-server,192.168.111.1,192.168.111.3,192.168.111.2

# -> dnsmasq가 169.254.169.254 로 가는 패킷은 192.168.111.1 (qdhcp NS의 IP)로 가라고 static 라우팅 경로를 내린다.
```

지금까지 본 것은 GW가 없는 네트워크에서의 메타데이터 서비스 설정이고, 이제는 GW를 설정하고 네트워크를 만들어보자.

```bash
[root@controller001 ~] neutron net-create test-metadata-in-dhcp-with-gw
[root@controller001 ~] neutron subnet-create --name test-metadata-in-dhcp-with-gw test-metadata-in-dhcp-with-gw 172.31.0.0/24

# qdhcp-네트워크ID

[root@controller001 ~] ip netns exec qdhcp-f673b2b9-360f-4815-b308-362e4725fd85 ip -4 a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
20: tap3da34c9a-1d: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UNKNOWN
    inet 172.31.0.4/24 brd 172.31.0.255 scope global tap3da34c9a-1d
       valid_lft forever preferred_lft forever
    inet 169.254.169.254/16 brd 169.254.255.255 scope global tap3da34c9a-1d
       valid_lft forever preferred_lft forever

# -> qdhcp NS에서 172.31.0.4 와 169.254.169.254 IP를 할당하고 있다.

[root@controller001 ~] ps -ef | grep meta | grep f673b2b9-360f-4815-b308-362e4725fd85 | fold -s -w 100
UID        PID  PPID  C STIME TTY          TIME CMD
neutron  14475     1  0 07:15 ?        00:00:00 /usr/bin/python2 /bin/neutron-ns-metadata-proxy
--pid_file=/var/lib/neutron/external/pids/f673b2b9-360f-4815-b308-362e4725fd85.pid
--metadata_proxy_socket=/var/lib/neutron/metadata_proxy
--network_id=f673b2b9-360f-4815-b308-362e4725fd85 --state_path=/var/lib/neutron --metadata_port=80
--metadata_proxy_user=998 --metadata_proxy_group=996
--log-file=neutron-ns-metadata-proxy-f673b2b9-360f-4815-b308-362e4725fd85.log
--log-dir=/var/log/neutron

# -> 14475 PID를 가진 메타데이터 데몬이 해당 네트워크에 대해 서비스하고 있다.

[root@controller001 ~] ip netns exec qdhcp-f673b2b9-360f-4815-b308-362e4725fd85 netstat -ntlp | grep 14475
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      14475/python2

# -> 14475 PID를 가진 메타데이터 데몬이 qdhcp NS의 80 포트를 바인드하고 있다.

[root@controller001 ~] ps -ef | grep dnsmasq | grep f673b2b9-360f-4815-b308-362e4725fd85  |fold -s -w 100
UID        PID  PPID  C STIME TTY          TIME CMD
nobody   14289     1  0 07:15 ?        00:00:00 dnsmasq --no-hosts --no-resolv --strict-order
--bind-interfaces --interface=tap3da34c9a-1d --except-interface=lo
--pid-file=/var/lib/neutron/dhcp/f673b2b9-360f-4815-b308-362e4725fd85/pid
--dhcp-hostsfile=/var/lib/neutron/dhcp/f673b2b9-360f-4815-b308-362e4725fd85/host
--addn-hosts=/var/lib/neutron/dhcp/f673b2b9-360f-4815-b308-362e4725fd85/addn_hosts
--dhcp-optsfile=/var/lib/neutron/dhcp/f673b2b9-360f-4815-b308-362e4725fd85/opts
--dhcp-leasefile=/var/lib/neutron/dhcp/f673b2b9-360f-4815-b308-362e4725fd85/leases
--dhcp-range=set:tag0,172.31.0.0,static,86400s --dhcp-lease-max=256
--conf-file=/etc/neutron/dnsmasq-neutron.conf --domain=openstacklocal

[root@controller001 ~] cat /var/lib/neutron/dhcp/f673b2b9-360f-4815-b308-362e4725fd85/opts
tag:tag0,option:classless-static-route,169.254.169.254/32,172.31.0.4,0.0.0.0/0,172.31.0.1
tag:tag0,249,169.254.169.254/32,172.31.0.4,0.0.0.0/0,172.31.0.1
tag:tag0,option:router,172.31.0.1
tag:tag0,option:dns-server,172.31.0.3,172.31.0.2,172.31.0.4

# -> dnsmasq가 169.254.169.254 로 가는 패킷은 172.31.0.4 (qdhcp NS의 IP)로 가라고 static 라우팅 경로를 내린다.
```

GW를 설정하든말든 동일한 것을 볼 수 있다.
그러나 ```neutron-dhcp-agent``` 서비스를 재시작하면 dnsmasq가 내리는 라우팅 경로에 변화가 생긴다.

```bash
[root@controller001 ~] cat /var/lib/neutron/dhcp/f673b2b9-360f-4815-b308-362e4725fd85/opts
tag:tag0,option:router,172.31.0.1
tag:tag0,option:dns-server,172.31.0.2,172.31.0.4,172.31.0.3

# -> dnsmasq가 내렸던 static 라우팅 경로가 없어졌다.
```

이전까지는 qdhcp NS로 향하는 static 라우팅 경로를 내렸지만, 재시작 이후 169.254.169.254 에 대한 static 라우팅 경로를 내리지 않는다.
따라서 VM은 qdhcp가 아닌 qrouter NS에 있는 메타데이터 서비스로부터 받아올 것이다.
이는 가장 처음 보았던 Routed network 에서와 같다.

여기서 의문이 들 수 있는데 enable_isolated_metadata 를 활성화했을 때

- qrouter NS에서는 GW 설정에 상관없이 항상 메타데이터 서비스가 작동하며
- qdhcp NS에서는 GW를 설정했을 경우 메타데이터 서비스가 올라오지 않을 수 있다.

qdhcp에 메타데이터 서비스가 올라오지 않더라도, GW가 없는 네트워크에서는 메타데이터 리퀘스트가 qrouter를 향하기 때문에 문제는 없다.


## References

- [How VMs get access to the metadata in Neutron](https://www.suse.com/communities/blog/vms-get-access-metadata-neutron)
- [Metadata service in DHCP namespace](http://kimizhang.com/metadata-service-in-dhcp-namespace)