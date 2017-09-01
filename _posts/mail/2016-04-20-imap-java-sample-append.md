---
layout: post
title: "IMAP Sample Java Code - Append"
date: 2016-04-20
categories: mail
---

* content
{:toc}

IMAP에 eml 파일을 업로드하는 샘플 코드


- ImapAppendJob.java

```java
package com.inter6.mail.job;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.Properties;

import javax.mail.Flags.Flag;
import javax.mail.Folder;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.NoSuchProviderException;
import javax.mail.Session;
import javax.mail.Store;
import javax.mail.internet.MimeMessage;

import lombok.extern.slf4j.Slf4j;

import org.apache.commons.lang3.ArrayUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import com.inter6.mail.module.AppConfig;
import com.inter6.mail.util.MessageUtil;
import com.sun.mail.imap.AppendUID;
import com.sun.mail.imap.IMAPFolder;
import com.sun.mail.imap.IMAPMessage;

@Component
@Slf4j
public class ImapAppendJob implements Job {

	@Autowired
	private AppConfig appConfig;

	@Autowired
	private ApplicationContext context;

	@Override
	public void execute(Object params) throws Exception {
		File eml = this.context.getResource("/eml/append.eml").getFile();

		Store store = null;
		Folder folder = null;
		try {
			store = this.getStore();
			store.connect(this.appConfig.getString("imap.host"), this.appConfig.getString("imap.user"), this.appConfig.getString("imap.password"));
			log.info("connect imap - OPEN:" + store.isConnected());

			folder = store.getFolder("Inbox");
			if (folder == null) {
				throw new IllegalStateException("not found folder !");
			}
			folder.open(Folder.READ_WRITE);

			try (InputStream is = new FileInputStream(eml)) {
				Message msg = new MimeMessage(null, is);
				IMAPFolder imapFolder = (IMAPFolder) folder;

				AppendUID[] appendUIDs = imapFolder.appendUIDMessages(new Message[] { msg });
				if (ArrayUtils.isEmpty(appendUIDs)) {
					throw new IllegalStateException("append message fail! - EML:" + eml);
				}
				for (AppendUID appendUID : appendUIDs) {
					log.info("append message - UID:" + appendUID.uid + " EML:" + eml);
					this.printMessage(imapFolder, (IMAPMessage) imapFolder.getMessageByUID(appendUID.uid));
				}
			}
		} finally {
			if (folder != null && folder.isOpen()) {
				folder.close(false);
			}
			if (store != null && store.isConnected()) {
				store.close();
			}
		}
	}

	private void printMessage(IMAPFolder folder, IMAPMessage msg) throws MessagingException {
		long uid = folder.getUID(msg);
		String envelopeInfo = MessageUtil.getEnvelopeInfoStr(msg);
		int size = msg.getSize();
		boolean isSeen = msg.isSet(Flag.SEEN);
		log.info("message info - UID:" + uid + " ENV:[" + envelopeInfo + "] SIZE:" + size + " SEEN:" + isSeen);
	}

	private Store getStore() throws NoSuchProviderException {
		Properties props = new Properties();
		props.put("mail.imap.port", this.appConfig.getString("imap.port"));
		props.put("mail.debug", this.appConfig.getString("mail.debug"));
		Session session = Session.getInstance(props);
		return session.getStore("imap");
	}
}
```