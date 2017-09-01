---
layout: post
title: "Nova Instance CPU limit"
date: 2016-04-25
categories: openstack
---

* content
{:toc}

## 설정

### cgroup 설정

Compute 노드가 KVM/QEMU Hypervisor를 사용할 경우, cgroup을 통해 인스턴스의 CPU 성능을 제한한다.
이를 위해 QEMU 설정에서 cgroup 컨트롤러를 사용하겠다고 설정한다.

```bash
root@compute001:~] vi /etc/libvirt/qemu.conf
-->
cgroup_controllers = [ "cpu", "cpuset", "cpuacct" ]
```

```bash
root@compute001:~] mkdir /cgroup
root@compute001:~] mount -t cgroup -o cpu cpu /cgroup
```

```bash
root@compute001:~] service libvirtd restart
```

### Flavor의 CPU 메타데이터 설정

```cpu.limit```라는 Flavor를 만들고 여기에 CPU 사용을 제한하는 메타데이터를 설정한다.

```bash
openstack flavor set cpu.limit --property quota:cpu_quota=10000 --property quota:cpu_period=20000
```

CPU에 대한 메타데이터 속성은 다음과 같다.

- cpu_quota : 각 vCPU 별 최대 bandwidth 제한으로 ms 단위로 1000 ~ 18446744073709551 사이의 값을 설정한다. -1로 설정하면 제한을 두지 않는다.

- cpu_period : (QEMU/LXC 용) 각 vCPU 별 최대 interval 제한으로 ms 단위로 1000 ~ 1000000 사이의 값을 설정한다. 0으로 설정하면 제한을 두지 않는다.

- cpu_shares : Specifies the proportional weighted share for the domain. If this element is omitted, the service defaults to the OS provided defaults. There is no unit for the value; it is a relative measure based on the setting of other VMs. For example, a VM configured with value 2048 gets twice as much CPU time as a VM configured with value 1024.

- cpu_limit : (VMware Hypervisor용) 모든 vCPU의 최대 CPU 클럭 제한으로 Mhz 단위로 설정한다.

- cpu_reservation : (VMware Hypervisor용) 모든 vCPU의 최소 CPU 클럭으로 Mhz 단위로 설정한다.

- cpu_shares_level : (VMware Hypervisor용) 클럭 공유 레벨로 custom, high, normal, low 중 하나를 설정한다.

- cpu_shares_share : (VMware Hypervisor용) cpu_shares_level을 custom으로 설정하였을 경우 Mhz 단위로 설정한다.


## 테스트 및 확인

CentOS 7 이미지로 인스턴스를 2개 만들고, 1개만 CPU 제한이 설정된 Flavor로 생성해낸다.
이 후 Compute 노드에서 ```virsh```을 통해 인스턴스에 설정된 CPU 튜닝값을 확인해본다.

```bash
root@compute001:~] virsh list
 Id    Name                           State
----------------------------------------------------
 4     instance-0000001c              running	# CPU 제한이 설정되지 않은 인스턴스
 5     instance-0000001d              running	# CPU 제한이 설정된 인스턴스

root@compute001:~] virsh dumpxml instance-0000001c
...
  <cputune>
    <shares>1024</shares>
  </cputune>
...

root@compute001:~] virsh dumpxml instance-0000001d
...
  <cputune>
    <shares>1024</shares>
    <quota>10000</quota>	# cpu_quota 메타데이터로 설정한 값
    <period>20000</period>	# cpu_period 메타데이터로 설정한 값
  </cputune>
...
```

인스턴스 내에서 ```sysbench```를 통해 vCPU 성능을 측정해본다.

```bash
[root@instance ~] yum install -y epel-release
[root@instance ~] yum install -y sysbench

[root@instance ~] sysbench --test=cpu --cpu-max-prime=20000 run

# CPU 제한이 설정되지 않은 인스턴스
Test execution summary:
    total time:                          112.3372s
    total number of events:              10000
    total time taken by event execution: 112.2726
    per-request statistics:
         min:                                  7.74ms
         avg:                                 11.23ms
         max:                                109.99ms
         approx.  95 percentile:              18.00ms

Threads fairness:
    events (avg/stddev):           10000.0000/0.00
    execution time (avg/stddev):   112.2726/0.00

# CPU 제한이 설정된 인스턴스
Test execution summary:
    total time:                          239.5417s
    total number of events:              10000
    total time taken by event execution: 239.3497
    per-request statistics:
         min:                                  7.97ms
         avg:                                 23.93ms
         max:                                174.73ms
         approx.  95 percentile:              37.68ms
```

## References

- [Flavors - OpenStack Docs](http://docs.openstack.org/admin-guide/compute-flavors.html#compute-flavors)
- [Control Groups Resource Management - libvirt Docs](https://libvirt.org/cgroups.html)
- [Enabling CGroups - Hortonworks](https://docs.hortonworks.com/HDPDocuments/HDP2/HDP-2.3.2/bk_yarn_resource_mgt/content/enabling_cgroups.html)
