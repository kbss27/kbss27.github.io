---
layout: post
title: "Neutron Metering Agent"
date: 2017-01-18
categories: openstack
---

* content
{:toc}

## Intro

Public 클라우드 서비스를 제공할 경우 네트워크 트래픽에 대한 요금을 부과해야 할 것이다.
우리나라는 주로 Outbound 트래픽에 대해 과금을 하는데
이를 위해서는 각 Tenant별로, 그리고 시간별로 Outbound 트래픽에 대한 통계 데이터를 쌓아두어야 할 것이다.

앞으로 진행할 Neutron Metering Agent는 L3 IP 패킷에 대한 미터링을 제공한다.
각 Tenant별 전체 Outbound/Inbound 트래픽은 물론이거니와, IP 범위를 지정하여 해당 IP로 향하는 Out/In 트래픽을 Ceilometer로 샘플링한다.
관리자는 매월마다 Ceilometer를 통해 트래픽에 대한 통계를 확인하고 과금을 수행할 수 있을 것이다.


## 사전 지식

Neutron 미터링이 어떻게 트래픽을 수집하는지 설명해본다.
Neutron 미터링은 L3 패킷만을 대상으로 하며, 이는 곧 리눅스 Namespace 및 iptables와 연관이 있다.

몇가지 Neutron에 대한 사전 지식으로는 (DVR 환경 기준)

- VM에서 Public망으로 향하는 패킷은 qrouter NS를 거쳐 fip NS로 향한다.
- 여기서 qrouter NS는 rfp-라우터ID 이름의 NIC으로 fip NS와 연결되어 있다.

미터링 룰을 설정하게되면, qrouter NS의 iptables에 룰을 추가하여 해당 룰에 충족되는 패킷은 iptables의 통계로 쌓인다.
예로 Egrees 룰을 설정할 경우 아래와 같이 iptables 룰이 설정된다.

```
-A neutron-meter-r-LabelID -o rfp-라우터ID -j neutron-meter-l-LabelID
-A neutron-meter-l-LabelID
```

iptables 룰에 rfp NIC을 조건으로 주기 때문에 fip NS를 통해 Public 망으로 향하는 패킷만을 수집하는 것을 알 수 있다.
따라서 Tenant 내 VM 간의 트래픽은 미터링 대상이 아니며, SNAT 트래픽 또한 대상이 아니다.

그러나 현재의 미터링 소스 코드에는 DVR 환경이 고려되어있지 않아서
iptables 룰에 rfp가 아닌 (DVR 환경이 아닐 때 사용되는) qg NIC을 조건으로 주고 있다.
위의 iptables 예제는 rfp를 통하게끔 코드를 수정한 결과이다. 아래의 설치 방법은 DVR 환경에서 진행되며 소스 코드까지 수정한다.


## 설치

다음과 같은 환경에서 진행한다.

- Fuel로 배포한 Mitaka
- DVR 환경

> DVR을 사용하고 Outbound 트래픽에만 관심이 있기 때문에 Compute 노드들에만 미터링 에이전트를 설치한다.

Step 1. (Compute 노드) ```neutron-metering-agent```를 설치한다.

```bash
apt-get install neutron-metering-agent
```

Step 2. (Compute 노드) ```/etc/neutron/metering_agent.ini``` 파일을 다음과 같이 수정한다.

```ini
[DEFAULT]
driver = neutron.services.metering.drivers.iptables.iptables_driver.IptablesMeteringDriver
interface_driver = neutron.agent.linux.interface.OVSInterfaceDriver

# Interval between two metering measures
measure_interval = 60

# Interval between two metering reports
report_interval = 300
```

Step 3. (Controller, Compute 노드) ```/etc/neutron/neutron.conf``` 파일에서 미터링 서비스를 추가한다.

```ini
# service_plugins = ..., neutron.services.metering.metering_plugin.MeteringPlugin
service_plugins = neutron.services.l3_router.l3_router_plugin.L3RouterPlugin,neutron.services.metering.metering_plugin.MeteringPlugin
```

Step 4. (Compute 노드) 미터링 소스 코드가 DVR 환경에 대해 고려되어있지 않으므로, 다음과 같이 ```iptables_driver.py``` 코드를 수정한다.
(패치 포맷 형식에 주의한다)

파일 경로 : ```/usr/lib/python2.7/dist-packages/neutron/services/metering/drivers/iptables/iptables_driver.py```

```
@@ -34,6 +34,7 @@
 TOP_CHAIN = WRAP_NAME + "-FORWARD"
 RULE = '-r-'
 LABEL = '-l-'
+ROUTER_TO_FIP_DEV_PREFIX = 'rfp-'

 config.register_interface_driver_opts_helper(cfg.CONF)
 config.register_use_namespaces_opts_helper(cfg.CONF)
@@ -130,12 +131,12 @@
             del self.routers[router_id]

     def get_external_device_name(self, port_id):
-        return (EXTERNAL_DEV_PREFIX + port_id)[:self.driver.DEV_NAME_LEN]
+        return (ROUTER_TO_FIP_DEV_PREFIX + port_id)[:self.driver.DEV_NAME_LEN]

     def _process_metering_label_rules(self, rm, rules, label_chain,
                                       rules_chain):
         im = rm.iptables_manager
-        ext_dev = self.get_external_device_name(rm.router['gw_port_id'])
+        ext_dev = self.get_external_device_name(rm.router['id'])
         if not ext_dev:
             return

@@ -279,7 +280,7 @@
         rm = self.routers.get(router['id'])
         if not rm:
             return
-        ext_dev = self.get_external_device_name(rm.router['gw_port_id'])
+        ext_dev = self.get_external_device_name(rm.router['id'])
         if not ext_dev:
             return
         with IptablesManagerTransaction(rm.iptables_manager):
```

Step 5. (Controller 노드) Mitaka에서는 Neutron 서버가 미터링 설정과 관련한 요청 메세지를
Controller 노드에 있는 미터링 에이전트에만 보내는 문제가 있다.

Neutron은 각 vRouter가 어떤 L3 에이전트에 바인드되어있는지 DB로 관리하고 있는데 (routerl3agentbindings 테이블),
미터링 설정시 해당 vRouter의 L3 에이전트가 바인드되어있는 노드의 미터링 에이전트에 요청 큐를 보낸다.

그러나 Mitaka에서는 vRouter 생성시, dvr_snat 역할을 하는 컨트롤러 노드의 L3 에이전트들만 바인드를 등록하고 있다.
이로인해 Compute 노드로는 미터링 설정 요청이 가지 않는다.
어떤 이유로 인해 dvr_snat 에이전트들만 등록하는 것으로 변경되었는지 추적이 필요하나,
우선은 vRouterL3 에이전트가 있는 모든 노드들에 미터링 설정 요청을 보내게 코드를 수정한다.

파일 경로 : ```/usr/lib/python2.7/dist-packages/neutron/api/rpc/agentnotifiers/metering_rpc_agent_api.py```

```
@@ -42,22 +42,18 @@
             service_constants.L3_ROUTER_NAT)

         l3_routers = {}
-        state = agentschedulers_db.get_admin_state_up_filter()
         for router in routers:
-            l3_agents = plugin.get_l3_agents_hosting_routers(
-                adminContext, [router['id']],
-                admin_state_up=state,
-                active=True)
-            for l3_agent in l3_agents:
+            hosts = plugin.get_hosts_to_notify(adminContext, router['id'])
+            for host in hosts:
                 LOG.debug('Notify metering agent at %(topic)s.%(host)s '
                           'the message %(method)s',
                           {'topic': self.topic,
-                           'host': l3_agent.host,
+                           'host': host,
                            'method': method})

-                l3_router = l3_routers.get(l3_agent.host, [])
+                l3_router = l3_routers.get(host, [])
                 l3_router.append(router)
-                l3_routers[l3_agent.host] = l3_router
+                l3_routers[host] = l3_router

         for host, routers in six.iteritems(l3_routers):
             cctxt = self.client.prepare(server=host)
```

파일 경로 : ```/usr/lib/python2.7/dist-packages/neutron/db/metering/metering_rpc.py```

```
@@ -47,8 +47,7 @@
                 LOG.error(_LE('Unable to find agent %s.'), host)
                 return

-            routers = l3_plugin.list_routers_on_l3_agent(context, agents[0].id)
-            router_ids = [router['id'] for router in routers['routers']]
+            router_ids = l3_plugin.list_router_ids_on_host(context, host)
             if not router_ids:
                 return
```

Step 6. 관련 프로세스들을 재시작한다.

```bash
# Controller 노드
service neutron-server restart

# Compute 노드
service neutron-metering-agent restart
```

Step 7. 모든 미터링 에이전트들이 정상 작동하는지 확인해본다.

```bash
root@controller001:~] neutron agent-list | grep meter
+--------------------------------------+--------------------+---------------------------------+-------+----------------+---------------------------+
| id                                   | agent_type         | host                            | alive | admin_state_up | binary                    |
+--------------------------------------+--------------------+---------------------------------+-------+----------------+---------------------------+
| 98c6ce21-0def-4a5f-96c3-f2dfc7202f49 | Metering agent     | compute001.terracetech.co.kr    | :-)   | True           | neutron-metering-agent    |
| 582b3a87-e3a6-4d95-9006-9d5c7c14f160 | Metering agent     | compute002.terracetech.co.kr    | :-)   | True           | neutron-metering-agent    |
+--------------------------------------+--------------------+---------------------------------+-------+----------------+---------------------------+
```


## 미터링 설정

우선은 미터링을 설정할 Tenant ID를 확인한다.

```bash
root@controller001:~] keystone tenant-list
+----------------------------------+--------------+---------+
|                id                |     name     | enabled |
+----------------------------------+--------------+---------+
| 3202300865884babb3b704fa06bc1d7f |    inter6    |   True  |
+----------------------------------+--------------+---------+
```

디버깅을 위해 네트워크와 라우터 ID, qrouter NS에 rfp NIC이 있는지 확인해보는 것도 좋다.

```bash
root@controller001:~] neutron net-list
+--------------------------------------+--------------------+-------------------------------------------------------+
| id                                   | name               | subnets                                               |
+--------------------------------------+--------------------+-------------------------------------------------------+
| bc14ed02-7cf6-45a5-87e8-0f5e57f88bf4 | network-01         | c37dc9d6-e560-4f11-92f2-507eadb552b8 10.0.0.0/24      |
+--------------------------------------+--------------------+-------------------------------------------------------+

root@controller001:~] neutron router-list
+--------------------------------------+-----------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------+-------+
| id                                   | name                  | external_gateway_info                                                                                                                                                                    | distributed | ha    |
+--------------------------------------+-----------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------+-------+
| 6a3f89ce-de2e-47cf-a8d8-e9b3fecefc1a | router-01             | {"network_id": "bda4152b-d929-476a-9cc1-9e9e6d2a525b", "enable_snat": true, "external_fixed_ips": [{"subnet_id": "4c0e7bf4-0a9e-42d2-afb7-ff802ad92a8e", "ip_address": "115.71.3.120"}]} | True        | False |
+--------------------------------------+-----------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------+-------+

root@compute001:~] ip netns exec qrouter-6a3f89ce-de2e-47cf-a8d8-e9b3fecefc1a ip addr | grep rfp
2: rfp-6a3f89ce-d: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc pfifo_fast state UP group default qlen 1000
    inet 169.254.31.28/31 scope global rfp-6a3f89ce-d
    inet 115.71.3.121/32 brd 115.71.3.121 scope global rfp-6a3f89ce-d
```

미터링 레이블을 추가하고 여기에 모든 Egress 트래픽을 미터링하는 룰을 추가하고, iptables에 반영되었는지 확인해본다.

```bash
root@controller001:~] neutron meter-label-create --tenant-id 3202300865884babb3b704fa06bc1d7f out
+-------------+--------------------------------------+
| Field       | Value                                |
+-------------+--------------------------------------+
| description |                                      |
| id          | a60dc325-e183-49d9-82be-c305a8031332 |
| name        | out                                  |
| shared      | False                                |
| tenant_id   | 3202300865884babb3b704fa06bc1d7f     |
+-------------+--------------------------------------+

root@controller001:~] neutron meter-label-rule-create --tenant-id 3202300865884babb3b704fa06bc1d7f --direction egress out 0.0.0.0/0
+-------------------+--------------------------------------+
| Field             | Value                                |
+-------------------+--------------------------------------+
| direction         | egress                               |
| excluded          | False                                |
| id                | 6f0f0340-52dd-43a6-b640-56f772a85625 |
| metering_label_id | a60dc325-e183-49d9-82be-c305a8031332 |
| remote_ip_prefix  | 0.0.0.0/0                            |
+-------------------+--------------------------------------+

root@compute001:~] ip netns exec qrouter-6a3f89ce-de2e-47cf-a8d8-e9b3fecefc1a iptables-save | grep a60dc325
-A neutron-meter-FORWARD -j neutron-meter-r-a60dc325-e18
-A neutron-meter-l-a60dc325-e18
-A neutron-meter-r-a60dc325-e18 -o rfp-6a3f89ce-d -j neutron-meter-l-a60dc325-e18
```

VM을 하나 생성하고 외부에서 Egrees 트래픽을 발생시킨 뒤, iptables에 통계가 쌓이는지 확인해본다.

```bash
root@compute001:~] ip netns exec qrouter-6a3f89ce-de2e-47cf-a8d8-e9b3fecefc1a iptables -nv -L
Chain neutron-meter-r-a60dc325-e18 (1 references)
 pkts bytes target     prot opt in     out     source               destination
 133K  173M neutron-meter-l-a60dc325-e18  all  --  *      rfp-6a3f89ce-d  0.0.0.0/0            0.0.0.0/0
```

마지막으로 Ceilometer에서 샘플링 데이터와 통계를 확인해본다.

```bash
root@controller001:~] ceilometer resource-show a60dc325-e183-49d9-82be-c305a8031332
+-------------+--------------------------------------------------------------------+
| Property    | Value                                                              |
+-------------+--------------------------------------------------------------------+
| metadata    | {"event_type": "l3.meter", "tenant_id":                            |
|             | "3202300865884babb3b704fa06bc1d7f", "first_update": "1462874121",  |
|             | "bytes": "0", "host": "metering.compute001.terracetech.co.kr",     |
|             | "last_update": "1462875531", "label_id": "a60dc325-e183-49d9-82be- |
|             | c305a8031332", "time": "330", "pkts": "0"}                         |
| project_id  | 3202300865884babb3b704fa06bc1d7f                                   |
| resource_id | a60dc325-e183-49d9-82be-c305a8031332                               |
| source      | openstack                                                          |
| user_id     | None                                                               |
+-------------+--------------------------------------------------------------------+

root@controller001:~] ceilometer sample-list -q resource_id=a60dc325-e183-49d9-82be-c305a8031332
+--------------------------------------+--------------------------------------+-----------+-------+--------+------+----------------------------+
| ID                                   | Resource ID                          | Name      | Type  | Volume | Unit | Timestamp                  |
+--------------------------------------+--------------------------------------+-----------+-------+--------+------+----------------------------+
| 145e9cc2-1699-11e6-aa0e-005056990101 | a60dc325-e183-49d9-82be-c305a8031332 | bandwidth | delta | 0.0    | B    | 2016-05-10T10:22:20.508000 |
+--------------------------------------+--------------------------------------+-----------+-------+--------+------+----------------------------+

root@controller001:~] ceilometer statistics -m bandwidth -q resource_id=a60dc325-e183-49d9-82be-c305a8031332 -p 3600
+--------+----------------------------+----------------------------+-------------+-----+---------------+-------------+-------+----------+----------------------------+----------------------------+
| Period | Period Start               | Period End                 | Max         | Min | Avg           | Sum         | Count | Duration | Duration Start             | Duration End               |
+--------+----------------------------+----------------------------+-------------+-----+---------------+-------------+-------+----------+----------------------------+----------------------------+
| 3600   | 2016-05-11T00:39:06.979000 | 2016-05-11T01:39:06.979000 | 8511321.0   | 0.0 | 400217.125    | 12806948.0  | 32    | 3487.324 | 2016-05-11T00:39:42.301000 | 2016-05-11T01:37:49.625000 |
| 3600   | 2016-05-11T01:39:06.979000 | 2016-05-11T02:39:06.979000 | 0.0         | 0.0 | 0.0           | 0.0         | 33    | 3487.317 | 2016-05-11T01:39:43.452000 | 2016-05-11T02:37:50.769000 |
| 3600   | 2016-05-11T02:39:06.979000 | 2016-05-11T03:39:06.979000 | 52.0        | 0.0 | 1.57575757576 | 52.0        | 33    | 3458.963 | 2016-05-11T02:39:44.772000 | 2016-05-11T03:37:23.735000 |
| 3600   | 2016-05-11T03:39:06.979000 | 2016-05-11T04:39:06.979000 | 109022940.0 | 0.0 | 6379447.71429 | 223280670.0 | 35    | 3350.657 | 2016-05-11T03:39:16.123000 | 2016-05-11T04:35:06.780000 |
| 3600   | 2016-05-11T04:39:06.979000 | 2016-05-11T05:39:06.979000 | 0.0         | 0.0 | 0.0           | 0.0         | 1     | 0.0      | 2016-05-11T04:39:23.255000 | 2016-05-11T04:39:23.255000 |
+--------+----------------------------+----------------------------+-------------+-----+---------------+-------------+-------+----------+----------------------------+----------------------------+
```


## References

- [Neutron/Metering/Bandwidth - OpenStack Wiki](https://wiki.openstack.org/wiki/Neutron/Metering/Bandwidth)
- [Neutron L3 Metering Agent - RedHat Docs](https://access.redhat.com/documentation/en-US/Red_Hat_Enterprise_Linux_OpenStack_Platform/5/html/Cloud_Administrator_Guide/section_networking-advanced-config.html)
- [No information from Neutron Metering agent - LaunchPad](https://bugs.launchpad.net/neutron/+bug/1506567)
- [Distributed Virtual Routing – Floating IPs - ASSAF MULLER](https://assafmuller.com/2015/04/15/distributed-virtual-routing-floating-ips)
