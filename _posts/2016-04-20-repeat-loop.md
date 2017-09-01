---
layout: post
title: "AppleScript Repeat Loop"
date: 2016-04-20
categories: applescript
---

* content
{:toc}

## repeat [number] times

- Java

```java
int sum = 0;
for (int i = 0; i < 10; i++) {
  sum++;
}
return sum;
```

- AppleScript

```applescript
set sum to 0
repeat 10 times
	set sum to sum + 1
end repeat
return sum
```


## repeat

- Java

```java
int sum = 0;
while (true) {
  sum++;
  if (sum == 10) {
    break;
  }
}
return sum;
```

- AppleScript

```applescript
set sum to 0
repeat
	set sum to sum + 1
	if sum is 10 then
		exit repeat
	end if
end repeat
return sum
```

> continue 구문은 없다.


## repeat with [var] from [start] to [end] {by [inc]}

- Java

```java
int sum = 0;
for (int i = 0; i < 10; i += 2) {
  sum += i;
}
return sum;
```

- AppleScript

```applescript
set sum to 0
repeat with i from 0 to 10 by 2
	set sum to sum + i
end repeat
return sum
```


## repeat with [var] in [list]

- Java

```java
int sum = 0;
for (int i : new int[] {1, 2, 3, 4, 5}) {
  sum += i;
}
return sum
```

- AppleScript

```applescript
set sum to 0
repeat with i in {1, 2, 3, 4, 5}
	set sum to sum + i
end repeat
return sum
```


## repeat while [cond]

- Java

```java
int sum = 0;
while (sum < 10) {
  sum++;
}
return sum
```

- AppleScript

```applescript
set sum to 0
repeat while sum < 10
	set sum to sum + 1
end repeat
return sum
```
=> 10


## repeat until [cond]

- Java

```java
int sum = 0;
while (!(sum > 10)) {
  sum++;
}
return sum
```

- AppleScript

```applescript
set sum to 0
repeat until sum > 10
	set sum to sum + 1
end repeat
return sum
```
=> 11

> do while 구문은 없다.
