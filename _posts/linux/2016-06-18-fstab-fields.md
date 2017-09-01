---
layout: post
title: "fstab 필드 설명"
date: 2016-06-18
categories: linux
---

* content
{:toc}

|1. Device Name				|2. Mount Point	|3. FS	|4. Mount Option	|5. Dump	|6. File Check	|
|---------------------------|---------------|-------|-------------------|-----------|---------------|
|UUID=5b7f4dd6-3e05-47cd	|/boot			|xfs	|defaults			|0			|0				|
|/dev/mapper/centos-root	|/				|xfs	|defaults			|0			|0				|
|/dev/mapper/centos-swap	|swap			|swap	|defaults			|0			|0				|

1. FileSystem Device Name
2. Mount Point
3. FileSystem Type
4. Mount Option
  - default	: rw, nouser, auto, exec, suid 속성을 모두 설정
  - auto	: 부팅시 자동 마운트
  - noauto	: 부팅시 자동 마운트를 하지 않음
  - exec	: 실행 파일이 실행되는 것을 허용
  - noexec	: 실행 파일이 실행되는 것을 불허
  - suid	: SetUID, SetGID 사용을 허용
  - nosuid	: SetUID, SetGID 사용을 불허
  - ro		: 읽기 전용의 파일시스템으로 설정
  - rw		: 읽기/쓰기 전용의 파일시스템으로 설정
  - user	: 일반 사용자가 마운트 가능
  - nouser	: 일반 사용자가 마운트 불가능, root만 가능
  - quota	: Quota 설정이 가능
  - noquota	: Quota 설정이 불가능
5. Dump : 덤프(백업)가 되어야 하는지 설정
  - 0		: 덤프가 불가능하게 설정
  - 1		: 덤프가 가능하게 설정
6. File Sequence Check Option : fsck에 의한 무결성 검사 우선순위
  - 0		: 무결성 검사를 하지 않음
  - 1		: 우선순위 1위를 뜻하며, 일반적으로 루트 파티션에 설정한다.
  - 2		: 우선순위 2위를 뜻하며, 1위를 검사한후 2위를 검사한다.
