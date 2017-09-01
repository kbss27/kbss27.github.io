---
layout: post
title: "네트워크 자동 마운트 애플스크립트"
date: 2016-04-20
categories: mac-osx
---

* content
{:toc}

```applescript
delay 5

set localIp to IPv4 address of (get system info)
set isInPrivateNetwork to localIp starts with "192.168.11"

if isInPrivateNetwork = false then
	display dialog "내부 네트워크에 연결되어있지 않음"
	return
end if

tell application "Finder"
	try
		delay 5
		mount volume "afp://inter6-xpen.local/nas_data"
		delay 5
		mount volume "afp://inter6-xpen.local/nas_temp"
	end try
end tell
```