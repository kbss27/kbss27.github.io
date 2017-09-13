---
layout: post
title: "git commit 취소"
date: 2017-09-13
categories: git
---

* content
{:toc}

git commit 취소

## git commit 되돌리기

주로 릴리즈를 위한 메인 branch에서 새로운 branch를 따고 거기서 신규기능을 개발한 다음 다시 코드리뷰를 거쳐 메인 branch에 merge합니다. 하지만 사정상 merge했던 부분을 다시 되돌려야 할 경우가 생깁니다.  
간단히 아래의 명령어를 써서 merge하기 전으로 돌리고 싶었지만, 제가 merge한 이후에도 다른 팀원들의 merge가 많이 이루어졌기 때문에 할 수 없었습니다.

```bash
$git merge --abort
```

그래서 제가 찾은 방법은 메인 branch에 merge한 branch의 commit을 되돌리고 commit 이전상태의 코드를 다시 메인 branch와 merge하는 것이었습니다.

```bash
$git reset HEAD~1
```
HEAD를 한 커밋 전으로 돌리는 명령어입니다.
--hard 옵션을 주면 워킹 디렉토리를 그 시점으로 완전히 되돌리게 됩니다.

```bash
$git reset --hard HEAD~1
```
사실 reset이라는 명령어 자체가 특정 상태로 다시 setting하는 의미인지라 상태를 가지고 있는 로그만 있다면 원하는 상태로 돌아갈수있습니다. git에서는 reflog로 커밋 이력들을 가지고 있기 때문에 이것을 이용하여 어느 상태든 커밋이력을 찾아 원하는 상태로 되돌릴수 있습니다.

```bash
$git reflog
b28ab1209 HEAD@{0}: reset: moving to HEAD~1
d3f9e4e19 HEAD@{1}: reset: moving to HEAD~1
7fa823424 HEAD@{2}: reset: moving to HEAD~1
f2f73eb28 HEAD@{3}: commit: new_branch

```
가장 최신 이력인 HEAD@{0}부터 보여줍니다. 만약 commit 되돌리기전 상태로 돌아가고 싶으면 HEAD@{번호}를 이용하여 다시 reset해주면 그 상태로 되돌아가게 됩니다.

```bash
$git reset --hard HEAD@{3}
```
git을 잘 모르는 상태에서 가장 걱정되는것이 잘못된 commit이나 merge로 인한 피해일텐데, reset과 reflog를 알고 있으면 여러 상황에서 유용할거라 생각합니다.
