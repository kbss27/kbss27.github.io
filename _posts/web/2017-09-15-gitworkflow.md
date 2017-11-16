---
layout: post
title: "git workflow"
date: 2017-09-15
categories: web
---

* content
{:toc}

*자바 웹 개발을 하면서 항상 느꼈던 점은 기본이 부족하다는 것이었다. 어찌어찌해서 spring framework를 사용하긴 해도 동작 방식이나 왜 이 기술이 나오게 되었는지, 이 기술을 썼을때 어떠한 이점이 있는지 등을 알고 싶었다. 그래서 이번 기회를 통해 기본을 제대로 다지기로 마음먹었다!*

---


### 1일차 내용

- 클라우드 분산환경에서 스프링부트가 강점이 있다.
- AOP개념 쉽지 않다. 하지만 AOP를 써야하는 케이스(로깅, 트랜잭션 등)가 한정적이다.
- interface, inheritance는 제대로 알아야 한다.
  - interface는 테스트에 중요(전략패턴방식)

### 2일차 내용

- 스냅샷 버전은 개발중인 버전, 따라서 쓸 수는 있지만 안정화되어 있지는 않다.
- 나타나는 에러 중 `cannot be resolved`는 `undefined`와 같은 말이다.
- 에러 메시지 아래의 톰캣 버전도 같이 써주면 더욱 확실한 답을 얻을 수 있다.

기본 설정되어 있는 톰캣이 6점대라 에러가 나서 7을 명시해서 써주고 돌려준다.
~~~bash
mvn tomcat:run
mvn tomcat7:run
~~~

~~~bash
mvn archetype:generate \
-DgroupId=com.okdevtv.java \
-DartifactId=okdevtv \
-DarchetypeArtifactId=maven-archetype-quickstart \
-DinteractiveMode=false \

 find ./ -type d
 find ./ -type f
~~~

- D로 시작하는 대문자는 key value로 해서 이것을 파라미터로 넘겨준다는 의미
- 텍스트 에디터는 파일 집중해서 보고, IDE는 프로젝트 단위로 집중해서 본다.
- IDE에서 refactor기능은 코드를 간결하게 하는 기능 extract variable, extract method등등 쓰면 좋음

#### git

같은 디렉토리안에있지만 등재된 파일인지 아닌지 stage로 구분된다.
Git add를 하면 staging된다. 이게 등재된거다. 여기서 커밋하면 로컬 리파지토리에 들어간다.

Fetch : working copy까지 바꾸지 않고 local repository까지 하는데 fetch.  
pull은 fetch + merge.
pull하면 워킹디렉토리까지 다 바뀐다.

![_config.yml](/media/study/basic-remote-workflow.png)

~~~bash
git init
git config —global user.email ~~
git config —global user.name ~~
git commit -m “~~”
git log
git remote add origin 'remote repository주소'
~~~

Git remote 쓰면 origin이 remote에 추가되어 있는지 알수있고, git remote -v하면 origin이 어떤주소를 가지고 있는지 알 수 있다.
Git push origin master 오리진에 마스터 브랜치를 올려라. `-f`옵션은 쓰지마라. 로컬 리파지토리에 있는것을 강제로 리모트로 올리는 옵션이다. (어쩔수 없는 경우에만 써라)

#### AWS

ec2 instance 만들고 ssh로 접속!   
key를 가지고 있어야 한다.
~~~bash
ssh -i ./hyunwoo.pem ec2-user@xx.xxx.xxx.xx
wget http://apache.mirror.cdnetworks.com/tomcat/tomcat-7/v7.0.81/bin/apache-tomcat-7.0.81.tar.gz
~~~

tar로 압축풀고 아파치폴더에서 startup.sh로 실행

~~~bash
Curl localhost:8080
Sudo yum install git
~~~

git폴더 만들고 거기 안에 git clone https://github.com/~/~ 소스 받는다. 그리고 mvn설치하고 돌려보자

~~~bash
sudo wget http://repos.fedorapeople.org/repos/dchen/apache-maven/epel-apache-maven.repo -O /etc/yum.repos.d/epel-apache-maven.repo
sudo sed -i s/\$releasever/6/g /etc/yum.repos.d/epel-apache-maven.repo
sudo yum install -y apache-maven
mvn --version
~~~
maven이 설치되었으니, mvn package로 빌드하고 아파치 폴더밑에 webapp에 war파일 넣고 돌리자.  aws ec2에서 inbound설정에서 방화벽을 열어줘야 접속가능하다.
