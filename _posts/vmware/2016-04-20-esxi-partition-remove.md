---
layout: post
title: "ESXi 기존 파티션 삭제하기"
date: 2016-04-20
categories: vmware
---

* content
{:toc}

ESXi에 디스크를 물리고 VMFS로 파티션하고자 할 때, 디스크에 기존 파티션이 남아있다면 VMFS로 파티션 할 수 없다. 따라서 partedUtil delete로 기존 파티션을 지워줘야한다.

```bash
# esxcfg-scsidevs -l
this lists the disk devices, the device file will be /dev/disks/<NAME>
output looks like:
t10.ATA_____ST3320620AS_________________________________________6QF1PZXB
   Device Type: Direct-Access
   Size: 305245 MB
   Display Name: Local ATA Disk (t10.ATA_ST3320620AS_6QF1PZXB)
   Multipath Plugin: NMP
   Console Device: /vmfs/devices/disks/t10.ATA_____ST3320620AS_________________________________________6QF1PZXB
   Devfs Path: /vmfs/devices/disks/t10.ATA_____ST3320620AS_________________________________________6QF1PZXB
   Vendor: ATA       Model: ST3320620AS       Revis: 3.AA
   SCSI Level: 5  Is Pseudo: false Status: on
   Is RDM Capable: false Is Removable: false
   Is Local: true  Is SSD: false
   Other Names:
      vml.010000000020202020202020202020202036514631505a5842535433333230
   VAAI Status: unknown
 
# partedUtil get /dev/disks/t10.ATA_...
this shows the partitions on the device
output looks like:
38913 255 63 625142448
1 63 514079 130 128
2 514080 625137344 253 0
 
this disk has 2 partitions, numbers 1 and 2
 
# partedUtil delete /dev/disks/t10.ATA_... 2
deletes partition 2
 
# partedUtil delete /dev/disks/t10.ATA_... 1
deletes partition 1
```