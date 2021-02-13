+++
author = "Roman Zaynetdinov"
date = 2021-01-25T12:00:00+03:00
title = "Set up a NAS on RockPro64 with FreeBSD 13"
draft = false
+++

This is my personal guide on how to set up a NAS with FreeBSD 13 and ZFS on Pine64's RockPro64.

## Installation

1. Download a FreeBSD 13 image for rockpro64 board (under [aarch64](https://download.freebsd.org/ftp/snapshots/arm64/aarch64/ISO-IMAGES/13.0/) section)
1. Write an image to a micro SD card ([BSD install](https://www.freebsd.org/doc/en_US.ISO8859-1/books/handbook/bsdinstall-pre.html))
1. A white LED should indicate that OS has successfully started.
    * If white LED is off this indicates that OS could not boot. Your best option is to [debug boot process with serial connection](@/post/uart-rockpro64.md).
    * HDMI output should also be available nowadays. If you screen's resolution is 4K or larger than FreeBSD won't boot.
1. You can connect to your device with SSH since FreeBSD starts a SSH server by default. Users:
    * root - root
    * freebsd - freebsd
1. Upon first boot FreeBSD should resize root partition to fill all space on micro SD card.

    ```sh
    freebsd@nas:~ % df -h
    Filesystem          Size    Used   Avail Capacity  Mounted on
    /dev/ufs/rootfs      58G    3.2G     50G     6%    /
    #...
    ```
    
    * If this doesn't happen you might need to check your boot log with `dmesg`.

1. Enable and start ZFS: `service zfs enable && service zfs start`
1. Disable SSH for root:
    * Add/uncomment `PermitRootLogin no` line in `/etc/ssh/sshd_config`
    * `service sshd restart`
1. Install `pkg`
    * `pkg help` (will prompt to install)
    * If pkg could not be installed then change url in `/etc/pkg/FreeBSD.conf` ([Docs](https://www.freebsd.org/doc/handbook/pkgng-intro.html))
1. Edit hostname in `/etc/rc.conf` 
1. Enable and start ~ntpd~ service to sync time
    * Add `ntpd_sync_on_start=YES` to `/etc/rc.conf`
 

## Users

1. Create new user and add to wheel group with `adduser`
1. Remove freebsd user `rmuser freebsd`
1. Change root password `passwd`


## ZFS pool

1. Find disks with `geom disk list`

    ```
    Geom name: ada0
    Providers:
    1. Name: ada0
       Mediasize: 4000787030016 (3.6T)
       Sectorsize: 512
       Stripesize: 4096
       Stripeoffset: 0
       Mode: r1w1e2
       descr: ST4000VN008-2DR166
       lunid: 5000c500c6ff3710
       ident: ZM41AR5R
       rotationrate: 5980
       fwsectors: 63
       fwheads: 16
    ```
    
    > If your disks have been used before you might want to delete partitions `gpart delete -i 2 ada0`. If partition table is invalid you might try to recover it with `gpart recover ada0`.

1. Find [ashift](https://openzfs.github.io/openzfs-docs/Project%20and%20Community/FAQ.html?highlight=ashift#advanced-format-disks) value to use:

    ```sh
    # For this disk we need ashift of 12 (2^12=4096). Default ashift value is 9 (2^9=512).
    $ diskinfo -v ada0 | grep stripesize
    4096   # stripesize
    ```

1. Create a mirror pool `zpool create -o ashift=12 -m /mnt/nas nas mirror /dev/diskid/DISK-ZM41AS6T /dev/diskid/...`
    * This will mount the *nas* pool under `/mnt/nas`
    * Note that we create a pool using disk IDs. This is to prevent disks from being mixed up in case you change how they are connected.
1. Enable compression on a pool `zfs set compression=zstd nas`


1. Create a dataset `zfs create nas/roman`
    * `zfs set quota=900G nas/roman` (Allow dataset to use only 900G)
    * `zfs set snapdir=visible nas/roman` (Show hidden `.zfs/snapshosts` dir)
   
1. Tune ZFS config *(optional)*
    * Use `/boot/loader.conf` to configure ZFS ([Available options](https://www.freebsd.org/doc/handbook/zfs-advanced.html))
    * E.g `vfs.zfs.arc_max="2G"`


### Regular snapshotting

Snapshots will be available under `.zfs` directory for each dataset.

1. Manual snapshot: 
    * Create `zfs snapshot -r nas/roman@2021-01-22` (This creates a recursive snapshot of `roman` and all descendant datasets)
    * Delete `zfs destroy nas/roman@2021-01-22`
1. Install [zfstools](https://www.freshports.org/sysutils/zfstools/) `pkg install zfstools`
1. Edit `/etc/crontab`

    ```sh
    15,30,45 * * * * root /usr/local/sbin/zfs-auto-snapshot frequent  4
    0        * * * * root /usr/local/sbin/zfs-auto-snapshot hourly   24
    7        0 * * * root /usr/local/sbin/zfs-auto-snapshot daily     7
    14       0 * * 7 root /usr/local/sbin/zfs-auto-snapshot weekly    4
    28       0 1 * * root /usr/local/sbin/zfs-auto-snapshot monthly  12
    ```
    
    > Ideally, you would use [periodic](https://www.freebsd.org/cgi/man.cgi?query=periodic&sektion=8&manpath=freebsd-release-ports) instead.

1. Enable regular snapshotting for all datasets: `zfs set com.sun:auto-snapshot=true nas`
1. List all snapshots and used space: `zfs list -rt all`
1. Rollback to snapshot: `zfs rollback nas/roman@2021-01-22`

I went with running everything from monit.

```
check program zfs-auto-snapshot-frequent with path "/usr/local/sbin/zfs-auto-snapshot frequent 4"
   if status != 0 then alert
   every "15,30,45 * * * *"
   group cron
```


### Scrubbing

Once in a while you want ZFS to go through your disks and verify that data blocks are not corrupted.

1. Edit `/etc/crontab`

    ```sh
    # Scrub ZFS pool once a month
    27       0 1 * * root zpool scrub nas
    ```
    

### Useful commands

| Description | Command |
| --- | --- |
| List pools and datasets | `zfs list` |
| Show pools/pool status | `zpool status [nas]` |
| List all snapshots | `zfs list -rt all` |
| Replace a disk | `zpool replace nas ada1 ada2` |
| Export a pool to be used on another device | `zpool export nas` |
| List pools available for import | `zpool import` |
| Import a pool | `zpool import -o altroot=/mnt nas` <br /> (will mount under `/mnt/nas`) |
| List pools that could use latest ZFS features | `zpool upgrade` |
| Upgrade a pool | `zpool upgrade nas` |
| View pool history | `zpool history [nas]` |
| Remove a pool or a dataset | `zfs destroy nas/roman` |
| Rename a dataset | `zfs rename nas/roman nas/bond` |
| List dataset properties | `zfs get all nas/roman` |
| Compare with a snapshot | `zfs diff nas/roman@2021-01-22` <br /> (Lists which files have been changed/added/removed) |
  

## Share ZFS pool with Samba

1. Install samba `pkg install samba413`
1. Add config to `/usr/local/etc/smb4.conf`

    ```ini
    [global]
    workgroup = HOMENAS
    
    [roman]
    comment = PublicRoman
    path = /mnt/nas/roman
    public = no
    writeable = yes
    write list = @public
    directory mask = 0770
    create mask = 0770
    ```

1. `service samba_server enable && service samba_server start`
1. Add group `pw groupadd public`
1. Add user to group `pw groupmod public -M freebsd`
1. Set SMB password for user `smbpasswd -a freebsd`
1. Chown the ZFS dataset so that user has access to it
1. On Windows:
    * Right click in File Explorer and select *"Add a network location"*
    * Custom location: `\\192.168.1.123\roman`
    * Use freebsd user and SMB password configured above


## Monitoring and email alerting

I decided to go with [monit](https://www.mmonit.com/monit/) for monitoring and alerting.

1. `pkg install monit`
1. Copy sample configuration `cp /usr/local/etc/monitrc.sample /usr/local/etc/monitrc`
1. `service monit enable && service monit start`
1. Check that config is correct `monit -t`
1. Reload config `monit reload`
1. View summary in the terminal `monit summary`
1. View summary in the browser http://localhost:2812 (default credentials admin/monit)

Sample script to check for CPU temperature:

```sh
#!/usr/bin/env sh

set -e

# Check CPU temperature (located: /etc/monit/scripts/cpu-temp.sh)

TEMP=`sysctl -n hw.temperature.CPU`
echo $TEMP
VALUE=`echo $TEMP | cut -c1-2`
exit $VALUE
```

Then you can set up an alert in monit that will check for the exit code. It will alert if temperature is higher than 60 degrees. 
Notice that we also print to the stdout so that monit could show that value in the web UI.

```
# CPU temperature
check program CPU-temp with path "/etc/monit/scripts/cpu-temp.sh"
   if status > 60 then alert
   if status < 10 then alert
   group temperature
```

![CPU alerting example](/images/monit-cpu-example.png)

> If you use monit to run cron tasks then set
> `set daemon  35   # check services at 35 seconds intervals`
> so that cron tasks could run once at a specific minute.


### Temperatures

* Board temperature `sysctl hw.temperature` or `sysctl -a | grep temp`
* HDD temperatures:
    * `pkg install smartmontools`
    * Verify is supported `smartctl -i /dev/ada0` (Should have `SMART support is: Enabled`)
    * `smartctl -A /dev/ada0 | grep -i temperature`


## ZeroTier

Access your NAS from anywhere without exposing it to the public internet.

1. Install `pkg install zerotier`
1. Enable and start `zerotier` service
1. Connect `zerotier-cli join [network-id]`
1. Accept this device in [the web interface](https://my.zerotier.com/network)


## References

* [FreeBSD Handbook](https://www.freebsd.org/doc/en_US.ISO8859-1/books/handbook/index.html)
* [ZFS ashift](https://www.freebsd.org/doc/handbook/zfs-advanced.html)
* [Resize partitions](https://www.freebsd.org/doc/handbook/disks-growing.html)
* [ZFS admin](https://www.freebsd.org/doc/handbook/zfs-zfs.html)
* [Power management](https://vermaden.wordpress.com/2018/11/28/the-power-to-serve-freebsd-power-management/)
* [FreeBSD Samba](https://www.freebsd.org/doc/en_US.ISO8859-1/books/handbook/network-samba.html)
* [ArchWiki SMB](https://wiki.archlinux.org/index.php/ZFS#SMB)
* [Samba config](http://www.freebsdwiki.net/index.php/Samba%2C_Configuration)
* [Monit manual](https://www.mmonit.com/monit/documentation/monit.html)
