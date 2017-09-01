---
layout: post
title: "화면에서 가린 앱의 독 아이콘을 반투명하게 표시하기"
date: 2016-04-20
categories: mac-osx
---

* content
{:toc}

## 적용

```bash
defaults write com.apple.Dock showhidden -bool YES && killall Dock
```

## 복구

```bash
defaults delete com.apple.Dock showhidden -bool YES && killall Dock
```