---
layout: post
title: "계정간 공유용 디렉토리 권한 설정"
date: 2016-04-20
categories: mac-osx
---

* content
{:toc}

하나의 MAC을 가지고 회사와 집, 2군데서 모두 사용하고 있는데 집에서 사용하는 OSX 계정과 회사에서 사용하는 계정이 다르다.
분리된 환경을 원해서 2개 계정으로 사용하고 있으나 공유용으로 사용할 디렉토리가 필요하였다.
물론 공유 디렉토리에 파일을 생성하고 ```chmod 664``` 로 파일의 권한을 변경하면 되나, 매번 바꾸기가 매우 귀찮다.
그렇다고 ```umask```를 사용하기에는 너무 글로벌하다.

OSX에서 추가적으로 제공해주는 권한을 부여하면 이런 불편함을 줄일 수 있다.
다음은 ```/Volume/osx_data/shared``` 경로를 완전한 공유용 디렉토리로 사용할 수 있는 권한 설정이다.

```bash
sudo chmod -R +a "staff allow list,add_file,search,add_subdirectory,delete_child,readattr,writeattr,readextattr,writeextattr,readsecurity,file_inherit,directory_inherit" /Volume/osx_data/shared
```