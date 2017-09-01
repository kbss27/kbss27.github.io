---
layout: post
title: "IMAP Sample Java Code - Basic"
date: 2016-04-20
categories: mail
---

* content
{:toc}

Java로 IMAP 내의 메일을 리스팅하는 기본적인 코드.

- IMAP 서버와 커넥션을 맺고
- 폴더를 오픈한 다음
- 메세지를 검색해서
- 검색한 메세지들을 fetch 해온다.

아래 코드는 아직 메일의 헤더와 내용은 가져오지 않았고, IMAP 서버가 인덱싱한 [Envelope](./IMAP%20Envelope.md)과 Flag 정보만 가져왔음에 주의하라.
이 코드가 날리는 fetch 명령어는 다음과 같다.

```
A FETCH 1 (ENVELOPE INTERNALDATE RFC822.SIZE FLAGS)
```

- pom.xml

```xml
<dependency>
	<groupId>com.sun.mail</groupId>
	<artifactId>javax.mail</artifactId>
	<version>1.5.2</version>
</dependency>
<dependency>
	<groupId>com.sun.mail</groupId>
	<artifactId>imap</artifactId>
	<version>1.5.2</version>
</dependency>
```

- ImapBasicJob.java

```java
package com.inter6.mail.job;

import java.util.Date;
import java.util.Properties;

import javax.mail.Address;
import javax.mail.FetchProfile;
import javax.mail.Flags.Flag;
import javax.mail.Folder;
import javax.mail.Message;
import javax.mail.Message.RecipientType;
import javax.mail.MessagingException;
import javax.mail.NoSuchProviderException;
import javax.mail.Session;
import javax.mail.Store;
import javax.mail.internet.InternetAddress;

import lombok.extern.slf4j.Slf4j;

import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.DateFormatUtils;
import org.springframework.stereotype.Component;

import com.sun.mail.imap.IMAPFolder;
import com.sun.mail.imap.IMAPMessage;

@Component
@Slf4j
public class ImapBasicJob implements Job {

	@Override
	public void execute(Object params) throws Exception {
		Store store = null;
		try {
			store = this.getStore();
			store.connect("HOST", "USERNAME", "PASSWORD");
			log.info("connect imap - OPEN:" + store.isConnected());

			Folder rootFolder = store.getDefaultFolder();
			Folder[] folders = rootFolder.list();
			if (ArrayUtils.isEmpty(folders)) {
				throw new IllegalStateException("not found folders !");
			}
			for (Folder folder : folders) {
				this.travelFolder(folder);
			}
		} finally {
			if (store != null && store.isConnected()) {
				store.close();
			}
		}
	}

	private void travelFolder(Folder folder) {
		String folderName = "";
		try {
			if (folder == null) {
				throw new IllegalArgumentException("folder is null !");
			}
			folderName = folder.getFullName();
			folder.open(Folder.READ_ONLY);
			log.info("open folder - FLD:" + folderName + " TOT_MSGS:" + folder.getMessageCount() + " NEW_MSGS:" + folder.getNewMessageCount());

			Folder[] childFolders = folder.list();
			if (ArrayUtils.isNotEmpty(childFolders)) {
				for (Folder childFolder : childFolders) {
					this.travelFolder(childFolder);
				}
			}

			Message[] msgs = folder.getMessages();
			log.info("search messages - FLD:" + folderName + " CNT:" + ArrayUtils.getLength(msgs));

			if (ArrayUtils.isNotEmpty(msgs)) {
				folder.fetch(msgs, this.createFetchProfile());
				log.info("fetch messages - FLD:" + folderName + " CNT:" + msgs.length);

				for (Message msg : msgs) {
					this.printMessage((IMAPFolder) folder, (IMAPMessage) msg);
				}
			}
		} catch (MessagingException e) {
			log.error("travel folder fail ! - FLD:" + folderName, e);
		} finally {
			if (folder != null && folder.isOpen()) {
				try {
					folder.close(false);
				} catch (MessagingException e) {
					log.error("close folder fail ! - FLD:" + folderName, e);
				}
			}
		}
	}

	private void printMessage(IMAPFolder folder, IMAPMessage msg) throws MessagingException {
		long uid = folder.getUID(msg);
		String envelopeInfo = this.getEnvelopeInfo(msg);
		int size = msg.getSize();
		boolean isSeen = msg.isSet(Flag.SEEN);
		log.info("message info - UID:" + uid + " ENV:[" + envelopeInfo + "] SIZE:" + size + " SEEN:" + isSeen);
	}

	private String getEnvelopeInfo(IMAPMessage msg) throws MessagingException {
		StringBuilder sb = new StringBuilder();
		Date internalDate = msg.getReceivedDate();
		if (internalDate != null) {
			sb.append("INTERNAL_DATE:[" + DateFormatUtils.format(internalDate, "yyyy/MM/dd HH:mm:ss") + "]");
		}
		String envelopeSubject = msg.getSubject();
		sb.append(" ENV_SUBJECT:[" + StringUtils.trimToEmpty(envelopeSubject) + "]");
		Address[] envelopeFroms = msg.getFrom();
		sb.append(" ENV_FROM:[" + this.addressToStr(envelopeFroms) + "]");
		Address envelopeSender = msg.getSender();
		sb.append(" ENV_SENDER:[" + this.addressToStr(envelopeSender) + "]");
		Address[] envelopeTos = msg.getRecipients(RecipientType.TO);
		sb.append(" ENV_TO:[" + this.addressToStr(envelopeTos) + "]");
		Address[] envelopeCcs = msg.getRecipients(RecipientType.CC);
		sb.append(" ENV_CC:[" + this.addressToStr(envelopeCcs) + "]");
		String envelopeMsgID = msg.getMessageID();
		sb.append(" ENV_MSG_ID:[" + StringUtils.trimToEmpty(envelopeMsgID) + "]");
		return sb.toString();
	}

	private String addressToStr(Address... addrs) {
		if (ArrayUtils.isEmpty(addrs)) {
			return "";
		}
		StringBuilder sb = new StringBuilder();
		boolean isFirst = true;
		for (Address addr : addrs) {
			if (isFirst) {
				isFirst = false;
			} else {
				sb.append(", ");
			}
			if (addr instanceof InternetAddress) {
				InternetAddress iaddr = (InternetAddress) addr;
				String personal = StringUtils.trimToEmpty(iaddr.getPersonal());
				sb.append(personal);
				String mail = StringUtils.trimToEmpty(iaddr.getAddress());
				sb.append("<" + mail + ">");
			} else {
				sb.append(addr.toString());
			}
		}
		return sb.toString();
	}

	private FetchProfile createFetchProfile() {
		FetchProfile fp = new FetchProfile();
		fp.add(FetchProfile.Item.ENVELOPE);
		fp.add(FetchProfile.Item.FLAGS);
		return fp;
	}

	private Store getStore() throws NoSuchProviderException {
		Properties props = new Properties();
		props.put("mail.imap.port", "143");
		Session session = Session.getInstance(props);
		return session.getStore("imap");
	}
}
```

- Output

```
...
2014/12/04 22:43:56.154 main INFO : ImapBasicJob.travelFolder() - open folder - FLD:Trash TOT_MSGS:3 NEW_MSGS:0
2014/12/04 22:43:56.155 main INFO : ImapBasicJob.travelFolder() - search messages - FLD:Trash CNT:3
2014/12/04 22:43:56.157 main INFO : ImapBasicJob.travelFolder() - fetch messages - FLD:Trash CNT:3
2014/12/04 22:43:56.159 main INFO : ImapBasicJob.printMessage() - message info - UID:32 ENV:[INTERNAL_DATE:[2014/12/01 05:02:25] ENV_SUBJECT:[inter6-xpen에서 네트워크 백업이 완료되었습니다] ENV_FROM:[inter6-xpen<xpenology@inter6.com>] ENV_SENDER:[inter6-xpen<xpenology@inter6.com>] ENV_TO:[<inter6@inter6.com>] ENV_CC:[] ENV_MSG_ID:[]] SIZE:951 SEEN:true
2014/12/04 22:43:56.160 main INFO : ImapBasicJob.printMessage() - message info - UID:33 ENV:[INTERNAL_DATE:[2014/12/02 10:16:03] ENV_SUBJECT:[inter6-xpen의 IP 주소 [114.47.172.29]이(가) Mail Server에 의해 차단되었습니다.] ENV_FROM:[inter6-xpen<xpenology@inter6.com>] ENV_SENDER:[inter6-xpen<xpenology@inter6.com>] ENV_TO:[<inter6@inter6.com>] ENV_CC:[] ENV_MSG_ID:[]] SIZE:1035 SEEN:true
2014/12/04 22:43:56.160 main INFO : ImapBasicJob.printMessage() - message info - UID:34 ENV:[INTERNAL_DATE:[2014/11/29 16:42:55] ENV_SUBJECT:[inter6-xpen의 IP 주소 [2.189.142.2]이(가) Mail Server에 의해 차단되었습니다.] ENV_FROM:[inter6-xpen<xpenology@inter6.com>] ENV_SENDER:[inter6-xpen<xpenology@inter6.com>] ENV_TO:[<inter6@inter6.com>] ENV_CC:[] ENV_MSG_ID:[]] SIZE:1029 SEEN:true
...
```