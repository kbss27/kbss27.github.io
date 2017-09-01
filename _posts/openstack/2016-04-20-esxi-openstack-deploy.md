---
layout: post
title: "VMware ESXi에 OpenStack 설치법"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

## 이 매뉴얼은

- VMware ESXi에 Mirantis Fuel을 이용한 OpenStack 배포 가이드
- Step-by-Step으로 진행하는 Quick Guide (스크린샷 포함)

### 대상 유저

- OpenStack을 처음으로 설치해보고 싶은 유저
- (싱글 노드, DevStack이 아닌) 멀티 노드 OpenStack 테스트 환경을 설치해보고 싶은 유저
- VMware ESXi 를 다룰 줄 아는 유저
- 유저의 홈 네트워크에 있는 공유기 등을 다룰 줄 아는 유저
- 기본적인 가상화, 네트워크 지식을 갖춘 유저

### 목표

- OpenStack Liberty 버전 배포
- 총 노드 4개 구축
  - Fuel Master 노드 * 1
  - Controller (Horizon, Keystone, Neutron 등) 노드 * 1
  - Compute (Nova) 노드 * 1
  - Storage (Ceph) 노드 * 1

![노드 구성도](/media/openstack/esxi_deploy_architecture.png)

### 준비물

- VMware ESXi 5.0 이상 서버
  - CPU: 4Core 이상
  - RAM: 16GB 이상
  - SSD 데이터스토어(Optional): 여유 100GB 이상
  - HDD 데이터스토어: 여유 220GB 이상
  - 이보다 낮아도 가능하긴 하나, 매우 느릴 것이며 응답 타임아웃 발생으로 오작동 할 수 있다.
- Mirantis Fuel 8.0 ISO 이미지 - [[https://software.mirantis.com/openstack-download-form/|다운로드]]
  - 다운로드 완료 후, 데이터스토어에 업로드 해둔다.
- 2~4시간 소요

### 가이드 수행 환경

- VMware ESXi v5.5 서버
  - CPU:4Core / RAM:16GB / SSD / HDD
- 공유기를 사용하는 홈 네트워크

### 제약 사항

- 공유기를 사용하기 때문에 외부 인터넷망에서 OpenStack 내의 VM으로 접근하지는 못한다.
  - 공유기 내부 네트워크에서의 접근은 가능
  - 공유기에 적절한 NAT 설정(PNAT 등)을 한다면 외부에서도 접근 가능
- OpenStack 용어들에 언급은 하지만, 자세한 설명은 하지 않는다.

## 설치 방법

### 1. 네트워크 설정

#### 1-1. ESXi 가상 스위치 생성

Step 1. 다음 그림과 같이 ESXi 내의 3개의 가상 스위치를 만든다.

![네트워크 구성도](/media/openstack/esxi_deploy_networks.png)

- PXE, Management, Storage 총 3개의 네트워크를 수행하는 스위치 1개
  - 각 네트워크는 VLAN 태깅으로 서로를 구분시킨다.
    - PXE 네트워크 VLAN ID: 0
    - Management 네트워크 VLAN ID: 1
    - Storage 네트워크 VLAN ID: 2
- Private 네트워크를 수행하는 스위치 1개
- Public 네트워크(여기서는 공유기 내의 홈 네트워크)와 통신할 수 있는, 실제 NIC가 물려있는 스위치 1개

-- TODO. ESXi 설정 스크린샷 --


Step 2. 생성한 3개의 가상 스위치의 비점유 모드를 비활성화한다.

ESXi 가상 스위치의 비점유 모드는, VM의 vNIC에 매칭되는 MAC 주소 프레임만을 해당 VM으로 흘려보내는 기능이다.
각 OpenStack 노드들은 vNIC에 대해 여러 MAC 주소를 흘려보내고 받아야하기 때문에, 비점유 모드를 비활성화해야한다.
그렇지 않으면 노드들이 같은 네트워크에 속해있더라도 통신을 할 수 없다.

-- TODO. ESXi 설정 스크린샷 --


Step 3. 공유기의 DHCP 기능을 비활성화한다.

Public 네트워크에 있는 공유기 등이 DHCP 응답 패킷을 주어서는 안된다. 즉, DHCP 서버가 존재해서는 안된다.
따라서 공유기의 매뉴얼을 참고하여 DHCP 기능을 비활성화한다.
그 외의 네트워크는 가상 스위치로 만든 Dedicated 네트워크이므로 DHCP 서버가 존재하지 않는다.

-- TODO. 공유기 스크린샷 --


#### 1-2. VM 생성

Step 1. 다음과 같이 VM을 생성한다.

- VM 0 - Fuel Master
  - OS Type: Cent OS 7 (또는 6) 64bit
  - CPU: 2Core
  - RAM: 3GB
  - Disk 0: HDD 70GB
  - NIC 0: PXE Network
  - NIC 1: Public Network

- VM 1 - Controller
  - OS Type: Ubuntu 64bit
  - CPU: 4Core
  - RAM: 6GB
  - Disk 0: SSD(또는 HDD) 70GB
  - NIC 0: PXE Network
  - NIC 1: Management Network
  - NIC 2: Public Network
  - NIC 3: Private Network
  - NIC 4: Storage Network

- VM 2 - Compute
  - OS Type: Ubuntu 64bit
  - CPU: 4Core
  - RAM: 6GB
  - Disk 0: HDD 70GB
  - NIC 0: PXE Network
  - NIC 1: Management Network
  - NIC 2: Public Network
  - NIC 3: Private Network
  - NIC 4: Storage Network

- VM 3 - Storage (Ceph)
  - OS Type: Ubuntu 64bit
  - CPU: 2Core
  - RAM: 3GB
  - Disk (선택사항)
    - only SSD (No Journal, Fast)
      - Disk 0: SSD 70GB
    - SSD + HDD (Use Journal, Normal) <- 매뉴얼은 이 옵션으로 진행
      - Disk 0: SSD 20GB
      - Disk 1: HDD 70GB
    - only HDD (No Journal, Slow)
      - Disk 0: HDD 70GB
  - NIC 0: PXE Network
  - NIC 1: Management Network
  - NIC 2: Public Network
  - NIC 3: Private Network
  - NIC 4: Storage Network

### 2. Fuel 노드 설치


### 3. OpenStack 배포

#### 3-1. 배포 환경 설정

#### 3-2. 배포 및 테스트