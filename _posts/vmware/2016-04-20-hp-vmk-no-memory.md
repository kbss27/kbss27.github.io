---
layout: post
title: "HP 서버의 VMK_NO_MEMORY 이슈"
date: 2016-04-20
categories: vmware
---

* content
{:toc}

## 문제 상황

VM을 시작할려고 할 때 다음과 같은 메세지가 출력되면서 VM 시작 불가

```
Power On virtual machine *
A general system error occurred: The virtual machine could not start
VMK_NO_MEMORY
```


## 원인

[VMware KB2085618](https://kb.vmware.com/selfservice/microsites/search.do?language=en_US&cmd=displayKC&externalId=2085618)

HP 커스텀 ESXi 5.x 의 Agentless Management Service (AMS) 의 문제.
쉘에서 ''esxcli software vib list | grep ams'' 입력 후 hp-ams 버전이 다음과 같을 경우 발생할 수 있다.

- hp-ams 500.9.6.0-12.434156
- hp-ams-550.9.6.0-12.1198610
- hp-ams 500.10.0.0-18.434156
- hp-ams-550.10.0.0-18.1198610


## 해결책

hp-ams의 10.0.1 버전을 설치한다.

- [HP Agentless Management Service Offline Bundle for VMware vSphere 5.5](http://h20564.www2.hpe.com/hpsc/swd/public/detail?swItemId=MTX_b05d4c644fb742aa87cb5f5da1&lang=en-us&cc=us)
- [HP Agentless Management Service Offline Bundle for VMware ESXi 5.0 and vSphere 5.1](http://h20564.www2.hpe.com/hpsc/swd/public/detail?swItemId=MTX_27bf3dc9d5584973802c4d9f62&lang=en-us&cc=us)

위 링크에서 각자 버전에 맞는 hp-ams-esxi5.?-bundle-10.0.1-2.zip 을 다운로드 받은 다음, 데이터스토어의 적당한 위치에 업로드 한 뒤 다음 명령어로 업데이트한다.

```bash
esxcli software vib install -d zip_파일의_절대경로
```

업데이트 후 재시작을 해주어야 적용된다.