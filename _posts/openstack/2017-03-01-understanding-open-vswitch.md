---
layout: post
title: "Understanding Open vSwitch"
date: 2017-03-01
categories: openstack
---

* content
{:toc}

## Introduction

리눅스는 인터페이스 간에 L2 프레임을 전송할 수 있는 브릿지를 생성할 수 있다.
그러나 리눅스 브릿지는 제한적인 이더넷 프로토콜과 고전적인 브릿지 기능만 제공하므로,
리눅스 브릿지만으로는 클라우드 네트워크 환경에서 원하는 트래픽 플로우를 만들어내기 힘든 면이 있다.

Open vSwitch (이하 OVS)는 리눅스 브릿지와 동일하게 프레임을 전송하는 기능을 수행한다.
다른 점이라면 VLAN, VXLAN, GRE, OpenFlow, NetFlow, sFlow, SPAN, RSPAN, CLI, LACP 및 802.1ag와 같은 프로토콜을 지원하거나 유사한 기능을 제공할 수 있다.
또한 중앙 컨트롤러를 구축하여 컨트롤러를 통해 OVS의 가상 포트들을 프로비저닝하고 트래픽 규칙을 설정하는 것이 가능하다.

OVS의 트래픽 규칙은 Flow 모드라고 불리는데, 차이는 있으나 물리 스위치 또는 라우터의 프로세서가 트래픽을 관리하는 방식과 유사하다.
규칙은 L2, L3 및 L4 패킷 헤더의 거의 모든 필드에 대해 조건을 설정할 수 있으며,
규칙에 일치하는 프레임을 특정 포트로 전달하거나, 드롭하거나 또는 프레임을 재작성하는 등을 지정할 수 있다.

규칙들은 테이블 단위로 그룹핑되며 각자 우선 순위를 가진다.
프레임이 OVS로 들어오면 0번 테이블부터, 그리고 가장 높은 우선 순위의 규칙부터 프레임이 조건에 맞는지 체크한다.
조건에 맞다면 다음 규칙으로 넘어가지 않고 해당 규칙의 Action을 수행하며, 조건에 맞는 규칙이 하나도 없다면 프레임은 드롭된다.


## The basics

OpenStack 환경에 따라 다르겠지만, OpenStack 노드들은 여러개의 OVS 브릿지를 사용하고있다.
```ovs-vsctl list-br```로 브릿지 목록을 알 수 있다.

```
root@compute1:~] ovs-vsctl list-br
br-eth1
br-ex2
br-int
br-tun
```

이를 그림으로 나타내면 아래와 같다. 노드 내에 물리적으로 4개의 브릿지가 있다고 생각해도 무방하다.

![ovs_bridges](/media/openstack/ovs_bridges.png)

각 브릿지들이 어떤 포트들을 가지고있는지는 ```ovs-vsctl list-ports [브릿지명]```으로 알 수 있다.

```
root@compute1:~] ovs-vsctl list-ports br-int
int-br-eth1
int-br-ex2
patch-tun
```

br-int 브릿지에 3개의 포트가 있는 것을 볼 수 있다.

만약 포트의 상세 정보를 알고 싶다면 ```ovs-ofctl show [브릿지명]``` 명령어를 사용한다.
이 명령어를 통해 Flow 모드에 사용할 포트 번호 등을 알 수 있다.

```
root@compute1:~] ovs-ofctl show br-int
OFPT_FEATURES_REPLY (xid=0x2): dpid:0000bacba8eb4f43
n_tables:254, n_buffers:256
capabilities: FLOW_STATS TABLE_STATS PORT_STATS QUEUE_STATS ARP_MATCH_IP
actions: OUTPUT SET_VLAN_VID SET_VLAN_PCP STRIP_VLAN SET_DL_SRC SET_DL_DST SET_NW_SRC SET_NW_DST SET_NW_TOS SET_TP_SRC SET_TP_DST ENQUEUE
 3(int-br-eth1): addr:76:d7:1d:3f:4e:c4
     config:     0
     state:      0
     speed: 0 Mbps now, 0 Mbps max
 4(int-br-ex2): addr:7e:d9:87:cc:ea:57
     config:     0
     state:      0
     speed: 0 Mbps now, 0 Mbps max
 LOCAL(br-int): addr:ba:cb:a8:eb:4f:43
     config:     PORT_DOWN
     state:      LINK_DOWN
     speed: 0 Mbps now, 0 Mbps max
OFPT_GET_CONFIG_REPLY (xid=0x4): frags=normal miss_send_len=0
int-br-eth1
int-br-ex2
patch-tun
```

br-int 브릿지를 다시 한번 그림으로 표현하면 다음과 같다.

![ovs_br_int](/media/openstack/ovs_br_int.png)


## The layout

앞서 다루었던 명령어는 브릿지와 포트들의 단순 나열과 조회였다.
브릿지들간의 어떤 관계가 있는지는 ```ovs-vsctl show``` 명령어로 브릿지들의 레이아웃을 파악할 수 있다.

```
root@compute1:~] ovs-vsctl show
5ee56fdf-09b6-4f38-8de2-a699670bf8f7
    Bridge "br-ex2"             # 브릿지명
        Port "phy-br-ex2"       # 포트명
            Interface "phy-br-ex2"
                type: patch     # phy-br-ex2 포트(br-ex2 브릿지)는 int-br-ex2 포트(br-int 브릿지)와 패치되어있음을 의미
                options: {peer="int-br-ex2"}
        Port "br-ex2"
            Interface "br-ex2"
                type: internal
        Port "eth2"             # 노드의 eth2 인터페이스에 연결되어있는 포트
            Interface "eth2"
    Bridge "br-eth1"
        Port "br-eth1"
            Interface "br-eth1"
                type: internal
        Port "phy-br-eth1"
            Interface "phy-br-eth1"
                type: patch
                options: {peer="int-br-eth1"}
        Port "eth1"
            Interface "eth1"
    Bridge br-int
        fail_mode: secure
        Port br-int
            Interface br-int
                type: internal
        Port "qr-476984a0-53"
            tag: 1              # VLAN 1로 태깅
            Interface "qr-476984a0-53"
                type: internal
        Port "int-br-ex2"
            Interface "int-br-ex2"
                type: patch
                options: {peer="phy-br-ex2"}
        Port "int-br-eth1"
            Interface "int-br-eth1"
                type: patch
                options: {peer="phy-br-eth1"}
        Port "tapa3281257-92"
            tag: 1
            Interface "tapa3281257-92"
                type: internal
     ovs_version: "2.3.0"
```

br-ex2 브릿지와 br-int 브릿지는 패치 포트로 서로 연결되어있음을 알 수 있다.
또한 br-ex2 브릿지의 br-ex2 포트는 실제 호스트의 eth2 인터페이스에 연결되어있다.

![ovs_patch](/media/openstack/ovs_patch.png)


## The flows

브릿지의 Flow 규칙은 ```ovs-ofctl dump-flows [브릿지명]```으로 조회할 수 있다.

```
root@compute1:~] ovs-ofctl dump-flows br-int
NXST_FLOW reply (xid=0x4):
 cookie=0x0, duration=166494.195s, table=0, n_packets=2783, n_bytes=167502, idle_age=347, hard_age=65534, priority=1 actions=NORMAL
 cookie=0x0, duration=166486.390s, table=0, n_packets=1578, n_bytes=119878, idle_age=347, hard_age=65534, priority=3,in_port=3,dl_vlan=1301 actions=mod_vlan_vid:1,NORMAL
 cookie=0x0, duration=166492.361s, table=0, n_packets=1053216, n_bytes=360266929, idle_age=0, hard_age=65534, priority=2,in_port=3 actions=drop
 cookie=0x0, duration=166491.657s, table=0, n_packets=6, n_bytes=306, idle_age=65534, hard_age=65534, priority=2,in_port=4 actions=drop
 cookie=0x0, duration=166485.255s, table=0, n_packets=52575, n_bytes=6500437, idle_age=11, hard_age=65534, priority=3,in_port=4,vlan_tci=0x0000 actions=mod_vlan_vid:2,NORMAL
 cookie=0x0, duration=166493.840s, table=23, n_packets=0, n_bytes=0, idle_age=65534, hard_age=65534, priority=0 actions=drop
```

각 라인이 하나의 Flow 규칙을 의미하며 규칙은 크게 2개의 섹션으로 나눌 수 있다.

첫 번째 섹션은 규칙을 적용해야하는 트래픽인지 판단하는 조건이다.
2번째 Flow에서 ```in_port=3, dl_vlan=1301``` 조건이 있는데, 3번(int-br-eth1 패치) 포트에서 들어오고 VLAN 태그가 1301인 트래픽에 적용됨을 의미한다.

두 번째 섹션은 조건에 맞는 트래픽을 어떻게 처리할 것인가 이다.
마찬가지로 2번째 Flow에서 ```actions=mod_vlan_vid:1, NORMAL``` 액션이 정의되어있다.
이는 패킷의 VLAN 태그를 1로 변경하고, 그 이후는 일반적인 L2 처리를 수행하게 함을 의미한다.

종합해보면, 3번(int-br-eth1 패치) 포트에서 들어오고 VLAN 태그가 1301인 트래픽은
==> VLAN 태그가 1번으로 변경되고 VLAN 1을 받아주는 포트 또는 트렁크 포트로 흘러갈 것이다.

![ovs_flow](/media/openstack/ovs_flow.png)
