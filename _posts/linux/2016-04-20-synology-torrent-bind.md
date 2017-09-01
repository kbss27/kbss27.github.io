---
layout: post
title: "Synology 토렌트 작업 디렉토리 마운트"
date: 2016-04-20
categories: linux
---

* content
{:toc}

토렌트를 아직 다 받지 못하더라도, 몇몇 완료된 파일을 보고 싶을 때가 있다.
Synology는 완전히 완료된 파일만을 공유 폴더에 보여준다. 그러나 보여지지만 않을 뿐 다운로드가 진행 중인 토렌트도 작업 디렉토리가 존재하므로, 해당 디렉토리를 다른 디렉토리로 bind 마운트하는 방식으로 내용을 확인할 수 있다.

다음 예제는 Download Station의 임시 위치를 /volume2 에 지정한 것이며, /volume2/nas_temp/torrent_work 디렉토리로 bind 마운트한다.

```bash
mount -o bind /volume2/@download /volume2/nas_temp/torrent_work
```

torrent_work 디렉토리 밑으로 다운로드가 진행 중인 작업 디렉토리를 확인할 수 있다.