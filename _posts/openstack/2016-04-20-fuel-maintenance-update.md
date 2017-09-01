---
layout: post
title: "Fuel Maintenance 업데이트 스크립트"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

> 아래는 Fuel 8.0/liberty, 7.0/Kilo 기준으로 작성되었다.

[Mirantis - Maintenance Updates](https://docs.mirantis.com/openstack/fuel/fuel-7.0/maintenance-updates.html)

업데이트를 한줄한줄 하기에는 귀찮으므로 다음 스크립트를 만들어서 Fuel Master 노드에서 실행시킨다.

```bash
#!/bin/bash

set -e

FUEL_ID="Fuel ID"
FUEL_PW="Fuel Password"
ENV_ID="Fuel Enviroment ID"

#1 Update Docker Container
yum -y update
docker load -i /var/www/nailgun/docker/images/fuel-images.tar
dockerctl destroy all
dockerctl start all
fuel release --sync-deployment-tasks --dir /etc/puppet/

#2 Apply Patch
wget https://github.com/Mirantis/tools-sustaining/raw/master/scripts/mos_apply_mu.py
python ./mos_apply_mu.py --env-id=$ENV_ID --user=$FUEL_ID --pass=$FUEL_PW --update
watch -n 60 "python ./mos_apply_mu.py --env-id=$ENV_ID --user=$FUEL_ID --pass=$FUEL_PW --check"
```

이 후에 모든 노드들의 상태가 ```UPDATE=OK```가 될 때까지 기다린다.

```
Every 60.0s: python ./mos_apply_mu.py --env-id=1 --user=admin --pass=aktlakfh\!@34 --check

        MASTER_IP: 10.10.40.1
        MOS_VERSION: 8.0
Node 10.10.40.9 state: UPDATE=OK

Node 10.10.40.7 state: UPDATE=OK
...
```

업데이트가 완료되면 노드들의 모든 APT 팩키지들이 업데이트 되어있는 것을 볼 수 있다.
그러나 업데이트만 되었을 뿐, 서비스는 재시작하지 않은 상태이므로 재시작해준다.

- On Primary controller node

```bash
crm resource restart p_heat-engine
crm resource restart p_neutron-plugin-openvswitch-agent
crm resource restart p_neutron-dhcp-agent
crm resource restart p_neutron-metadata-agent
crm resource restart p_neutron-l3-agent
```

- On all the OpenStack controller nodes

```bash
initctl restart heat-api-cloudwatch
initctl restart heat-api-cfn
initctl restart heat-api
initctl restart cinder-api
initctl restart cinder-scheduler
initctl restart nova-objectstore
initctl restart nova-cert
initctl restart nova-api
initctl restart nova-consoleauth
initctl restart nova-conductor
initctl restart nova-scheduler
initctl restart nova-novncproxy
initctl restart neutron-server
```

- On all the OpenStack compute nodes

```bash
initctl restart neutron-plugin-openvswitch-agent
initctl restart nova-compute
```