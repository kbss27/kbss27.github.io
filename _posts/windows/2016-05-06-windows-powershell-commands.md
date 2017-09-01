---
layout: post
title: "윈도우 파워쉘 명령어 모음"
date: 2016-05-06
categories: windows
---

* content
{:toc}

### Alias 설정

```powershell
Set-Alias ll ls
```


### 파일 합치기

```powershell
cat file1.txt, file2.txt > new.txt
```


### 백그라운드 잡

- 실행

```powershell
Start-Job -ScriptBlock {스크립트} -Name 잡이름
```

- 목록

```powershell
Get-Job
```

- 상태

```powershell
Receive-Job -Id 아이디 -Keep
Receive-Job -Name 잡이름 -Keep
```

- 정지

```powershell
Stop-Job-Id 아이디
Stop-Job-Name 잡이름
```


### 히스토리

- 목록

```powershell
Get-History
```

- 내보내기

```powershell
Get-History | Export-Clixml history.xml
```

- 가져오기

```powershell
Import-Clixml history.xml | Add-History
```


### Grep

```powershell
cat crawler.log | Select-String "send success"
```