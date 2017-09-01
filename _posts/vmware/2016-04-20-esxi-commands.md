---
layout: post
title: "ESXi 명령어 모음"
date: 2016-04-20
categories: vmware
---

* content
{:toc}

### VM 리스트 출력

```bash
vim-cmd vmsvc/getallvms

# 간단하게 Vmid:Name 형식으로 출력
vim-cmd vmsvc/getallvms | sed '1d' | awk '{if ($1 > 0) print $1":"$2}'
```


### 업데이트

업데이트 .zip 파일을 적당한 데이터스토어에 업로드한 뒤, 다음 명령어를 실행하고 재시작한다.

```bash
esxcli software vib update --depot ${업데이트 파일의 절대 경로}
```
