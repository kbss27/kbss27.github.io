---
layout: post
title: "Fuel Task 그래프 시각화"
date: 2016-04-20
categories: openstack
---

* content
{:toc}

Fuel은 Deploy 할 때 실행되는 Task들을 yml 파일로 관리하고 있다.
yml 파일 내에는 각 Task가 어떤 명령을 실행할 지와 Task들의 순서가 정의되어 있는데, 이 파일만 봐서는 어떤 Task가 실행되는지 파악이 어렵다.
때문에 그래프용 포맷으로 변환해서 yEd 무료 그래프 툴로 볼 수 있게끔 시각화한다.

yEd 툴은 다음 링크에서 받을 수 있다. [yEd - Graph Editor](https://www.yworks.com/products/yed)


## Fuel Task 그래프 생성

Fuel-Master 노드에서 다음 명령어로 그래프 파일을 받고 로컬로 가져온다.

```bash
fuel graph --env 1 --download > deploy_all.gv
```


## .gv to .gml 포맷 변환

> MAC OS X를 사용하는 관계로 Windows나 Linux에서는 별도로 방법을 찾아야 한다.

http://www.graphviz.org 의 Download 페이지에서 인스톨 팩키지를 받고 설치한다.
터미널에서 다음 명령어를 수행하여 gml 포맷으로 변환한다.

```bash
gv2gml deploy_all.gv > deploy_all.gml
```


## .gml 내용 수정

지금 gml 파일을 yEd로 열 수는 있지만 노드 레이블이 전부 보이지 않는다. yEd에서 레이블로 사용하는 속성키가 다르기 때문이다.
gml 파일을 vi 등으로 열고 다음 단어에 대해서 전체 Replace를 수행한다.

Find 단어 | Replace 단어 | 비고
-------- | ----------- | ---
graphics [ | ] graphics [ |
name | LabelGraphics [ text | 대소문자 구분


## yEd로 그래프 모양 조정

gml 파일을 yEd로 연 다음, Ctrl + A로 모든 노드를 선택하여 아래 액션들을 수행한다.
- Tools -> Fit Node to Label 로 노드 크기를 조정한다.
- Layout -> Hierachical 로 정렬시킨다.
- Properties View의 Fill Color를 No Color로 변경한다.


다음은 본인이 테스트로 운영 중인 OpenStack 플랫폼의 Fuel 그래프 파일과 PNG로 Export한 그림이다.

- [fuel_task.graphml](/media/openstack/fuel_task.graphml)
- [fuel_task.png](/media/openstack/fuel_task.png) - 15370 × 13165 해상도, 4.2MB 크기에 주의
