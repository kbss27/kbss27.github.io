---
layout: post
title: "심볼릭 링크"
date: 2016-05-06
categories: windows
---

* content
{:toc}

## 파일에 대한 심볼릭 링크 만들기

```
# Example) foo -> c:\Windows\system32\notepad.exe
mklink foo c:\Windows\system32\notepad.exe
```


## 디렉토리에 대한 심볼릭 링크 만들기

```
# Example) bar -> c:\windows
mklink /d bar c:\windows
```


## 파일 심볼릭 링크 지우기

```
del foo
```


## 디렉토리 심볼릭 링크 지우기

```
rmdir bar
```
