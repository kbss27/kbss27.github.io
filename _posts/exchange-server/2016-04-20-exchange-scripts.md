---
layout: post
title: "Exchange 파워쉘 스크립트 모음"
date: 2016-04-20
categories: exchange
---

* content
{:toc}

### 메일박스 사용량

```
Get-MailboxStatistics -database $edbName | Format-Table displayname, totalitemsize, itemcount
```

### 메일박스 사용량 통계 (합, 평균, 최고, 최저)

```powershell
Get-Mailbox -Database $edbName -ResultSize Unlimited | Get-MailboxStatistics | %{$_.TotalItemSize.Value.ToMB()} | Measure-Object -sum -average -max -min
```

### Sofe Delete한 메일들 Clean up

```powershell
Get-MailboxStatistics -Database $edbName | where {$_.DisconnectReason -eq "SoftDeleted"} | foreach {Remove-StoreMailbox -Database $_.database -Identity $_.mailboxguid -MailboxState SoftDeleted}
```

### Health Mail 수신하지 않기

```powershell
Get-Mailbox -Monitoring | Set-Mailbox -ExtensionCustomAttribute1 Ignore
```

### $permUser에게 모든 메일박스 권한 주기

```powershell
Get-Mailbox | ForEach-Object {$user = $_.distinguishedname; Add-MailboxPermission -Identity $user -User $permUser -AccessRights FullAccess}
```

### 특정 사용자 메일박스 크기 보는 방법(MB)

```powershell
Get-MailboxStatistics <UserName> | Select-object DisplayName,{$_.TotalItemSize.Value.ToMB()}
```

### 특정 사용자의 폴더별 크기보는 방법(MB)

```powershell
get-mailboxfolderstatistics <UserName> | ft Name, @{expression={$_.FolderSize.ToMB()} ;label="MB" }
```

### 전체 사용자 메일박스 크기 보는 방법

```powershell
Get-Mailbox  -ResultSize Unlimited | Get-MailboxStatistics | Select-object DisplayName,{$_.TotalItemSize.Value.ToMB()} | export-csv c:\result.csv -encoding "UTF8"
```

### 사용자 사서함에서 폴더목록 뽑아내는 방법

```powershell
Get-Mailbox -ResultSize Unlimited | foreach {
	$mbx = $_
	Get-MailboxFolderStatistics $mbx.identity  -FolderScope 'Inbox' |where {$_.FolderPath -like '*폴더명*'} | Select @{n="UserId";e={$mbx.Name}}, Name, Identity, FolderPath, ItemsInFolder, FolderSize
} | export-csv c:\result.csv -encoding "UTF8"
```

### 사서함DB당 사서함 개수확인하는 방법

```powershell
foreach($name in get-mailboxdatabase) {
	$count=(get-mailbox -database $name).count
	write-host $count -nonewline
	write-host ”개의 사서함이 $name 에 있습니다.”
}
```