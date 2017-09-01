---
layout: post
title: "Fuel 플러그인 설치 스크립트"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

[Mirantis - Fuel Plugin Catalog](https://www.mirantis.com/products/openstack-drivers-and-plugins/fuel-plugins/)

아래 예제는 다음 플러그인을 설치한다.

- elasticsearch_kibana-0.8-0.8.0-1.noarch.rpm
- influxdb_grafana-0.8-0.8.0-1.noarch.rpm
- lma_collector-0.8-0.8.0-1.noarch.rpm
- lma_infrastructure_alerting-0.8-0.8.0-1.noarch.rpm
- fwaas-plugin-1.1-1.1.0-1.noarch.rpm

```bash
#!/bin/bash
set -e

mkdir ~/plugin
cd ~/plugin

echo "download plugin"
wget http://plugins.mirantis.com/repository/e/l/elasticsearch_kibana/elasticsearch_kibana-0.8-0.8.0-1.noarch.rpm
wget http://plugins.mirantis.com/repository/i/n/influxdb_grafana/influxdb_grafana-0.8-0.8.0-1.noarch.rpm
wget http://plugins.mirantis.com/repository/l/m/lma_collector/lma_collector-0.8-0.8.0-1.noarch.rpm
wget http://plugins.mirantis.com/repository/l/m/lma_infrastructure_alerting/lma_infrastructure_alerting-0.8-0.8.0-1.noarch.rpm
wget http://plugins.mirantis.com/repository/f/w/fwaas-plugin/fwaas-plugin-1.1-1.1.0-1.noarch.rpm

echo "install plugin"
fuel plugins --install elasticsearch_kibana-0.8-0.8.0-1.noarch.rpm
fuel plugins --install influxdb_grafana-0.8-0.8.0-1.noarch.rpm
fuel plugins --install lma_collector-0.8-0.8.0-1.noarch.rpm
fuel plugins --install lma_infrastructure_alerting-0.8-0.8.0-1.noarch.rpm
fuel plugins --install fwaas-plugin-1.1-1.1.0-1.noarch.rpm

fuel plugins --list
echo "done"
```