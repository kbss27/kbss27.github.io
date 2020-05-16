---
layout: post
title: "rabbitmq tutorial"
date: 2020-05-11
categories: middleware
---

* content
{:toc}

RabbitMq 공식 Doc에 있는 Tutorial을 진행해보자.

## RabbitMq Tutorial

Local에 rabbitmq를 설치하고 Tutorial을 진행해보겠다.  
Consumer와 Producer 모듈을 만들고 각각의 Task를 통해 기본적인 publishing, consuming부터 exchange type에 따른 차이점까지 살펴볼 예정이다.  
SpringBoot 환경으로 진행을 하였고, producer, consumer 모듈의 각 task는 argument로 구분하였다.  
여기서는 Local에 설치된 rabbitmq에 연결하기위해 host를 localhost로 하였지만, 실제 운영에서는 rabbitmq가 설치되어있는 주소를 적어주면 된다.
```java
@Component
public class ArgumentEvent implements ApplicationRunner {

    @Override
    public void run(ApplicationArguments args) {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        TaskExecutable.selectTask(args, factory);
    }
}
```  

### 1. Hello World

![_config.yml](/media/middleware/rabbitmq/rabbitmq_hello_world.png){: .center}  
제일 처음으로 위와 같이 간단하게 message를 전송하고 받아보겠다.  

**Producer**
```java
public class TaskOne implements TaskExecutable {

    private final static String QUEUE_NAME = "hello";

    public void executeTask(List<String> args, ConnectionFactory factory) throws IOException, TimeoutException {
        //Connection, Channel 생성
        //채널에는 사용할 수 있는 대부분의 API들이 있다.
        try(Connection connection = factory.newConnection();
            Channel channel = connection.createChannel()) {
            channel.queueDeclare(QUEUE_NAME, false, false, false, null);
            String message = String.join(" ", args);
            channel.basicPublish("", QUEUE_NAME, null, message.getBytes());
            System.out.println(" [x] Sent'" + message + "'");
        }
    }
}
```
connection은 소켓 연결을 추상화하고 프로토콜 버전 협상, 인증등을 관리한다. ConnectionFactory를 통해 Connection을 생성하고, 생성한 Connection에서 channel을 생성한다. 모든 통신은 channel을 통해서 하게된다. channel은 하나의 물리적인 connection 내에 생성되는 가상 connection들인데, Process나 Thread마다 channel을 생성하여 queue에 연결할 수 있다.  

channel을 통해 message를 보내고자하는 queue를 선언해야 한다. 여기서는 hello라는 queue를 선언하고 message를 보내겠다.  
queueDeclare를 통해 queue를 선언하게 되면 멱등성(idempotent)이 적용되어서, queue가 존재하지 않을 경우에만 queue가 생성된다. 이 말은 producer든 consumer든 누군가 queue를 먼저 생성하면, 그 뒤에 declare해도 먼저 생성된 queue가 사용된다는 것이다.
  
**Consumer**
```java
public class TaskOne implements TaskExecutor {

    private final static String QUEUE_NAME = "hello";

    public void executeTask(List<String> args, ConnectionFactory factory) throws IOException, TimeoutException {

        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        channel.queueDeclare(QUEUE_NAME, false, false, false, null);
        System.out.println(" [*] Waiting for messages. To exit press CTRL+C");

        Consumer consumer = new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                String message = new String(body, "UTF-8");
                System.out.println(" [x] Received'" + message + "'");
            }
        };
        channel.basicConsume(QUEUE_NAME, true, consumer);
    }
}
```
consumer 또한 producer와 마찬가지로 connection을 통해 channel을 생성하고 queue를 선언한다. producer 생성 이전에 consumer가 생성될 수도 있기 때문에 queueDeclare를 해준다. 앞에서 말했듯이, producer가 먼저 queue를 생성했으면, 해당 queue를 그냥 쓰게된다.  
Consumer는 producer와는 다르게 메시지를 listening하고 있어야 한다. rabbitmq 서버는 비동기적으로 메시지를 전달하므로, 콜백 함수를 제공하는 DefaultConsumer를 생성하여 chaneel.basicConsume을 통해 등록하자. 이제 위의 Producer에서 hello queue로 메시지를 발행하면, consumer가 메시지를 소비할 것이다.

### 2. Work Queues

![_config.yml](/media/middleware/rabbitmq/rabbitmq_work_queue.png){: .center}  
이번에는 하나의 queue를 여러 consumer가 consuming하는 상황에 대해 살펴보겠다.  
여기서는 hello queue하나를 두 개의 consumer가 consuming 하는 상황을 연출해보았다.

***Queue에 있는 message가 처리하는데 오래 걸리는 경우***  
Message 중에 처리작업이 오래걸리는 message가 있을 수 있다. 실제로 처리하는데 오래걸리는 작업처럼 보이기 위해 Consumer에서 . 하나당 1초씩 Thread sleep을 걸어보겠다.

**Producer**
```java
public class TaskTwo implements TaskExecutable {

    private final static String QUEUE_NAME = "hello";

    public void executeTask(List<String> args, ConnectionFactory factory) throws IOException, TimeoutException {

        String message = String.join(" ", args);

        try (Connection connection = factory.newConnection();
            Channel channel = connection.createChannel()) {
            channel.queueDeclare(QUEUE_NAME, false, false, false, null);
            channel.basicPublish("", QUEUE_NAME, null, message.getBytes());
            System.out.println(" [x] Sent'" + message + "'");
        }
    }
}
```

5초, 3초, 2초의 처리시간이 걸리는 메시지들을 queue로 보낸다.
```bash
java -jar producer-0.0.1-SNAPSHOT.jar --task=tasktwo --content=first.....
 [x] Sent'hello.....'

java -jar producer-0.0.1-SNAPSHOT.jar --task=tasktwo --content=second...
 [x] Sent'hello...'

java -jar producer-0.0.1-SNAPSHOT.jar --task=tasktwo --content=third..
 [x] Sent'hello..'
```
**Consumer**
```java
public class TaskTwo implements TaskExecutable {

    private final static String QUEUE_NAME = "hello";

    public void executeTask(List<String> args, ConnectionFactory factory) throws IOException, TimeoutException {
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        channel.queueDeclare(QUEUE_NAME, false, false, false, null);
        System.out.println(" [*] Waiting for messages. To exit press CTRL+C");

        Consumer consumer = new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                String message = new String(body, "UTF-8");
                System.out.println(" [x] Received'" + message + "'" );

                try {
                    doWork(message);
                } finally {
                    System.out.println(" [x] Done");
                }
            }
        };
        boolean autoAck = true;
        channel.basicConsume(QUEUE_NAME, autoAck, consumer);
    }

    private void doWork(String message) {
        for (char ch : message.toCharArray()) {
            try {
                if (ch == '.') Thread.sleep(1000);
            } catch (InterruptedException _ignored) {
                Thread.currentThread().interrupt();
            }
        }
    }
}
```
***consumer 1***

```bash
 [*] Waiting for messages. To exit press CTRL+C
 [x] Received'first.....'
 [x] Done
 [x] Received'third..'
 [x] Done
```

***consumer 2***

```bash
 [*] Waiting for messages. To exit press CTRL+C
 [x] Received'second...'
 [x] Done
```

앞서 Producer가 보낸 메시지들을 consumer1, consumer2가 차례대로 받아서 처리하고 있다.  

**Round Robin Dispatching**

위의 방식은 비효율적인것처럼 보인다. consumer1이 first..... message를 5초동안 처리할때 consumer2는 second... 메시지를 3초동안 처리하고 놀고 있는 상태이다. 여기서 third.. 메시지는 놀고 있는 consumer2로 할당되는것이 아니라 consumer1이 작업을 마칠때까지 기다린 다음, consumer1로 할당된다.  
이와 같은 현상이 발생하는 이유는 기본적으로 rabbitmq는 consumer들에게 round robing방식으로 message를 보내기 때문이다. rabbitmq는 큐에 메시지가 들어오는 순간 해당 message를 consumer에게 할당한다. 따라서, 같은 큐를 consuming하고 있는 consumer들은 평균적으로 같은 수의 메시지들을 받는다.

**Fair dispatch**

위에서 말한 비효율적인 문제점을 해결하기 위해, basicQos method를 사용할 수 있다. 
```java
int preFetchCount = 1;
channel.basicQos(preFetchCount);
```
이렇게 basicQos에 prefetchcount를 1로 세팅해주면, rabbitmq는 하나의 consumer에게 한번에 여러개의 message를 할당할 수 없다. 하나의 consumer에게 prefetchCount 수 만큼의 message만 할당되고, 새로운 message는 이전 message가 처리되어서 ack을 보냈을때, comsumer에게 할당된다.

**Acknowledgement**  

기본적으로 rabbitmq는 consumer에게 message를 보내고 메모리에서 해당 message를 바로 삭제한다. 만약, consumer가 message를 처리하다가 죽게된다면, 해당 message는 소실될 수 밖에 없다. 이것을 방지하기 위해 consumer가 작업을 마치고 ack을 보내게 되면 그때서야 메모리에서 메시지를 삭제하게 할 수 있다.  
consumer가 ack 전송 없이 죽는다면 (channel이 닫히거나, connection이 닫히거나, TCP connection이 종료된다면), rabbitmq는 그 메세지가 완전하게 처리되지 않았다고 판단하여 해당 메세지를 다시 큐잉한다. 다시 큐잉한 그 시점에 다른 consumer가 존재한다면, 재큐잉된 메세지는 존재하는 다른 consumer에게 전달된다. rabbitmq는 메세지 타임아웃으로 consumer가 죽었는지 판단하지 않는다. 위에서 말한바와 같이 channel이 닫히거나, connection이 닫히거나, TCP Connection이 종료될 때 해당 consumer가 죽었다고 판단하고 메세지를 재큐잉한다.  

rabbitmq에서는 수동 ack이 기본적으로 켜져있다. tutorial을 진행하면서, 아래와 같이 autoAck을 true로 함으로써, 수동 ack을 끄고 있는 상태로 메세지를 수신하고 있었다.
```java
boolean autoAck = true;
channel.basicConsume(QUEUE_NAME, autoAck, consumer);
```
수동 ack으로 rabbitmq에게 ack을 보내려면 다음과 같이 autoAck을 false로 해주고 메세지가 처리될 때마다 ack을 명시적으로 보내줘야 한다.
```java
boolean autoAck = false;
channel.basicConsume(QUEUE_NAME, autoAck, consumer);

channel.basicAck(envelope.getDeliveryTag(), false);
```
Ack을 보내고 받는 채널은 같은 채널이어야 한다. 혹시나, 멀티 쓰레드 환경에서 여러 채널을 열고, 다른 채널에서 받은 메세지에 대해 ack을 보내려하면, 채널 레벨 프로토콜 익셉션이 발생한다.

**Forgotten Acknowledgement**

basic ack을 실수로 잊어버리고 안보내는 경우가 있을 수 있다. 이러한 경우 rabbitmq는 consumer가 죽었다는 판단을 못내리게 되고, 메세지는 계속해서 unack에 쌓이게 된다. 이러한 실수를 debug하기 위해 아래의 명령어를 사용할 수 있다.
 ```bash
sudo rabbitmqctl list_queues name messages_ready messages_unacknowledged
```
개인적으로는 Management ui에서 unack이 쌓이는 양과 속도를 보면 금방 캐치할 수 있다고 생각한다.

**Durability**

```java
boolean durable = true;
channel.queueDeclare(DURABLE_QUEUE_NAME, durable, false, false, null);
```
rabbitmq를 재시작하거나, 종료하면 queue의 정보와 queue에 있던 message의 정보 모두 사라지게 된다. 이것을 방지하기 위해 queueDeclare시에 durable 설정을 true로 해주자. 이렇게 하면, queue정보를 디스크에서 가지고 있기 때문에, rabbitmq가 예기치 못하게 종료되거나 재시작해도 해당 queue에 대한 정보를 보존할 수 있다. 이제 queue에 대한 durability는 설정이 되었지만, message는 여전히 rabbitmq를 재시작하면 사라지고 있다.  
이것을 방지하기 위해 message에 persistent설정을 해주자.  

```java
import com.rabbitmq.client.MessageProperties;

channel.basicPublish("", DURABLE_QUEUE_NAME, MessageProperties.PERSISTENT_TEXT_PLAIN, message.getBytes());
```
위와 같이 메세지를 큐에 발행할 때, PERSISTENT설정을 해주면, 메세지 또한 디스크에 저장되어 보존된다. 하지만, 이러한 설정이 메세지 영속성을 100% 보장해주진 않는다.  
rabbitmq가 메세지를 받고 저장하기까지 짧은 시간이 존재하고, 그 시간안에 문제가 발생해서 rabbitmq가 죽거나 재시작된다면, 해당 message의 영속성은 보장되지 않는다.  
rabbitmq를 운영하면서 위와같이 큐와 메세지에 대한 durability를 설정하고 있는데, message영속성이 보장되지 않는 상황은 아직까지 맞닥뜨리지 못했다. 하지만 더욱 확실하게 보장하고 싶으면, [Publisher Confirms](https://www.rabbitmq.com/tutorials/tutorial-seven-java.html)를 읽고 적용해보자.

이제, 앞에서 설명한 Fair Dispatcher, Acknowledgement, Durability를 적용해보자.  

**Producer**
```java
public class TaskTwo implements TaskExecutable {

    private final static String DURABLE_QUEUE_NAME = "task_queue";

    public void executeTask(List<String> args, ConnectionFactory factory) throws IOException, TimeoutException {

        String message = String.join(" ", args);

        try(Connection connection = factory.newConnection();
            Channel channel = connection.createChannel()) {
            channel.queueDeclare(DURABLE_QUEUE_NAME, true, false, false, null);
            channel.basicPublish("", DURABLE_QUEUE_NAME, MessageProperties.PERSISTENT_TEXT_PLAIN, message.getBytes());
            System.out.println(" [x] Sent'" + message + "'");
        }
    }
}
```
```bash
java -jar producer-0.0.1-SNAPSHOT.jar --task=tasktwo --content=first.....
 [x] Sent'hello.....'

java -jar producer-0.0.1-SNAPSHOT.jar --task=tasktwo --content=second...
 [x] Sent'hello...'

java -jar producer-0.0.1-SNAPSHOT.jar --task=tasktwo --content=third..
 [x] Sent'hello..'
```
**Consumer**
```java
public class TaskTwo implements TaskExecutable {

    private final static String DURABLE_QUEUE_NAME = "task_queue";

    public void executeTask(List<String> args, ConnectionFactory factory) throws IOException, TimeoutException {
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();
        channel.queueDeclare(DURABLE_QUEUE_NAME, true, false, false, null);
        System.out.println(" [*] Waiting for messages. To exit press CTRL+C");

        channel.basicQos(1);
        Consumer consumer = new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                String message = new String(body, "UTF-8");
                System.out.println(" [x] Received'" + message + "'");

                try {
                    doWork(message);
                } finally {
                    channel.basicAck(envelope.getDeliveryTag(), false);
                    System.out.println(" [x] Done");
                }
            }
        };
        boolean autoAck = false;
        channel.basicConsume(DURABLE_QUEUE_NAME, autoAck,consumer);
    }

    private void doWork(String message) {
        for (char ch : message.toCharArray()) {
            try {
                if (ch == '.') Thread.sleep(1000);
            } catch (InterruptedException _ignored) {
                Thread.currentThread().interrupt();
            }
        }
    }
}
```

***consumer 1***

```bash
 [*] Waiting for messages. To exit press CTRL+C
 [x] Received'first.....'
 [x] Done
```

***consumer 2***

```bash
 [*] Waiting for messages. To exit press CTRL+C
 [x] Received'second...'
 [x] Done
 [x] Received'third..'
 [x] Done
```
이제 consumer들이 더욱 효율적이게 message를 병렬로 처리할 수 있게 되었고, queue와 message에 대한 안정성 또한 가지게 되었다.

### 3. Publish / Subscribe

![_config.yml](/media/middleware/rabbitmq/rabbitmq_publish_subscribe.png){: .center}  
지금까지의 가정은 하나의 메세지는 하나의 consumer에게 전달된다는 것이었다. 이번에는 publish/subscribe 패턴처럼 하나의 메세지를 여러 consumer에게 전달해 보겠다.  
rabbitmq에서 메시징 모델의 중심 개념은 producer는 결코 어떠한 메세지라도 큐에 직접 전송하지 않는다는 것이다. producer는 오직 exchange에 메세지를 전송하고, exchange를 통해서 메세지는 queue로 전달된다.  
이전 예제들에서 exchange를 알지 못해도 다음과 같이 publishing이 가능했던 이유는 exchange queue를 명시하는 첫 번째 파라미터가 ""로 되어있기 때문이었다.  
""는 default exchange(nameless exchage)를 의미하고, exchange queue에 ""를 명시하면, default exchange를 거쳐 queue로 바로 메세지를 보내게 된다.

```java
channel.basicPublish("", QUEUE_NAME, null, message.getBytes());
```

***Exchange Type***

exchange의 type은 다음과 같다.
![_config.yml](/media/middleware/rabbitmq/rabbitmq_exchange_type.png){: .center}  
우선 하나의 메세지를 여러 consumer에게 전달하기 위해서 fanout 타입을 사용하겠다.  

**Producer**
```java
public class TaskThree implements TaskExecutable {

    private static final String EXCHANGE_NAME = "logs";

    public void executeTask(List<String> args, ConnectionFactory factory) throws IOException, TimeoutException {

        String message = args.size() < 1 ? "info: Hello World!" :
                String.join(" ", args);

        try(Connection connection = factory.newConnection();
            Channel channel = connection.createChannel()) {
            channel.exchangeDeclare(EXCHANGE_NAME, "fanout");

            channel.basicPublish(EXCHANGE_NAME, "", null, message.getBytes("UTF-8"));
            System.out.println(" [x] Sent'" + message + "'");
        }
    }
}
```
로그를 발생시키면 해당 로그를 여러곳에서 consuming하고 있는 구조의 간단한 로그시스템이라고 생각해보자.
```java
channel.exchangeDeclare(EXCHANGE_NAME, "fanout");
```
위와 같이 exchange를 fanout type으로 생성해주고
```java
channel.basicPublish(EXCHANGE_NAME, "", null, message.getBytes("UTF-8"));
```
queue이름을 명시해주지 않고, exchange만 명시해주고 메세지를 발행했다.  
producer와 consumer사이에서 queue이름을 명시적으로 정해주고 queue의 durability를 관리해주는것이 기본적으로 중요하다.   
하지만, 지금과 같은 간단한 로깅 시스템은 모든 로그메시지를 받는게 중요하고, 이전 메시지는 중요하지 않고, 현재 계속해서 발생하고 있는 메시지에 더 초점을 맞춘다. 이러한 상황에서는 다음과 같이 랜덤한 queue를 생성하여, 필요할때마다 랜덤한 queue이름으로 consumer를 늘리고 줄이면서, 탄력적이게 운용할 수 있는 방식이 좋다.
```java
String queueName = channel.queueDeclare().getQueue();
```

**Consumer**
```java
public class TaskThree implements TaskExecutable {

    private static final String EXCHANGE_NAME = "logs";

    public void executeTask(List<String> args, ConnectionFactory factory) throws IOException, TimeoutException {

        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        channel.exchangeDeclare(EXCHANGE_NAME, "fanout");
        String queueName = channel.queueDeclare().getQueue();
        channel.queueBind(queueName, EXCHANGE_NAME, "");

        System.out.println(" [*] Waiting for messages. To exit press CTRL+C");

        Consumer consumer = new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                String message = new String(body, "UTF-8");
                System.out.println(" [x] Received '" + message + "'");
            }
        };
        channel.basicConsume(queueName, true, consumer);
    }
}
```

consumer 역시 type을 fanout으로 하여 exchange를 생성하고, queue이름을 random으로 하여 queue를 생성하여 exchange와 binding한다.  
이제 여러곳에서 consumer를 띄우면 logs exchange에 모두 바인딩되어 발생하는 로그를 받게 된다.  

exchange와 queue 사이의 관계를 정의하는것이 binding이며, exchange가 아무 queue에도 binding되어 있지 않다면, message는 버려진다.

***consumer 1***

```bash
 [*] Waiting for messages. To exit press CTRL+C
 [x] Received 'info:HelloWorld!'
```

***consumer 2***

```bash
 [*] Waiting for messages. To exit press CTRL+C
 [x] Received 'info:HelloWorld!'
```

***consumer 3***

```bash
 [*] Waiting for messages. To exit press CTRL+C
 [x] Received 'info:HelloWorld!'
```

### 4. Routing

![_config.yml](/media/middleware/rabbitmq/rabbitmq_routing_1.png){: .center} 

이번에는 가장 많이 쓰이는 Exchange type direct에 대해서 알아보겠다. 앞서 direct type은 지정된 routingKey를 가진 queue에만 메세지를 전달한다고 하였다.  
위의 그림에서는 routingKey가 orange인 메세지는 Q1, black과 green은 Q2로 전달된다.  
다음과 같이 queue를 binding할 때, routingKey를 명시적으로 적어주면, 해당 routingKey와 함께 exchange에 발행된 메세지는 binding된 queue로 메세지를 전달한다. 앞선 예제에서 fanout의 경우 routingKey를 ""로 해주었지만, direct의 경우 다음과 같이 routingKey를 명시적으로 적어준다.
```java
channel.queueBind(queueName, EXCHANGE_NAME, "black");
```
만약 여러 queue에서 같은 routingKey를 사용하게 된다면, 아래 그림과 같이 fanout과 같은 방식처럼 사용될 수도 있다.
![_config.yml](/media/middleware/rabbitmq/rabbitmq_routing_2.png){: .center}  

첫번째 그림과 같이 Q1, Q2에 각각 다른 routingKey를 설정하는 예제를 진행해 보겠다.  
consumer1에서 queue를 생성하고 해당 queue를 routingKey orange로 exchange에 binding하고,  
consumer2에서 queue를 생성하고 해당 queue를 routingKey black, green로 exchange에 binding하겠다.  

producer로 message에 routingKey를 포함하여 exchange에 보내겠다.  
결과를 확인해보자.

**Producer**
```java
public class TaskFour implements TaskExecutable {

    private static final String EXCHANGE_NAME = "direct_color";

    public void executeTask(List<String> args, ConnectionFactory factory) throws IOException, TimeoutException {

        try(Connection connection = factory.newConnection();
            Channel channel = connection.createChannel()) {
            channel.exchangeDeclare(EXCHANGE_NAME, "direct");

            String color = getColor(args);
            String message = getMessage(color);

            channel.basicPublish(EXCHANGE_NAME, color, null, message.getBytes("UTF-8"));
            System.out.println(" [x] Sent '" + color + "':'" + message + "'");
        }
    }

    private static String getColor(List<String> strings) {
        if (strings.size() < 1)
            return "orange";
        return strings.get(0);
    }

    private static String getMessage(String color) {
        return "RabbitMq Routing Key - " + color;
    }
}
```
```bash
java -jar producer-0.0.1-SNAPSHOT.jar --task=taskfour --content=orange
[x] Sent 'orange':'RabbitMq Routing Key - orange'
java -jar producer-0.0.1-SNAPSHOT.jar --task=taskfour --content=black
[x] Sent 'black':'RabbitMq Routing Key - black'
java -jar producer-0.0.1-SNAPSHOT.jar --task=taskfour --content=green
[x] Sent 'green':'RabbitMq Routing Key - green'
```

**Consumer**
```java
public class TaskFour implements TaskExecutable {

    private static final String EXCHANGE_NAME = "direct_color";

    public void executeTask(List<String> args, ConnectionFactory factory) throws IOException, TimeoutException {

        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        channel.exchangeDeclare(EXCHANGE_NAME, "direct");
        String queueName = channel.queueDeclare().getQueue();

        if (args.size() < 1) {
            System.err.println("[orange] [black] [green]");
            System.exit(1);
        }

        for (String color : args) {
            channel.queueBind(queueName, EXCHANGE_NAME, color);
        }
        System.out.println(" [*] Waiting for messages. To exit press CTRL+C");
        Consumer consumer = new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                String message = new String(body, "UTF-8");
                System.out.println(" [x] Received '" + message + "'");
            }
        };
        channel.basicConsume(queueName, true, consumer);
    }
}
```

***consumer 1***

```bash
java -jar consumer-0.0.1-SNAPSHOT.jar --task=taskfour --content=orange
[*] Waiting for messages. To exit press CTRL+C
[x] Received 'RabbitMq Routing Key - orange'
```

***consumer 2***

```bash
java -jar consumer-0.0.1-SNAPSHOT.jar --task=taskfour --content=black --content=green
[*] Waiting for messages. To exit press CTRL+C
[x] Received 'RabbitMq Routing Key - black'
[x] Received 'RabbitMq Routing Key - green'
```

routingKey에 binding된 queue로 message가 전달되는 것을 확인할 수 있다.  
rabbitmq Management UI에서 queue의 바인딩 정보를 확인해 보자.

![_config.yml](/media/middleware/rabbitmq/rabbitmq_direct1.png){: .center}
![_config.yml](/media/middleware/rabbitmq/rabbitmq_direct2.png){: .center}

queue이름을 명시적으로 적어주지 않았기 때문에, 이전 예제와 같이 랜덤한 이름의 queue가 생성되었고,  
각 consumer마다 channel의 정보와 queue의 binding정보도 한눈에 확인 할 수 있다.  

### 5. Topic

다음으로 여러개의 조건에 근거한 routing을 살펴보겠다.  
![_config.yml](/media/middleware/rabbitmq/rabbitmq_topic.png){: .center}  

* \* (star)는 정확히 1개의 단어를 치환할 수 있다.
* \# (hash)는 0개나 여러개의 단어를 치환할 수 있다.

exchange type topic에서 위와 같은 규칙을 적용하여 패턴 바인딩을 정의하면, 여러개의 조건에 맞춰 routing을 하는것이 가능하다.

consumer1에서 queue를 생성하고 해당 queue를 routingKey \*.orange.\*로 exchange에 binding하고,  
consumer2에서 queue를 생성하고 해당 queue를 routingKey \*.\*.rabbit, lazy.\#로 exchange에 binding하겠다.  

producer로 message에 routingKey를 포함하여 exchange에 보내겠다.  
결과를 확인해보자.

**Producer**
```java
public class TaskFive implements TaskExecutable {

    private static final String EXCHANGE_NAME = "topic_logs";

    @Override
    public void executeTask(List<String> args, ConnectionFactory factory) throws IOException, TimeoutException {
        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {

            channel.exchangeDeclare(EXCHANGE_NAME, "topic");

            String routingKey = getRouting(args);
            String message = getMessage(routingKey);

            channel.basicPublish(EXCHANGE_NAME, routingKey, null, message.getBytes("UTF-8"));
            System.out.println(" [x] Sent '" + routingKey + "':'" + message + "'");
        }
    }

    private String getRouting(List<String> strings) {
        if (strings.size() < 1)
            return "quick.orange.fox";
        return strings.get(0);
    }

    private String getMessage(String rountingKey) {
        return "RabbitMq Topic - " + rountingKey;
    }
}
```

**Consumer**
```java
public class TaskFive implements TaskExecutable {

    private static final String EXCHANGE_NAME = "topic_logs";

    @Override
    public void executeTask(List<String> args, ConnectionFactory factory) throws IOException, TimeoutException {
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        channel.exchangeDeclare(EXCHANGE_NAME, "topic");
        String queueName = channel.queueDeclare().getQueue();

        if (args.size() < 1) {
            System.err.println("Usage: ReceiveLogsTopic [binding_key]...");
            System.exit(1);
        }

        for (String bindingKey : args) {
            channel.queueBind(queueName, EXCHANGE_NAME, bindingKey);
        }

        System.out.println(" [*] Waiting for messages. To exit press CTRL+C");

        Consumer consumer = new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                String message = new String(body, "UTF-8");
                System.out.println(" [x] Received '" +
                        envelope.getRoutingKey() + "':'" + message + "'");
            }
        };
        channel.basicConsume(queueName, true, consumer);
    }
}
```
```bash
java -jar producer-0.0.1-SNAPSHOT.jar --task=taskfive --content=apple.orange.banana
[x] Sent 'apple.orange.banana':'RabbitMq Topic - apple.orange.banana'
java -jar producer-0.0.1-SNAPSHOT.jar --task=taskfive --content=apple.orange.
[x] Sent 'apple.orange':'RabbitMq Topic - apple.orange.'
java -jar producer-0.0.1-SNAPSHOT.jar --task=taskfive --content=.orange.
[x] Sent '.orange.':'RabbitMq Topic - .orange.'

java -jar producer-0.0.1-SNAPSHOT.jar --task=taskfive --content=..rabbit
[x] Sent '..rabbit':'RabbitMq Topic - ..rabbit'
java -jar producer-0.0.1-SNAPSHOT.jar --task=taskfive --content=lazy.
[x] Sent 'lazy.':'RabbitMq Topic - lazy.'
java -jar producer-0.0.1-SNAPSHOT.jar --task=taskfive --content=lazy.apple.banana
[x] Sent 'lazy.apple.banana':'RabbitMq Topic - lazy.apple.banana'
java -jar producer-0.0.1-SNAPSHOT.jar --task=taskfive --content=lazy
[x] Sent 'lazy':'RabbitMq Topic - lazy'

```

***consumer 1***

```bash
java -jar consumer-0.0.1-SNAPSHOT.jar --task=taskfive --content="*.orange.*"
[*] Waiting for messages. To exit press CTRL+C
[x] Received 'apple.orange.banana':'RabbitMq Topic - apple.orange.banana'
[x] Received 'apple.orange.':'RabbitMq Topic - apple.orange.'
[x] Received '.orange.':'RabbitMq Topic - .orange.'
```

***consumer 2***

```bash
java -jar consumer-0.0.1-SNAPSHOT.jar --task=taskfive --content="*.*.rabbit" --content="lazy.#"
[*] Waiting for messages. To exit press CTRL+C
[x] Received '..rabbit':'RabbitMq Topic - ..rabbit'
[x] Received 'lazy.':'RabbitMq Topic - lazy.'
[x] Received 'lazy.apple.banana':'RabbitMq Topic - lazy.apple.banana'
[x] Received 'lazy':'RabbitMq Topic - lazy'
```

routingKey에 binding된 pattern대로 message가 전달되는 것을 확인할 수 있다.  
rabbitmq Management UI에서 queue의 바인딩 정보를 확인해 보자.

![_config.yml](/media/middleware/rabbitmq/rabbitmq_topic1.png){: .center}
![_config.yml](/media/middleware/rabbitmq/rabbitmq_topic2.png){: .center}

각각의 consumer와 연결된 queue의 정보와 binding된 topic pattern정보를 확인할 수 있다.  

공식 tutorial을 참고하여 예제를 진행하며, 간략하게 rabbitmq의 요소들에 대해 알아 보았다.  
남아있는 RPC, Publisher Confirms는 추후에, 필요하다 생각되면 추가로 정리할 생각이다.  
우선은 위의 예제들만으로도 rabbitMq의 개념에 대해 이해하는데 크게 무리는 없을것이다.  
다음으로는 High Availability를 위한 Clustering, Mirroring에 대해 알아보겠다.