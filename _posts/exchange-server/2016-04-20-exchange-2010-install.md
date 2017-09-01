---
layout: post
title: "Exchange 2010 Pre Install Script"
date: 2016-04-20
categories: exchange
---

* content
{:toc}

Exchange 2010 설치 전에 필요한 윈도우 서비스를 설치하기 위한 파워쉘 스크립트

```powershell
Import-Module ServerManager

Add-WindowsFeature NET-Framework,RSAT-ADDS,Web-Server,Web-Basic-Auth,Web-Windows-Auth,Web-Metabase,Web-Net-Ext,Web-Lgcy-Mgmt-Console,WAS-Process-Model,RSAT-Web-Server,Web-ISAPI-Ext,Web-Digest-Auth,Web-Dyn-Compression,NET-HTTP-Activation,RPC-Over-HTTP-Proxy

Set-Service NetTcpPortSharing -StartupType Automatic
```