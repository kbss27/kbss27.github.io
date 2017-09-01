---
layout: post
title: "Apache MINA"
date: 2016-04-20
categories: java
---

* content
{:toc}

![Apache-MINA-logo.png](http://upload.wikimedia.org/wikipedia/commons/3/34/Apache-MINA-logo.png)

## Overview

Apache MINA is a network application framework which helps users develop high performance and high scalability network applications easily.
It provides an abstract ·event-driven · asynchronous API over various transports such as TCP/IP and UDP/IP via Java NIO.

Apache MINA is often called:

- NIO framework · library,
- client · server framework · library, or
- a networking · socket library.

However, it's much more than that. Please take a look around the list of the features that enable rapid network application development, and what people says about MINA.

Please grab yourself a [download](https://mina.apache.org/mina-project/downloads.html), try our [Quick Start Guide](https://mina.apache.org/mina-project/quick-start-guide.html),
surf our [FAQ](https://mina.apache.org/mina-project/faq.html) or start join us on [our community](https://mina.apache.org/contact.html)

Notice: Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements. See the NOTICE file distributed with this work for additional information regarding copyright ownership. The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at . http://www.apache.org/licenses/LICENSE-2.0 . Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.


## Architecture

It's the question most asked : 'How does a MINA based application look like'? In this article lets see what's the architecture of MINA based application. Have tried to gather the information from presentations based on MINA.

A Bird's Eye View :
![apparch_small.png](https://mina.apache.org/staticresources/images/mina/apparch_small.png)

Here, we can see that MINA is the glue between your application (be it a client or a server) and the underlying network layer, which can be based on TCP, UDP, in-VM comunication or even a RS-232C serial protocol for a client.

You just have to design your application on top of MINA without having to handle all the complexity of the newtork layer.

Lets take a deeper dive into the details now. The following image shows a bit more the internal of MINA, and what are each of the MINA components doing :

![mina_app_arch.png](https://mina.apache.org/staticresources/images/mina/mina_app_arch.png)

(The image is from Emmanuel Lécharny presentation MINA in real life (ApacheCon EU 2009))

Broadly, MINA based applications are divided into 3 layers

- I/O Service - Performs actual I/O
- I/O Filter Chain - Filters/Transforms bytes into desired Data Structures and vice-versa
- I/O Handler - Here resides the actual business logic

So, in order to create a MINA based Application, you have to :

- Create an I/O service - Choose from already available Services (*Acceptor) or create your own
- Create a Filter Chain - Choose from already existing Filters or create a custom Filter for transforming request/response
- Create an I/O Handler - Write business logic, on handling different messages

This is pretty much it.


## References

- [Apache MINA Project](https://mina.apache.org)
- [Apache MINA Quick Start Guide](https://mina.apache.org/mina-project/quick-start-guide.html)
- [Apache MINA 2.0 User Guide](https://mina.apache.org/mina-project/userguide/user-guide-toc.html)