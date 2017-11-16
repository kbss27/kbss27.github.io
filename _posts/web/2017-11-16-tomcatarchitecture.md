---
layout: post
title: "tomcat architecture"
date: 2017-11-16
categories: web
---

* content
{:toc}

*tomcat의 구조를 아는 것은 매우 중요하다. Spring Boot를 자주 사용하면서, Embedded tomcat을 사용하는 경우가 많아졌다. 이러한 경우에 어떠한 이슈가 발생했을때, tomcat의 구조를 모르고 있다면, 그 이슈를 해결하기 위해 많은 리소스를 할애할 수도 있다. 따라서, 이번 기회를 통해 tomcat 구조를 다시 정리해보겠다.*

---


### Tomcat Directory

![_config.yml](/media/web/tomcatArchitecture.PNG)

위와 같은 톰캣 디렉토리 구조에서 중점적으로 봐야 할 부분은 bin, conf, lib, webapps 정도가 되겠다.
간단하게 bin같은 경우는 tomcat을 시작하거나 중단할때 많이 사용하고, webapps는 배포 디렉토리로 war파일을 만들어서 안에 넣으면 하나의 context로서
배포 된다. conf폴더 안에는 server.xml 설정 파일이 있는데, 톰캣의 아키텍쳐 그대로 구분되어있다.

### Tomcat Architecture

![_config.yml](/media/web/tomcatarchitecture2.png)

server는 톰캣 자체로 볼 수 있다. 하나의 JVM에는 톰캣 instance가 하나만 존재할 수 있다. server안에는 여러개의 service가 있을 수 있는데, service의 주요 역할은 connector를 정의하여 engine에 연결시켜주는 것이다. 각 service는 하나의 엔진만을 가지고 있으므로 service와 engine은 같은 의미로 봐도 무방하다. connector에 정의된 곳으로 client의 request가 오면 host를 찾아 context로 해당 request를 보내주게 된다. host는 사용자가 여러개를 정의해도 되며, default가 localhost로 되어있다.  
conf폴더 안에 server.xml을 보면 위의 아키텍쳐가 그대로 정의되어 있다.

server.xml
```xml
<server port="8050" shutdown="SHUTDOWN">
  <service name="Catalina">
    <connector port = "8000" protocol="HTTP/1.1" connectionTimeout="20000" redirectPort = "8443"
      useBodyEncodingForURI="true" URIEncoding="UTF-8" compression="on" compressionMimeType="text/html,text/css,application/javascript,application/json"/>

    <engine name="Catalina" defaultHost="localhost">
      <host name="localhost" appBase="webapps" unpackWARs="true" autoDeploy="true">
        <context></context>
      </host>
    </engine>
  </service>
</server>
```

8050 port로 SHUTDOWN 문자열을 받겠다는 설정이다.
bin폴더안의 shutdown.sh를 사용해서 tomcat을 내리는 것과 같은 의미로, tomcat을 내리는것을 8050번 port를 통해 하겠다는 설정이다.

```xml
<server port="8050" shutdown="SHUTDOWN">
</server>
```

Catalina service는 8000번 port의 connector를 가지고 있다는 설정이다.
connector를 보면 port는 8000번 프로토콜은 HTTP/1.1이고 연결이 타임아웃 나는 시간이 20초로 설정되어있다. 그리고 SSL요청으로 들어오는 경우,
8443으로 redirect하게 되어 있다. 예제에서는 8443 connector를 정의하지 않았지만 https의 SSL요청을 처리할 connector도 정의해줘야 한다.
useBodyEncodingForURI을 true로 설정하면 뒤의 URIEncoding이 설정한 UTF-8로 인코딩을 하게 된다. 또한, 페이지의 로딩을 빠르게 하기 위한 방법으로 gzip압축을 사용하기 위해 compression을 on으로 설정하였고 해당 compressionMimeType을 정의하였다.  
engine의 defaulthost는 localhost로 되어있다. 만약 host명이 일치하지 않는 URI가 들어오면 기본적으로 이 defaulthost로 host 연결이 된다.

```xml
<service name="Catalina">
  <connector port = "8000" protocol="HTTP/1.1" connectionTimeout="20000" redirectPort = "8443"
      useBodyEncodingForURI="true" URIEncoding="UTF-8" compression="on" compressionMimeType="text/html,text/css,application/javascript,application/json"/>

  <engine name="Catalina" defaultHost="localhost">
  </engine>
</service>
```

localhost name을 가진 host의 appBase는 webapps이다. 위의 Directory 구조에서 보았던 webapps를 appBase로 하고 있기 때문에 connector를 통해 들어온 request는 webapps안의 context로 갈 수 있다. unpackWARs 설정과 autoDeploy설정을 true로 해주었기 때문에 war파일자체를 webapps 폴더 안에 넣어주면 자동으로 압축이 풀리고 배포가된다.  
**처음 tomcat을 설치하면 webapps에 docs, examples, host-manager, manager, ROOT가 있다. 각각이 context라 볼수 있는데 해당 context의 설정은 각 context안에 web.xml에 정의되어있다.**
```xml
<host name="localhost" appBase="webapps" unpackWARs="true" autoDeploy="true">
  <context></context>
</host>
```
