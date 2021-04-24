+++
author = "Roman Zaynetdinov"
date = 2021-04-24T12:00:00+03:00
title = "Set up TrueNAS"
+++

I decided to give up my attempts with configuring NAS on rockpro64 and just go with an existing solution: TrueNAS. This involved buying more convential hardware but that is a boring story.


## Basic configuration

* Change root user password
* Set date/time format and timezone in System -> General
* Configure SMTP authentication in System -> General
    * For my mailbox.org server use: `smtp.mailbox.org:465` and *SSL (Implicit SSL)* security
* Add a new encrypted pool. Use *Encryption type = Key*
    > TrueNAS will automatically decrypt pool on boot with key encryption type. The key is stored on the device. Use passphase encryption for sensitive datasets. 
    > Those datasets will need to be manually decrypted with a passphrase after every reboot.
* Create a dataset for each future user you plan to create.
* Create users:
    * Choose dataset directory you created in the previous step as Home directory
    * Set shell to nologin
    * Enable Samba authententication
* Create Samba shares in Sharing -> Windows Shares (SMB)
    * Select user's home directory
    * Edit ACLs -> Select a restricted preset
    * Use permissions editor for simpler ACL config
* Set up periodic snapshot tasks
    * A monthly task that keeps snapshots for one year
    * A weekly task that keeps snapshots for four weeks
    * A daily task that keeps snapshots for seven days
    * An hourly task that keeps snapshots for one day
* Set up SMART test. Choose Short type.


## Import data from NTFS device

I have an external HDD that I wanted to import data from. You can easily do this from Storage -> Import Disk but this will import everything from your disk into specified directory. 

I wanted to copy only some directories so had to do this process manually.

```sh
# Load fuse Kernel module
kldload fuse

# Find your device 
geom disk list
# Find your partition
geom show da0

# Mount the device to /media in read-only mode
ntfs-3g /dev/da0s1 /media -o ro

# Copy all files from /media/photos/* into /mnt/roman/photos directory
# Notice the tailing slash. It is important to have it otherwise rsync
# will copy the directory and not just the files inside of it.
rsync /media/photos/ /mnt/roman/photos

# Unmount the device
umount /dev/da0s1
```


## Tailscale

I want to be able to access my NAS from outside of home network. ZeroTier and Tailscale seem to suit my use case. I have decided to give Tailscale a go this time.

TrueNAS doesn't want you to modifying the system by installing the packages. I couldn't find a decent way on how to install Tailscale in a jail which everybody recommends. I simply don't know enough about FreeBSD and jails to configure it correctly. So I decided to just install a Tailscale binary with pkg on the host.


TrueNAS resets many directories on reboot so I had to create a script that would configure Tailscale each time server starts. My `nas` pool is mounted in `/mnt/nas`.

* Prepare a directory `mkdir -p /mnt/nas/custom/tailscale`
* Link directory `ln -s /mnt/nas/custom/tailscale /var/db/tailscale`
* Install tailscale

    ```sh
    sed -i .orig 's/enabled: yes/enabled: no/' /usr/local/etc/pkg/repos/local.conf
    sed -i .orig 's/enabled: no/enabled: yes/' /usr/local/etc/pkg/repos/FreeBSD.conf
    pkg update
    pkg install -y tailscale
    ```
* Log in `tailscale up`. This is an interactive process so should be done manually once.

* Store [tailscale rc.d](https://svnweb.freebsd.org/ports/head/security/tailscale/files/tailscaled.in?view=markup) in `/mnt/nas/custom/tailscaled.service`
    * I had to replace `%%PREFIX%%` with `/usr/local` though
* Create a setup script `/mnt/nas/custom/setup-tailscale.sh`:
    ```sh
    #!/usr/bin/env sh
    
    set -e
    
    echo "Setting up Tailscale..."
    
    ln -s /mnt/nas/custom/tailscale /var/db/tailscale
    cp /mnt/nas/custom/tailscaled.service /usr/local/etc/rc.d/tailscaled
    chmod +x /usr/local/etc/rc.d/tailscaled
    
    echo "Starting tailscaled service..."
    service tailscaled onestart
    sleep 1
    
    echo "Connecting to tailscale..."
    tailscale up --advertise-exit-node
    # Or if you don't want exit node support
    # tailscale up 
    
    echo "Done."
    ```

* Make script executable `chmod +x /mnt/nas/custom/setup-tailscale.sh`
* Tasks -> Init/Shutdown Scripts: Add a new task that would run the setup script on *Post Init*
* Reboot and verify that TrueNAS connects to Tailscale network automatically.

In a nutshell we persist tailscale database and rc.d script elsewhere since TrueNAS will override the directories.


## Debug rc.d scripts

During my setup process I have struggled to run Tailscale in a service. To help you debug the issues add these lines to `/etc/rc.conf`:

```
rc_info="YES"
rc_debug="YES"
tailscaled_syslog_output_enable="YES"
```

and then watch the logs in `/var/log/messages`.


## References

* [https://kevin.deldycke.com/2020/10/truenas-configuration/](https://kevin.deldycke.com/2020/10/truenas-configuration/)
* [https://tailscale.com/kb/1097/install-opnsense/](https://tailscale.com/kb/1097/install-opnsense/)
* [https://kflu.github.io/2018/02/03/2018-02-03-freebsd-ntfs/](https://kflu.github.io/2018/02/03/2018-02-03-freebsd-ntfs/)
