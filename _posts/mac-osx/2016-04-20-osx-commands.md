---
layout: post
title: "MAC OS X 명령어 모음"
date: 2016-04-20
categories: mac-osx
---

* content
{:toc}

### SMB 브로드캐스트 비활성화

```bash
sudo defaults write /System/Library/LaunchDaemons/com.apple.mDNSResponder ProgramArguments -array-add "-NoMulticastAdvertisements"
sudo launchctl unload -w /System/Library/LaunchDaemons/com.apple.mDNSResponder.plist
sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.mDNSResponder.plist
```

### 특정 파일을 파인더에서 안 보이게 속성 수정

```bash
chflags -s hidden 파일경로
```

### 확장자에 대한 연결 프로그램 DB 재작성

DB 손상으로 인해 파인더에서 '다음으로 열기'가 작동하지 않을 때 수행

```bash
/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -kill -seed -r -f -v -domain local -domain user -domain system
```

### 블루투스 음질 향상

```bash
defaults write com.apple.BluetoothAudioAgent "Apple Bitpool Min (editable)" 58
```
