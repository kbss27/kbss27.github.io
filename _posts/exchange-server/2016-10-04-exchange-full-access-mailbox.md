---
layout: post
title: "Full Access to Mailbox on a Exchange Server"
date: 2016-10-04
categories: exchange
---

* content
{:toc}

## Exchange Server 2007 이상

A 유저에게 특정 MDB를 다룰 수 있는 Full Access 권한을 준다.
MDB 단위로 다루기 때문에, A 유저는 해당 MDB에 있는 모든 유저들의 사서함을 열람할 수 있다.


### Step 1. 대상 MDB 확인

Exchange 관리 콘솔 또는 파워쉘로 확인할 수 있다.

```powershell
[PS] C:\Windows\system32>Get-MailboxDatabase

Name                           Server          Recovery        ReplicationType
----                           ------          --------        ---------------
Mailbox Database 0834494192    INTER6-EXC10    False           None
journal                        INTER6-EXC10    False           None
```

이 예제에서는 ```inter6``` 유저에게 ```Mailbox Database 0834494192``` MDB를 다룰 수 있는 권한을 할당해본다.


### Step 2. 특정 유저에게 Full Access 권한 할당

```powershell
# MDB 확인
[PS] C:\Windows\system32>Get-MailboxDatabase -Identity "Mailbox Database 0834494192"

Name                           Server          Recovery        ReplicationType
----                           ------          --------        ---------------
Mailbox Database 0834494192    INTER6-EXC10    False           None

# 권한을 할당할 유저 확인
[PS] C:\Windows\system32>Get-User -Identity "inter6"

Name                                                        RecipientType
----                                                        -------------
inter6                                                      UserMailbox

# 권한 부여
[PS] C:\Windows\system32>Get-MailboxDatabase -Identity "Mailbox Database 0834494192" | Add-ADPermission -User "inter6" -AccessRights GenericAll

Identity             User                 Deny  Inherited
--------             ----                 ----  ---------
Mailbox Database ... EXC10\inter6         False False
```


### Step 3. 확인

실제로 잘 할당되었는지 OWA나 IMAP 로그인을 통해 알아본다.

- OWA에서는 권한을 가진 A 유저로 로그인한 다음, ```다른 사서함 열기```를 클릭하여 다른 B 유저의 계정명을 입력하면 B 유저의 메일박스를 열람할 수 있다.
- IMAP은 로그인시 ```a LOGIN domain\'A 유저'\'B 유저' 'A 유저의 PASSWORD'```와 같은 형식으로 로그인하면 A 유저의 패스워드만으로 B 유저의 메일박스를 열람할 수 있다.
- EWS 등도 관련 API를 통해 열람이 가능하다.

아래 예제는 IMAP을 통해 권한을 가진 ```inter6``` 유저로 다른 ```inter6x``` 유저의 메일박스를 열람해본다.

```bash
(default) inter6-osx:~ inter6$ telnet 192.168.11.16 143
Trying 192.168.11.16...
Connected to 192.168.11.16.
Escape character is '^]'.
* OK The Microsoft Exchange IMAP4 service is ready.

a1 LOGIN exc10.inter6.com\inter6\inter6x PASSWORD!
a1 OK LOGIN completed.

a2 list "" "*"
* LIST (\HasNoChildren) "/" &ulS6qA-
* LIST (\Marked \HasNoChildren) "/" INBOX
* LIST (\HasNoChildren) "/" "&vPSwuA- &07jJwNVo-"
* LIST (\HasNoChildren) "/" "&vPSwvA- &07jJwNVo-"
* LIST (\HasNoChildren) "/" &xfC3fcyY-
* LIST (\HasNoChildren) "/" &x3zIFQ-
* LIST (\HasNoChildren) "/" "&x4TC3A- &vPStANVo-"
* LIST (\HasNoChildren) "/" &x5HFxQ-
* LIST (\HasNoChildren) "/" &yACxEA-
* LIST (\HasNoChildren) "/" "&yBXQbA- &ulTHfA-"
* LIST (\HasNoChildren) "/" "&ycDGtA- &07jJwNVo-"
a2 OK LIST completed.
```


### Step 4. 권한 삭제

역으로 할당한 권한을 빼버리면 된다.

```powershell
[PS] C:\Windows\system32>Get-MailboxDatabase -Identity "Mailbox Database 0834494192" | Remove-ADPermission -User "inter6" -AccessRights GenericAll

확인
이 작업을 수행하시겠습니까?
액세스 권한 "'GenericAll'"이(가) 있는 "inter6" 사용자에 대해 Active Directory 사용 권한 "Mailbox Database
0834494192"을(를) 제거하는 중입니다.
[Y] 예(Y)  [A] 모두 예(A)  [N] 아니요(N)  [L] 모두 아니요(L)  [?] 도움말 (기본값은 "Y"임): Y
```
