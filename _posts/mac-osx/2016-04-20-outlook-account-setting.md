---
layout: post
title: "OSX 기본 메일앱의 Outlook.com 계정 설정법"
date: 2016-04-20
categories: mac-osx
---

* content
{:toc}

> 네이버 [맥쓰사](http://cafe.naver.com/inmacbook.cafe)에 투고했던 글로서, 이 위키의 내용은 [원문](http://cafe.naver.com/inmacbook/1109413)과 동일하다.


## 명령어로 아웃룩 IMAP에 접속해보자

메일 앱에 계정을 설정하기 전에, 실제로 아웃룩 서버에 잘 접속되는지 확인해보는게 좋을 것 같네요.
터미널을 실행해주시구요. 다음 명령어를 입력하세요.

```bash
openssl s_client -crlf -connect imap-mail.outlook.com:993
```

정상적이라면 ```OK Outlook.com IMAP4rev1 server…``` 라고 나올 겁니다.
이 의미는 현재 인터넷 상황에서 내 컴퓨터가 아웃룩 서버에 정상적으로 붙을 수 있다는 거에요.

참고로 live.co.kr 이나 hotmail.co.kr 등을 사용하시는 분도 동일하게 imap-mail.outlook.com 으로 접속하시면 됩니다.
제가 알고있는 한, 서버는 outlook.com 으로 통일이고 단순히 계정주소만 다를 뿐이에요.

이제 로그인을 해볼께요. ```OK Outlook.com…``` 이 후에 입력하시면 됩니다.
만약 타임아웃으로 접속이 끊겼다면 openssl 부터 다시 입력해주세요~

```bash
A login 메일주소 암호
```

예를 들어서 A login idda@live.co.kr paswordda 이렇게 입력하시면 되요.
정상적으로 로그인되었다면 ```A OK 메일주소 authenticated successfully``` 라고 할거에요.
아이디나 암호가 틀렸다면 ```Invalid username or password``` 가 나오네요. A login 재시도 해보세요~

마지막으로 폴더 리스트를 출력해볼께요. 정상적으로 로그인된 상태에서 이렇게 입력하시면 나옵니다.

```bash
A list "" "*"
```

" 이건 쌍따옴표라는 것에 주의하세요~ 정상적이면 ```* LIST (\HasNoChildren) "/" "Inbox"```
등등 1depth에서의 폴더들이 출력될 거에요.

여기까지 성공했다면 outlook.com 서버 및 접속 자체는 문제가 없다고 보면 됩니다.


## 메일 앱에서 IMAP 계정을 설정하자

이건 그냥 스샷으로 때우는게 좋을 것 같네요.
```시스템 환경설정 > 인터넷 계정 > + 버튼 > 다른 계정 추가 > 메일 계정 추가``` 부터 시작합니다.

![osx_outlook_imap_setting_1](/media/mac-osx/osx_outlook_imap_setting_1.png)
![osx_outlook_imap_setting_2](/media/mac-osx/osx_outlook_imap_setting_2.png)
![osx_outlook_imap_setting_3](/media/mac-osx/osx_outlook_imap_setting_3.png)
![osx_outlook_imap_setting_4](/media/mac-osx/osx_outlook_imap_setting_4.png)


## SMTP 설정을 바로 맞춰주자.

IMAP 설정까지하시면 이제 메일을 보실 수 있을 겁니다. 그러나 메일을 보내는건 안될 거에요.
메일을 보낼 때는 SMTP 프로토콜을 사용하는데, 메일 앱에서 계정을 생성할 때 SMTP를 잘못 설정해주어서 바로 맞춰주어야해요.
마찬가지로 스샷으로 때울께요~ 이번에는 <wrap hi>메일 앱의 환경설정 > 계정``` 부터 시작합니다.

![osx_outlook_smtp_setting_1](/media/mac-osx/osx_outlook_smtp_setting_1.png)
![osx_outlook_smtp_setting_2](/media/mac-osx/osx_outlook_smtp_setting_2.png)
![osx_outlook_smtp_setting_3](/media/mac-osx/osx_outlook_smtp_setting_3.png)


여기까지 완료하셨다면 메일앱에서도 outlook.com 계정으로 메일을 받고 보내고 무난히 되실 거에요~