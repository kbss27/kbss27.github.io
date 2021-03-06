---
layout: post
title: "effective java"
date: 2017-12-15
categories: java
---

* content
{:toc}


생성자에 들어가야 할 인자값이 너무 많을 경우, 가장 안정적인 방법은 점층적 생성자 패턴이다.
(생성자의 경우의 수에따라 점층적으로 인자늘리면서 작성)

가독성이 가장 높은것은 자바빈 패턴이다. (setter)

이 두가지 모두를 만족하는게 빌더 패턴이다.
1. 필요한 객체를 직접 생성하는 대신, 필수 인자들을 생성자에 전부 전달하여
빌더 객체를 만든다.
2. 빌더 객체에 정의된 설정 메서드들을 호출하여 선택적 인자들을 추가해 나간다.
3. 마지막으로 아무런 인자 없이 build 메서드를 호출하여 immutable 객체를 만드는 것이다.
(빌더 클래스는 빌더가 만드는 객체 클래스의 정적 멤버 클래스로 정의한다)


------------------------------------------------------------------------------------

private 생성자나 enum 자료형은 싱글턴 패턴을 따르도록 설계하라

기존의 싱글톤 생성방식은 접는것이좋다.
최신 JVM은 정적 팩터리 메소드 호출을 거의 항상 인라인 처리해버리기 때문.
(메소드 호출을 인라인처리한다는게 무슨뜻?)

원소가 하나뿐인 enum자료형을 사용하는것이 싱글턴을 구현하는 가장 좋은방법이다.
직렬화가 자동처리되고 보기 더 편하기 때문

```java
public enum Elvis {
  INSTANCE;

  public void leaveTheBuilding() {...}
}
```

------------------------------------------------------------------------------------

객체 생성을 막을 때는 private 생성자를 사용하라
진짜 객체가 아닌 정적메서드나 필드만 모아놓은 클래스에서 객체생성을 막고자할때
(기본 생성자는 클래스에 생성자가 없을 때 만들어지니까)
private 생성자를 클래스에 넣어서 객체생성을 방지하는것이 제일이다.

```java
//객체를 만들 수 없는 UtilityClass
public class UtilityClass {
  //기본 생성자가 자동 생성되지 못하도록 하여 객체 생성 방지
  private UtilityClass() {
    throw new AssertionError();
  }
}
```

------------------------------------------------------------------------------------

불필요한 객체는 만들지 말라

```java
//loop안에있다면 매번 새로운 객체 생성
String s = new String("stringette");

//loop안에있다면 동일한 String 객체가지고 계속 이용
String s = "stringette";

public class Person {
    private final Date birthDate;

    private static final Date BOOM_START_DATE;
    private static final Date BOOM_END_DATE;

    static {
        Calendar gmtCal = Calendar.getInstance(TimeZone.getTimeZone("GMT"));
        gmtCal.set(1946, Calendar.JANUARY, 1,0,0,0);
        BOOM_START_DATE = gmtCal.getTime();
        gmtCal.set(1964, Calendar.JANUARY, 1,0,0,0);
        BOOM_END_DATE = gmtCal.getTime();
    }

    public boolean isBabyBoomer() {
        return birthDate.compareTo(BOOM_START_DATE) >= 0 &&
                birthDate.compareTo(BOOM_END_DATE) < 0;
    }
}
```
개선된 Person 클래스가 초기화된 다음에 isBabyBoomer 메서드가 한번도 호출되지 않는다면, BOOM_START_DATE와 BOOM_END_DATE는 쓸데없이 초기화 되었다고 봐도 무방하다. 이런 상황은 초기화 지연 기법(isBabyBoomer)가 호출될때 초기화시키는 방법을 쓸 수 있지만, 구현도 복잡하고 성능을 개선하기도 어렵다.
```java
public static void main(String[] args) {
  Long sum = 0L;
  for (long i = 0; i < Integer.MAX_VALUE; i++) {
    sum += i;
  }
}
```
위의 코드에서 문제가되는 부분은 long을 쓰지않고 Long을 썼다는것! 2의 31승개의 쓸데없는 객체가
생성된다. '객체 표현형 대신 기본 자료형을 사용하고, 생각지도 못한 자동 객체화가 발생하지 않도록 유의하자'

------------------------------------------------------------------------------------

유효기간이 지난 객체 참조는 폐기하라
만기 참조(더이상 사용되지 않는 객체들)을 null로 만들면 나중에 실수로 그 참조를 사용하더라도 nullpointerException이 발생하기 떄문에, 프로그램은 바로 종료된다.
하지만, 남용하면 프로그램이 난잡해진다. 객체 참조를 null 처리하는 것은 규범이라기보단 예외적인 조치가 되어야 한다. 만기 참조를 제거하는 가장 좋은 방법은 해당 참조가 보관된 변수가 유효범위(scope)를 벗어나게 두는 것이다. 변수를 정의할 때 그 유효범위를 최대한 좁게 만들면 자연스럽게 해결된다.
#### 메모리 누수가 발생할 수 있는 부분들
1. 자체적으로 관리하는 메모리가 있는 클래스를 만들 때
2. 캐시(cache)도 메모리 누수가 흔히 발생하는 장소이다.
3. 메모리 누수가 흔히 발견되는 또 한 곳은 리스너 등의 callback이다.

------------------------------------------------------------------------------------

종료자 사용을 피하라

finalizer는 예측 불가능하며, 대체로 위험하고, 일반적으로 불필요하다.

* 중요 상태 정보는 종료자로 갱신하면 안된다.
* 종료자를 사용하면 프로그램 성능이 심각하게 떨어진다.
* 명시적 종료 메소드는 try finally와 같이 써라.

------------------------------------------------------------------------------------

3장 모든 객체의 공통 메서드

규칙 8 : equals를 재정의할 때는 일반 규약을 따르라

equals메소드를 재정의하지않으면 모든 객체는 자기 자신하고만 같다.

#### equals메소드를 재정의 하지 않아도 되는 경우
* 각각의 개체가 고유하다.
  - 값 대신 활성 개체를 나타내는 Thread 같은 클래스가 이 조건에 부합
* 클래스에 logical equality 검사 방법이 있건 없건 상관없다.
* 상위 클래스에서 재정의한 equals가 하위 클래스에서 사용하기에도 적당하다.
  - 대부분의 set, list, map 클래스들은 대체로 상위 Abstract클래스의 equals 메소드를 그대로 사용한다.

어렵다... 다시읽어봐야겠다...

------------------------------------------------------------------------------------

규칙 9 : equals를 재정의할 때는 반드시 hashCode도 재정의하라

좋은 해시 함수는 다른 객체에는 다른 해시 코드를 반환하는 경향이 있다.
이상적인 해시 함수는 서로 다른 객체들을 모든 가능한 해시 값에 균등하게 배분해야 한다.

------------------------------------------------------------------------------------

규칙 45 : 지역 변수의 유효범위를 최소화하라

지역 변수의 유효범위를 최소화하는 가장 강력한 기법은, 처음으로 사용하는곳에서 선언하는 것이다.
while문보다 for문을 쓰는 것이 좋은 이유 : 변수의 scope가 while문 밖에 있기 때문에
아래와 같이 실수를 해도 잡아내기 힘들 수 있다.

```java
Iterator<Element> i = c.iterator();
while(i.hasNext()) {
  doSomething(i.next());
}

Iterator<Element> i2 = c.iterator();
while(i.hasNext()) {
  doSomething(i2.next())
}
```

반면에 for 문은 아래와 같이 변수 i의 scope가 for문 안에 있기 때문에 실수를 했을 때도
바로 체크가 가능하다. 이러한 실수는 '복사해서 붙여넣기'를 할때 자주 일어난다.

```java
for(Iterator<Element> i = c.iterator(); i.hasNext();) {
  doSomething(i.next());
}
```
------------------------------------------------------------------------------------

규칙 46 : for문보다는 for-each 문을 사용하라

for-each문은 반복자나 첨자 변수를 완전히 제거해서 오류 가능성을 줄인다. 또한, 여러 컬렉션에 중첩되는 순환문을 만들어야 할 때 실수를 막아주고 더욱 코드를 간결하게 해준다.

```java
enum Face { ONE, TWO, THREE, FOUR, FIVE, SIX }
...
Collection<Face> faces = Arrays.asList(Face.values());
for(Iterator<Face> i = faces.iterator(); i.hasNext();)
  for(Iterator<Face> j = faces.iterator(); i.hasNext();)
    System.out.println(i.next() + " " + j.next());
```
위의 코드에서 나타나는 실수는 아래 for-each문을 쓴다면 발생할 수 없다.

```java
for(Face face1 : faces)
    for(Face face2 : faces)
        System.out.println(face1 + " " + face2);
```

위와 같이 실수도 발생하지 않고 코드도 간결하게 바꿀 수 있다.
for-each문은 전통적인 for문에 비해 명료하고 버그 발생 가능성도 적으며, 성능도 for문에 뒤지지 않기 떄문에, 가능하면 for-each문을 쓰는것이 좋다.  
하지만 for-each문을 적용할 수 없는 세 가지 경우가 있다.

1. 필터링 : 컬렉션 순회 중 특정 원소를 삭제해야 할 경우, reove 메소드를 호출해야 하기 때문에 반복자를 명시적으로 사용해야 함.

2. 변환 : 리스트나 배열 순환 중, 그 원소 가운데 일부 또는 전부의 값을 변경해야 한다면, 원소 값을 수정하기 위해 리스트 반복자나 배열 첨자가 필요하다.

3. 병렬 순회 : 여러 컬렉션을 병렬적으로 순회하는 경우
