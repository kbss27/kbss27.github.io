---
layout: post
title: "AppleScript Lexical Conventions"
date: 2016-04-20
categories: applescript
---

* content
{:toc}

## Character Set

OS X 10.5(애플스크립트 2.0)부터 Unicode를 사용한다.


## Identifiers

클래스 이름이나 변수, 속성 등을 정의할 때 사용되는 Identifier는 다음과 같은 특징을 가진다.

- 영문 대소문자와 숫자 그리고 _ 만을 사용할 수 있다.
- 숫자로 시작할 수는 없다.
- 대소문자를 구분하지 않는다. 즉, myvariable와 MyVariable는 같은 놈이다.


## Keywords

애플스크립트의 예약어는 모두 소문자와 스페이스의 조합이다. 그마저도 스페이스가 있는 놈은 aside from이 유일하다.
물론 예약어는 Identifier가 될 수 없다.

- about
- above
- after
- against
- and
- apart from
- around
- as
- aside from
- at
- back
- before
- beginning
- behind
- below
- beneath
- beside
- between
- but
- by
- considering
- contain
- contains
- contains
- continue
- copy
- div
- does
- eighth
- else
- end
- equal
- equals
- error
- every
- exit
- false
- fifth
- first
- for
- fourth
- from
- front
- get
- given
- global
- if
- ignoring
- in
- instead of
- into
- is
- it
- its
- last
- local
- me
- middle
- mod
- my
- ninth
- not
- of
- on
- onto
- or
- out of
- over
- prop
- property
- put
- ref
- reference
- repeat
- return
- returning
- script
- second
- set
- seventh
- since
- sixth
- some
- tell
- tenth
- that
- the
- then
- third
- through
- thru
- timeout
- times
- to
- transaction
- true
- try
- until
- where
- while
- whose
- with
- without


## Comments

```applescript
-- 한 라인 코멘트
# 2.0부터 지원되는 한 라인 코멘트
(*
블럭 코멘트
*)
```


## The Continuation Character

한 라인을 여러 라인으로 쓰고 싶다면 ¬ (Option + L)을 사용하면 된다.

```applescript
display dialog "This is just a test." buttons {"Great", "OK"} ¬
default button "OK" giving up after 3
```


## Literals and Constants

애플스크립트는 6가지의 리터럴과 상수 타입을 제공한다.

### Boolean

true 또는 false로 표현하며 boolean 클래스로 취급할 수 있다,

### Constant

Global Constants in AppleScript 참고

### List

```applescript
{1, 7, "Beethoven", 4.5}
```

과 같이 표현하며 list 클래스로 취급할 수 있다.

### Number

```applescript
-94596
3.1415
9.9999999999E+10
```

real, integer, number 클래스로 취급할 수 있다.

### Record

```applescript
{product:"pen", price:2.34}
```

Key:Value를 갖는 레코드들의 집합이다.

### Text

```applescript
"A basic string."
```

애플스크립트의 문자열은 ""를 사용하며 text 클래스로 취급할 수 있다.