---
layout: post
title: "무선랜 카드 AP 모드 사용하기"
date: 2016-05-06
categories: windows
---

* content
{:toc}

## 어댑터 생성

```
netsh wlan set hostednetwork mode=allow ssid=inter6 key=qwe123!@# keyUsage=persistent
```

- myssid : 원하는 SSID 이름
- mypasswd : 만들어지는 AP의 WPA2 인증키


## 어댑터 공유

인터넷이 연결되어 있는 랜카드의 속성에서 공유 탭에서 공유 설정을 한다.

홈네트워킹 연결은 Microsoft Virtual WiFi Miniport Adapter를 선택하면 된다.


## 시작 및 정지

- 서비스 시작 명령 : ```netsh wlan start hostednetwork```
- 서비스 중단 명령 : ```netsh wlan stop hostednetwork```


## (Optional) 간편하게 서비스 시작/중단하기

```C:\windows\System32\``` 폴더에 ```netsh``` 실행파일이 있는데 이 실행파일을 시작메뉴에 등록시키고 시작메뉴에 등록된 명령어 속성을 편집한다.
대상 부분의 뒷부분에 ```wlan start hostednetwork``` 옵션을 적어주면 시작되고 ```wlan stop hostednetwork``` 옵션을 적어주면 중단 된다.