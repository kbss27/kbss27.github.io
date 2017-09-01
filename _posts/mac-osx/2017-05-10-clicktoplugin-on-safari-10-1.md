---
layout: post
title: "ClickToPlugin on Safari 10.1"
date: 2017-05-10
categories: mac-osx
---

## Introduction

Safari Extension 중 [ClickToPlugin](http://hoyois.github.io/safariextensions/clicktoplugin/)은 YouTube 등 동영상을 Flash가 아닌 HTML5로 재생하여 준다.
YouTube를 HTML5로 재생할 경우 선/중간 광고 영상이 없다는 것이 가장 큰 장점이다.
그 외 영상의 다운로드 또한 가능하다.

그러나 ClickToPlugin은 3.2 버전을 마지막으로 릴리즈가 중단되었다.
YouTube 등 사이트들의 업데이트에 맞춰 ClickToPlugin 또한 업데이트가 이루어져야 하는데,
그러지를 못하여 현재는 제대로 작동하지 않는다.

그러나 플러그인에 내장된 Flash --> HTML5로 변경해주는 스크립트는 지속적으로 GitHub에 업데이트 되고 있다.

> [hoyois/plugin-to-html5 : Plug-in to HTML5 conversion scripts](https://github.com/hoyois/plugin-to-html5)

위 Repository의 최신 스크립트를 플러그인에 적용하면 제대로 잘 작동한다.


## How to

Step 1) ClickToPlugin을 설치하고 터미널에서 아래 경로로 들어간다.

```
cd /Users/<Your Username>/Library/Caches/com.apple.Safari/Extensions/ClickToPlugin.safariextension
```


Step 2) ```hoyois/plugin-to-html5``` Repository를 git으로 clone 한다.

```
git clone https://github.com/hoyois/plugin-to-html5.git
```

최종적으로 ```/Users/<Your Username>/Library/Caches/com.apple.Safari/Extensions/ClickToPlugin.safariextension/plugin-to-html5/``` 디렉토리 내에
```YouTube.js``` 등의 파일이 위치해야 한다.


Step 3) ClickToPlugin 설정에서 ```General > Plugin-in to HTML5 conversion scripts```를 다음과 같이 수정한다.

```
plugin-to-html5/YouTube.js
plugin-to-html5/CSSfix.js
plugin-to-html5/Generic.js
```

![clicktoplugin_update_script_1.png](/media/mac-osx/clicktoplugin_update_script_1.png)

물론 원한다면 ```plugin-to-html5/YouTube.js``` 아래에 다른 사이트들의 스크립트도 추가해주면 된다.


Step 4) ```Media player > Default media player``` 옵션을 ```HTML5```로 설정하는 것도 잊지 말자.


이 후, YouTube에서 Flash가 아닌 HTML5로 재생하는 것을 볼 수 있다.

![clicktoplugin_update_script_2.png](/media/mac-osx/clicktoplugin_update_script_2.png)
