---
layout: post
title: "jstat"
date: 2016-04-20
categories: java
---

* content
{:toc}

Java Virtual Machine Statistics Monitoring Tool.

The jstat tool displays performance statistics for an instrumented HotSpot Java virtual machine (JVM). The target JVM is identified by its virtual machine identifier, or vmid option described below.


## Synopsis

```bash
jstat [ generalOption | outputOptions vmid [interval[s|ms] [count]] ]
```


## Parameters

```generalOption```
A single general command-line option (-help or -options)

```outputOptions```
One or more output options, consisting of a single statOption, plus any of the -t, -h, and -J options.

```vmid```
Virtual machine identifier, a string indicating the target Java virtual machine (JVM).

```interval[s|ms]```
Sampling interval in the specified units, seconds (s) or milliseconds (ms). Default units are milliseconds. Must be a positive integer. If specified, jstat will produce its output at each interval.

```count```
Number of samples to display. Default value is infinity; that is, jstat displays statistics until the target JVM terminates or the jstat command is terminated. Must be a positive integer.


==== OUTPUT OPTIONS ====

```-statOption```
Determines the statistics information that jstat displays. The following table lists the available options. Use the -options general option to display the list of options for a particular platform installation.

- ```class```	Statistics on the behavior of the class loader.
- ```compiler```	Statistics of the behavior of the HotSpot Just-in-Time compiler.
- ```gc```	Statistics of the behavior of the garbage collected heap.
- ```gccapacity```	Statistics of the capacities of the generations and their corresponding spaces.
- ```gccause```	Summary of garbage collection statistics (same as -gcutil), with the cause of the last and current (if applicable) garbage collection events.
- ```gcnew```	Statistics of the behavior of the new generation.
- ```gcnewcapacity```	Statistics of the sizes of the new generations and its corresponding spaces.
- ```gcold```	Statistics of the behavior of the old and permanent generations.
- ```gcoldcapacity```	Statistics of the sizes of the old generation.
- ```gcpermcapacity```	Statistics of the sizes of the permanent generation.
- ```gcutil```	Summary of garbage collection statistics.
- ```printcompilation```	HotSpot compilation method statistics.


## References

[Oracle Java SE Documentation - jstat](http://docs.oracle.com/javase/7/docs/technotes/tools/share/jstat.html)