---
layout: post
title: "사파리에 확장 프로그램이 설치되지 않을 때"
date: 2016-04-20
categories: mac-osx
---

* content
{:toc}

## 문제 현상

Apple로부터 서명이 된 확장 프로그램은 설치가 잘 되는 반면, 서명받지 않은 확장 프로그램은 경고창의 확인 버튼을 눌러도 설치되지 않는다. 현재는 서명받지 않은 확장 프로그램이라도 설치가 되야한다.

## 원인

짐작이지만, 내부적으로 경고창의 '확인' 버튼이 눌러지지 않는 것 같다. 즉, 확인 버튼을 눌렀음에도 포커스가 가지 않고, 기존 포커스인 취소 버튼이 눌러지는 것 같다.

> 현재 윈도우에서 이 글을 작성하고 있어서, '확인'인지 '신뢰'인지 잘 모르겠다.

## 해결책

시스템 환경 설정 > 키보드 > 단축키 탭의 하단에 있는 전체 키보드 접근 항목을 '모든 컨트롤'로 선택한다.
경고창에서 ''Tab'' 키를 눌러 확인 버튼에 포커싱을 가게 한 다음,  ''Space'' 키를 누르면 설치가 진행된다.