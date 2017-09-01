---
layout: post
title: "HAProxy가 바인드 하고 있는 포트 확인"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

컨트롤러 노드에서 ```grep -r bind /etc/haproxy``` 를 입력한다.

```bash
root@controller001:/etc/haproxy# grep -r bind /etc/haproxy

/etc/haproxy/conf.d/180-murano-api.cfg:  bind 10.10.10.2:8082
/etc/haproxy/conf.d/180-murano-api.cfg:  bind 192.168.11.19:8082 ssl crt /var/lib/astute/haproxy/public_haproxy.pem

/etc/haproxy/conf.d/060-nova-metadata-api.cfg:  bind 10.10.10.2:8775

/etc/haproxy/conf.d/161-heat-api-cfn.cfg:  bind 10.10.10.2:8000
/etc/haproxy/conf.d/161-heat-api-cfn.cfg:  bind 192.168.11.19:8000 ssl crt /var/lib/astute/haproxy/public_haproxy.pem

/etc/haproxy/conf.d/130-radosgw.cfg:  bind 10.10.10.2:8080
/etc/haproxy/conf.d/130-radosgw.cfg:  bind 192.168.11.19:8080 ssl crt /var/lib/astute/haproxy/public_haproxy.pem

/etc/haproxy/conf.d/085-neutron.cfg:  bind 10.10.10.2:9696
/etc/haproxy/conf.d/085-neutron.cfg:  bind 192.168.11.19:9696 ssl crt /var/lib/astute/haproxy/public_haproxy.pem

/etc/haproxy/conf.d/090-glance-registry.cfg:  bind 10.10.10.2:9191

/etc/haproxy/conf.d/010-stats.cfg:  bind 10.10.10.2:10000

/etc/haproxy/conf.d/140-ceilometer.cfg:  bind 10.10.10.2:8777
/etc/haproxy/conf.d/140-ceilometer.cfg:  bind 192.168.11.19:8777 ssl crt /var/lib/astute/haproxy/public_haproxy.pem

/etc/haproxy/conf.d/110-mysqld.cfg:  bind 10.10.10.2:3306

/etc/haproxy/conf.d/070-cinder-api.cfg:  bind 10.10.10.2:8776
/etc/haproxy/conf.d/070-cinder-api.cfg:  bind 192.168.11.19:8776 ssl crt /var/lib/astute/haproxy/public_haproxy.pem

/etc/haproxy/conf.d/020-keystone-1.cfg:  bind 10.10.10.2:5000
/etc/haproxy/conf.d/020-keystone-1.cfg:  bind 192.168.11.19:5000 ssl crt /var/lib/astute/haproxy/public_haproxy.pem

/etc/haproxy/conf.d/999-lma.cfg:  bind 10.10.10.2:5565

/etc/haproxy/conf.d/160-heat-api.cfg:  bind 10.10.10.2:8004
/etc/haproxy/conf.d/160-heat-api.cfg:  bind 192.168.11.19:8004 ssl crt /var/lib/astute/haproxy/public_haproxy.pem

/etc/haproxy/conf.d/040-nova-api-1.cfg:  bind 10.10.10.2:8773
/etc/haproxy/conf.d/040-nova-api-1.cfg:  bind 192.168.11.19:8773 ssl crt /var/lib/astute/haproxy/public_haproxy.pem

/etc/haproxy/conf.d/170-nova-novncproxy.cfg:  bind 192.168.11.19:6080 ssl crt /var/lib/astute/haproxy/public_haproxy.pem

/etc/haproxy/conf.d/162-heat-api-cloudwatch.cfg:  bind 10.10.10.2:8003
/etc/haproxy/conf.d/162-heat-api-cloudwatch.cfg:  bind 192.168.11.19:8003 ssl crt /var/lib/astute/haproxy/public_haproxy.pem

/etc/haproxy/conf.d/050-nova-api-2.cfg:  bind 10.10.10.2:8774
/etc/haproxy/conf.d/050-nova-api-2.cfg:  bind 192.168.11.19:8774 ssl crt /var/lib/astute/haproxy/public_haproxy.pem

/etc/haproxy/conf.d/015-horizon.cfg:  bind 192.168.11.19:80

/etc/haproxy/conf.d/080-glance-api.cfg:  bind 10.10.10.2:9292
/etc/haproxy/conf.d/080-glance-api.cfg:  bind 192.168.11.19:9292 ssl crt /var/lib/astute/haproxy/public_haproxy.pem

/etc/haproxy/conf.d/190-murano_rabbitmq.cfg:  bind 192.168.11.19:55572

/etc/haproxy/conf.d/030-keystone-2.cfg:  bind 10.10.10.2:35357

/etc/haproxy/conf.d/017-horizon-ssl.cfg:  bind 192.168.11.19:443 ssl crt /var/lib/astute/haproxy/public_haproxy.pem
```

위 예제에서 192.168.11.19 주소는 End-point VIP이며, 10.10.10.2는 Management 네트워크에서의 VIP이다.

이를 그림으로 나타내면 다음과 같다.

![haproxy_bind_port](/media/openstack/haproxy_bind_port.png)