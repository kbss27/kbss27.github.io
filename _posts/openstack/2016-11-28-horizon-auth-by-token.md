---
layout: post
title: "Keystone 토큰을 이용한 Horizon 로그인"
date: 2016-11-28
categories: openstack
---

* content
{:toc}

## Introduction

사전에 받아온 Keystone 토큰만으로, ID와 패스워드없이 Horizon 로그인을 수행해본다.
이 방법은 Keystone 및 Horizon의 SSO 흐름 중에서 결론만 수행하는 것으로, 간단히 POST에 Token 값만 보내면 된다.


## 설정법

Horizon 설정 중 WEBSSO를 활성화해주면 된다.

```vi /etc/openstack-dashboard/local_settings.py```

```
...
WEBSSO_ENABLED = True

WEBSSO_INITIAL_CHOICE = "credentials"

WEBSSO_CHOICES = (
    ("credentials", _("Keystone Credentials"))
)
...
```

```WEBSSO_CHOICES```를 넣어주는 이유는 기존과 동일하게 ID/PW 로그인을 가능하게 해주기 위함이다.
ID/PW 로그인도 필요없다면 ```WEBSSO_ENABLED = True```만 설정해주면 된다.

이 후 ```service apache2 restart```로 재시작해준다.


## Token으로 로그인

Step 1) Keystone API 등으로 Token을 생성한다.

```
root@controller001:~# openstack token issue
+------------+-------------------------------------------+
| Field      | Value                                     |
+------------+-------------------------------------------+
| expires    | 2016-11-08T10:30:39Z                      |
| id         | gAAAAABYIZs_VDtx7a_auAnwB_L9W-cgFq-gh...  |
| project_id | 603a226757454579ae8564629482ca81          |
| user_id    | 3ef45f2ee709465e84fd865a654f2fcf          |
+------------+-------------------------------------------+
```

Step 2) 예제로 아래와 같은 HTML을 만든다.

```
<html>
<body>
<form action="https://<HORIZON>/auth/websso/" method="post">
	<input type="text" name="token" value="<TOKEN ID>">
	<input type="submit" value="Submit">
</form>
</body>
</html>
```

Step 3) 생성한 HTML을 브라우저로 실행한 뒤 Summit을 누른다.

이 후, ID/PW 로그인 과정없이 바로 대시보드 화면으로 들어가게 된다.
