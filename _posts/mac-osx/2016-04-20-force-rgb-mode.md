---
layout: post
title: "Force RGB Mode"
date: 2016-04-20
categories: mac-osx
---

* content
{:toc}

몇몇 DisplayPort 단자가 있는 모니터를 DP to DP 케이블로 Mac과 연결했을 때, sharpening이나 contrast가 맥북 내장 모니터보다 확연히 떨어져보이는 모니터들이 존재한다. (Dell 모니터와 LG의 21:9 모니터 등)

이는 Mac이 DP로 연결된 일부 모니터에 RGB가 아닌 YCbCr 컬러로 출력하기 때문인데, 강제로 RGB로 출력하게 해주어야 한다. 아쉽게도 손쉽게 설정할 수 있는 방법은 없고, 현재로서는 아래 방법이 유일하다.

## Step 1. Rootless 해제

시스템 디렉토리를 핸들하여야 하기 때문에 OS X 10.11 El Capitan을 사용할 경우 Rootless 기능을 해제하여야 한다.
모든 Step을 진행하고나서 다시 Rootless를 활성화하여 사용할 수 있다. - 물론 10.10 이하 사용자는 이 Step을 건너뛰어도 된다.

다음 링크를 참고하여 Rootless를 비활성화하고 다시 OSX로 정상 부팅한다. 요약하자면 부팅시 Option 키를 눌러 복구 모드로 진입한 다음, 터미널에서 ```csrutil disable``` 입력 후 다시 부팅해주면 된다.

[[Back to the Mac] OS X 10.11 엘 캐피탄에 도입된 새로운 보안체계 '루트리스(Rootless)'를 끄고 켜는 방법](http://macnews.tistory.com/3408)

## Step 2. patch-edid.rb

다음 링크에서 patch-edid.rb 파일을 다운받는다. - 페이지로 들어가서 Raw 버튼을 오른쪽 클릭하여 링크된 파일 다운로드를 하면 된다.

https://gist.github.com/adaugherity/7435890|adaugherity/patch-edid.rb

터미널을 열고 patch-edid.rb 파일의 권한을 실행 가능하게 수정하고 실행시킨다.

```bash
cd ~/Downloads
chmod u+x patch-edid.rb
./patch-edid.rb
```

## Step 3. DisplayVendorID-xxxx 복사

patch-edid.rb 수행 이후 DisplayVendorID-xxxx 라는 디렉토리가 생성된다. 마지막 xxxx는 모니터 벤더에 따라 각자 다를 수 있다.
해당 디렉토리를 ```/System/Library/Displays/Contents/Resources/Overrides/``` 디렉토리 안으로 복사한다.

기존에 동일한 이름의 디렉토리가 존재할 수 있는데, 대치 또는 병합으로 덮어쓰기한다.

## Step 4. 재부팅 및 Rootless 활성화

이 후 재부팅을 수행하면 모니터가 RGB로 출력되고 기존 YCbCr보다 선명한 화면을 만날 수 있다.
Rootless를 다시 활성화하고 싶다면 다시 복구 모드로 들어간 다음 ```csrutil enable``` 해주면 된다.

정상적으로 적용이 되었다면 환경설정 > 디스플레이에서 forced RGB mode (EDID override) 라고 표시되는 것을 볼 수 있다.