---
layout: post
title: "android app basic"
date: 2018-06-18
categories: android
---

* content
{:toc}

#### Android App 개발 Basic

1. 안드로이드 개발은 기본적으로 Component개발 (CBD방법론)
  - component들이 Application의 구성요소
  - 안드로이드 시스템에서 관리하는것이 component의 라이프사이클
  - App내에서 독립적인 수행단위 main function의 개념이 없음 (어느 component든지 정의만하면 먼저 실행 가능)
  - component -> Intent (시스템에 알려줌) -> component (시스템이 Intent 통해서 다른 컴포넌트 실행)
  - component로 코드 결합이 없기때문에 다른 벤더 app실행가능. 안드로이드 개발자 입장에서 다른 app은 library로 취급됨
  - linux위에 ART위에 App들이 떠있고, ART의 lib와 인터렉션하면서 APP 동작함  


2. Resource 외부화, 극대화
  - Str, Img, Color, Size 등 조금이라도 Resource로 뺼 수 있는것 다 빼자
  - XML도 static Resource
  - layout, menu, app설정, animation 또한 Resource로 빼자

업무설계 -> 화면 설계 -> 컴포넌트 설계

* R.xml파일
  - 프로젝트내의 각종 개체에 접근할 수 있는 ID 정의
  - 자동 완성됨으로 수정하면 안됨
  - VO파일이라 볼 수 있다. int 변수만 쫙~ 설정해놓음 ex) int a = 0x...
  - 안에 inner class로 resource폴더 밑의 layout, drawable등을 정의 해 놓았음
  - 따라서 접근할 때 R.layout.main 같이 해당 리소스 접근 가능
  - 위의 규칙 때문에 Resource 폴더밑에 개발자 임의로 폴더명 지정할 수 없다. R안에 inner class에 어긋나기 때문
  - R폴더 안에 int 변수로 정의해놓았기 때문에 리소스 파일명또한 자바에서 정의한 변수 명명규칙에 어긋나지 않게 작성해야함

* Intent
 - 다른 컴포넌트를 실행시키기 위해 시스템에 띄우는 메시지, VO 클래스
 - Intent에 데이터 담고 실행되는 Activity에서 그 데이터 가지겨는 방법으로 데이터 주고 받음
 - Intent.putExtra(key, value)
 - startActivity(), startActivityForResult() -> 실행시킨 엑티비티가 끝나면 결과 받음
