---
layout: post
title: "팀뷰어 재시작 스크립트"
date: 2016-04-20
categories: mac-osx
---

* content
{:toc}

팀뷰어 서비스를 죽이면 서비스가 다시 올라오게 되면서 재시작 시킬 수 있다.

```bash
pid=`ps -ef | grep TeamViewer_Service | grep -v grep | awk '{print $2}'`
if [ "$pid" == "" ]; then
	echo "teamviewer is not running !"
	exit 1
fi

sudo kill -9 $pid
```