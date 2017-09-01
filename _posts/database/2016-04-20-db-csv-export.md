---
layout: post
title: "각 DB의 특정 테이블을 CSV로 Export하는 방법"
date: 2016-04-20
categories: database
---

* content
{:toc}

## MySQL

```sql
SELECT *
INTO OUTFILE '내보낼 CSV 경로'
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
FROM 테이블명;
```

## PostgreSQL

```sql
COPY (SELECT * FROM 테이블명) TO '내보낼 CSV 경로' WITH CSV;
```