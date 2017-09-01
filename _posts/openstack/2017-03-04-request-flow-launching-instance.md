---
layout: post
title: "Request flow when launching an Instance"
date: 2017-03-04
categories: openstack
---

* content
{:toc}

## Introduction

OpenStack에서 하나의 인스턴스를 실행하기 위해서는 Nova 및 Glance, Cinder, Neutron 등의 다양한 리소스를 필요로 한다.

![OpenStack Compute Service](/media/openstack/compute_service.png)


## Request flow

| Step | Request                                     | Description                                                  |
|------|---------------------------------------------|--------------------------------------------------------------|
| 1    | Client -> Keystone                          | Authentication request                                       |
| 2    | Keystone -> Token Store                     | Save token                                                   |
| 3    | Keystone -> Client                          | Pass authentication token                                    |
| 4    | Client -> Nova.api                          | Start instance                                               |
| 5    | Nova.api -> Database                        | Create initial entry for instance                            |
| 6    | Nova.api -> RabbitMQ                        | Make rpc.cast to request the new instance                    |
| 7    | Nova.api -> Client                          | Instance request complete                                    |
| 8    | Nova.schedular -> RabbitMQ                  | Subscribe new instance request                               |
| 9    | Nova.schedular -> Database                  | Read filtering and weighing information                      |
| 10   | Nova.schedular -> Database                  | Read cluster state                                           |
| 11   | Nova.schedular -> Database                  | Save instance state                                          |
| 12   | Nova.schedular -> RabbitMQ                  | Rpc.cast to launch instance                                  |
| 13   | Nova-compute -> RabbitMQ                    | Subscribe new instance request                               |
| 14   | Nova-compute -> RabbitMQ                    | Rpc.call to Nova-conductor to fetch the instance information |
| 15   | Nova-conductor -> RabbitMQ                  | Subscribe new instance request                               |
| 16   | Nova-conductor -> RabbitMQ                  | Read instance state                                          |
| 17   | Nova-conductor -> RabbitMQ                  | Publish new instance state                                   |
| 18   | Nova-compute -> RabbitMQ                    | Subscribe new instance request                               |
| 19   | Nova-compute -> Glance.api                  | [REST] get Image URI by Image ID from glance                 |
| 20   | Glance.api -> Nova-compute                  | Return image URI                                             |
| 21   | Nova-compute -> Ceph_mon                    | Retrieve cluster map                                         |
| 22   | Ceph_mon -> Nova-compute                    | Return cluster map                                           |
| 23   | Nova-compute -> Ceph_rgw                    | [REST] request for object                                    |
| 24   | Ceph_rgw -> Ceph_osd                        | [Socket] get object                                          |
| 25   | Ceph_rgw -> Nova-compute                    | Return object                                                |
| 26   | Nova-compute -> Neutron-server              | Allocate and configure the network for the instance          |
| 27   | Neutron-server -> RabbitMQ                  | Request IP address                                           |
| 28   | Neutron-server -> RabbitMQ                  | Request L2 configuration                                     |
| 29   | Neutron-DHCP-agent -> RabbitMQ              | Read request IP address                                      |
| 30   | Neutron-DHCP-agent -> Dnsmasq               | Allocate IP address                                          |
| 31   | Dnsmasq -> Neutron-DHCP-agent               | Reply                                                        |
| 32   | Neutron-DHCP-agent -> RabbitMQ              | Reply IP address                                             |
| 33   | Neutron-server -> RabbitMQ                  | Read IP address                                              |
| 34   | Neutron-L2-Agent -> RabbitMQ                | Read request for L2 configuration                            |
| 35   | Neutron-L2-Agent -> Libvirt                 | Configure L2                                                 |
| 36   | Neutron-L2-Agent -> RabbitMQ                | Reply to L2 configuration                                    |
| 37   | Neutron-server -> Database                  | Save instance network state                                  |
| 38   | Neutron-server -> Nova-compute              | Pass network information                                     |
| 39   | Nova-compute -> Cinder.api                  | [REST] get volume data                                       |
| 40   | Cinder.api -> Keystone                      | Validate token and permissions                               |
| 41   | Keystone -> Cinder.api                      | Update authentication headers with roles and acl             |
| 42   | Cinder.api -> Nova-compute                  | Return volume information                                    |
| 43   | Nova-compute -> Libvirt                     | Start VM                                                     |
| 44   | Nova-compute -> Libvirt                     | Update port information                                      |
| 45   | Nova-compute -> RabbitMQ                    | Rpc.call to Nova-conductor to fetch the instance information |
| 46   | Nova-conductor -> RabbitMQ                  | Subscribe new instance request                               |
| 47   | Nova-conductor -> RabbitMQ                  | Publish new instance state                                   |
| 48   | Nova-compute -> Libvirt                     | Pass volume information                                      |
| 49   | Libvirt -> Ceph_mon                         | Get cluster map                                              |
| 50   | Ceph_mon -> Libvirt                         | Return cluster map                                           |
| 51   | Libvirt -> Ceph_osd                         | Mount volume                                                 |
| 52   | VM-instance -> Neutron_metadata_proxy       | http rest 169.254.169.254                                    |
| 53   | Neutron_metadata_proxy -> Nova-api-metadata | http rest add uuid into X-headers                            |
| 54   | Neutron_metadata_proxy -> VM-instance       | Return metadata                                              |
| 55   | Client -> Nova-api                          | Poll instance state                                          |
| 56   | Nova.api -> Database                        | Read instance state                                          |
| 57   | Database -> Nova.api                        | Return state                                                 |
| 58   | Nova-api -> Client                          | Return instance state                                        |
