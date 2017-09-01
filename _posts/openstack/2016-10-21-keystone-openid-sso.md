---
layout: post
title: "Keystone OpenID SSO"
date: 2016-10-21
categories: openstack
---

* content
{:toc}

## 구성

- Gluu Server v2.4.4
- LDAP Server
- OpenStack Keystone (Mitaka)
- OpenStack Horizon (Mitaka)


## 방법

### Step 1. Gluu 설치

https://www.gluu.org/docs/deployment/

Preparing VM 설정 후, 각 OS별 문서에 따라 설치를 진행한다.


### Step 2. Gluu 클라이언트 추가

```OpenID Connect > Clients > Add Client```에서 클라이언트를 추가한다.

- Client Name: 클라이언트의 별명 (특별히 키로 사용되지는 않음)
- Client Secret: 접근 패스워드
- Application Type: Web
- Pre-Authorization: Disabled
- Client URI: https://<Keystone External Domain/IP>:5000/v3/auth/OS-FEDERATION/websso/oidc/redirect
- Subject Type: public
- Authentication method for the Token Endpoint: client_secret_basic
- Persist Client Authorizations: True
- Logout Session Required: False

하단 버튼을 클릭하여 다음 속성들을 추가한다.

- Add Redirect Login URI: https://<Keystone External Domain/IP>:5000/v3/auth/OS-FEDERATION/websso/oidc/redirect
- Add Scope: email, openid, profile
- Add Response Type: id_token

클라이언트 추가 이후 ```iNum```을 기억해둔다.


### Step 3. Gluu의 LDAP 설정 및 유저 추가

```Configuration > Manage Authentication```에서 LDAP 서버를 등록하고, ```Users > Add person```에서 유저를 추가해준다.


### Step 4. Keystone 설정

```/etc/keystone/keystone.conf```에 다음 설정들을 추가한다.

```
[auth]
methods = external,password,token,oauth1,oidc
oidc = keystone.auth.plugins.mapped.Mapped

[oidc]
remote_id_attribute = HTTP_OIDC_ISS

[federation]
remote_id_attribute = HTTP_OIDC_ISS
trusted_dashboard = https://<Horizon External Domain/IP>/horizon/auth/websso/
sso_callback_template = /etc/keystone/sso_callback_template.html
```

OpenID 콜백시 표시할 페이지([예제](https://raw.githubusercontent.com/openstack/keystone/master/etc/sso_callback_template.html))를
```/etc/keystone/sso_callback_template.html``` 위치에 생성한다.


### Step 5. mod_auth_openidc 설치

```
# mod_auth_openidc 설치
wget http://ftp.us.debian.org/debian/pool/main/liba/libapache2-mod-auth-openidc/libapache2-mod-auth-openidc_1.6.0-1_amd64.deb
dpkg -i libapache2-mod-auth-openidc_1.6.0-1_amd64.deb

# libjansson4 설치
apt-get install libjansson4
```


### Step 6. Apache 설정

```/etc/apache2/sites-available/05-keystone_wsgi_main.conf```에 다음 설정들을 추가한다.

```
<VirtualHost <Keystone Internal IP>:5000>
    ServerName https://<Keystone External IP>:5000
    
    ...
    
    LoadModule auth_openidc_module /usr/lib/apache2/modules/mod_auth_openidc.so

    OIDCClaimPrefix "OIDC-"
    OIDCResponseType "id_token"
    OIDCScope "openid email profile"
    OIDCProviderMetadataURL https://<Gluu Domain>/.well-known/openid-configuration
    OIDCClientID "<추가한 OpenID 클라이언트의 iNum>"
    OIDCClientSecret "<클라이언트의 Secret>"
    OIDCProviderTokenEndpointAuth client_secret_basic
    OIDCCryptoPassphrase openstack
    OIDCRedirectURI https://<Keystone External Domain/IP>:5000/v3/auth/OS-FEDERATION/websso/oidc/redirect
    OIDCSSLValidateServer Off
    OIDCOAuthSSLValidateServer Off

    <Location ~ "/v3/auth/OS-FEDERATION/websso/oidc">
      AuthType openid-connect
      Require valid-user
      LogLevel debug
    </Location>
    <LocationMatch /v3/OS-FEDERATION/identity_providers/indigo-dc/protocols/oidc/auth>
      AuthType openid-connect
      Require valid-user
      LogLevel debug
    </LocationMatch>
</VirtualHost>
```

설정 후, Keystone을 재시작해준다.


### Step 7. Horizon 설정

```/etc/openstack-dashboard/local_settings.py```에 다음 설정들을 추가한다.

```
OPENSTACK_KEYSTONE_URL = "https://<Keystone External Domain/IP>:5000/v3"

WEBSSO_ENABLED = True

WEBSSO_INITIAL_CHOICE = "oidc"
WEBSSO_CHOICES = (
    ("credentials", _("Keystone Credentials")),
    ("oidc", _("OpenID Connect"))
)

WEBSSO_IDP_MAPPING = {
    "acme_oidc": ("acme", "oidc")
}
```

설정 후, Horizon을 재시작해준다.


### Step 8. Keystone과 OpenID 간의 Groups, Projects 맵핑 추가

그룹 및 프로젝트를 생성하고 롤을 할당한다.

```
openstack group create indigo_group
openstack project create indigo
openstack role add _member_ --group indigo_group --project indigo
```

다음과 같이 맵핑을 위한 JSON 파일을 생성한다.

```
[
  {
    "local": [
      {
        "group": {
          "id": "<생성한 그룹 ID>"
        },
        "user": {
          "domain": {
            "id": "default"
          },
          "type": "ephemeral",
          "name": "{0}"
        }
      }
    ],
    "remote": [
      {
        "type": "HTTP_OIDC_SUB"
      },
      {
        "type": "HTTP_OIDC_ISS",
        "any_one_of": [
          "https://<Gluu Domain>"
        ]
      }
    ]
  }
]
```

맵핑을 등록하고 프로바이더를 생성한다.

```
openstack mapping create indigo_mapping --rules indigo_mapping.json
openstack identity provider create indigo-dc --remote-id https://<Gluu Domain>
openstack federation protocol create oidc --identity-provider indigo-dc --mapping indigo_mapping
```

이 후, Horizon 접속시 OpenID로 로그인이 가능하다.


## References

- [Gluu Docs](https://gluu.org/docs/)
- [INDIGO-DataCloud IAM Configuration](https://indigo-dc.gitbooks.io/openid-keystone/content/indigo-configuration.html)
- [OX Wiki: mod_auth_oidc Installation at Ubuntu](https://ox.gluu.org/doku.php?id=mod_auth_oidc_ubuntu)
- [OpenStack Docs: Configuring Keystone for Federation](http://docs.openstack.org/developer/keystone/mitaka/configure_federation.html)
- [bretonium: How to configure Mirantis OpenStack for WebSSO via Okta](https://gist.github.com/bretonium/6134bca0756cb4f8037c)
