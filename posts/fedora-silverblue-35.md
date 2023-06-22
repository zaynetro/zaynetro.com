+++
author = "Roman Zaynetdinov"
date = "2022-01-10T12:00:00+03:00"
title = "Trying out Fedora Silverblue 35"
+++

## Installation

I've just learned about [Fedora Silverblue](https://silverblue.fedoraproject.org). It's website doesn't really do a great job at explaining what this project really is. A quote from Fedora Magazine helps a bit:

> Silverblue is a codename for the new generation of the desktop operating system, previously known as Atomic Workstation. The operating system is delivered in images that are created by utilizing the [rpm-ostree](https://coreos.github.io/rpm-ostree/) project. The main benefits of the system are speed, security, atomic updates and immutability. 

The installation was super easy. I just downloaded the ISO file and attached it to my VM. There is a graphical installer that has only a few steps. Disk encryption worked without a hiccup.


## Configuration

With Silverblue you can install tools globally with Flatpak or with `rpm-ostree`. 

### Flathub

Set up Flathub by going to [flatpack/Fedora](https://flatpak.org/setup/Fedora/) and clicking on a "Flathub repository file" button. Now you should be able to find applications from Flathub using "Software" application.

### rpm-ostree

[rpm-ostree](https://coreos.github.io/rpm-ostree/administrator-handbook/) is used to update the system but also to install overlay packages globally.

```sh
$ rpm-ostree install golang neovim emacs fish
```

The changes will be applied **only after a system reboot**. Luckily, there seems to be an exprimental way to apply [the changes immediately](https://techoverflow.net/2021/05/15/how-to-apply-fedora-coreos-changes-without-a-reboot/):

```sh
$ sudo rpm-ostree ex apply-live
```

> I used [packages](https://packages.fedoraproject.org/) for the search. Maybe there is a better way 🤔.

### Toolbox

[Toolbx](https://containertoolbx.org/) is a container which could be used for exprimentation and installing packages without affecting the system.

```sh
# Start a container
$ toolbox

# Inside toolbox you can use dnf to install packages
$ dnf install java-11-openjdk
```

> All packages that you install inside toolbox are not available to the system globally.

```sh
# List local toolboxes
$ toobox list
```

### Modules

By default dnf and rpm-ostree install the latest version of the package. In some cases I want to install an older version of the package. It is possible by using [modules](https://docs.fedoraproject.org/en-US/modularity/installing-modules/).

```sh
$ toolbox

# List available modules
$ dnf module list

# Install the module
$ sudo dnf module install nodejs:14/default

$ node --version
v14.18.2
$ npm --version
6.14.15
```

rpm-ostree has [an experimental way](https://coreos.github.io/rpm-ostree/administrator-handbook/#modularity) to install modules globally. Unfortunately, it didn't work for me.

```sh
$ rpm-ostree ex module enable nodejs:14
```


## Misc

I couldn't get Peek to work but luckily there is a [Kooha](https://github.com/SeaDve/Kooha) for screen recording that just works!

You can change default shell with:

```sh
$ sudo usermod --shell /path/to/shell <user>
```


## Availability of software I use

*Table created on 2022-01-10*

| Name and Version | Availability on Fedora | Notes |
| ---------------- | ---------------------- | ------|
| Ansible:2.10 | [Ansible:2.9](https://packages.fedoraproject.org/pkgs/ansible/ansible/) and [Ansible core:2.11](https://packages.fedoraproject.org/pkgs/ansible-core/ansible-core/) | I don't fully understand the separation into ansible and ansible-core. Perhaps, ansible-core will be enough for me use case.
| Chromium | [Chromium](https://flathub.org/apps/details/org.chromium.Chromium) |
| Emacs:27 | [Emacs:27](https://packages.fedoraproject.org/pkgs/emacs/emacs/) |
| Firefox | [Firefox](https://flathub.org/apps/details/org.mozilla.firefox) comes installed |
| IDEA Community | [IDEA Community](https://flathub.org/apps/details/com.jetbrains.IntelliJ-IDEA-Community) |
| KeePassXC | [KeePassXC](https://flathub.org/apps/details/org.keepassxc.KeePassXC) |
| Virtual Box | Can try [Gnome Boxes](https://flathub.org/apps/details/org.gnome.Boxes) |
| Remmina | [Remmina](https://flathub.org/apps/details/org.remmina.Remmina) |
| Telegram | [Telegram](https://flathub.org/apps/details/org.telegram.desktop) |
| VLC | [VLC](https://flathub.org/apps/details/org.videolan.VLC) |
| aspell | [apell](https://packages.fedoraproject.org/pkgs/aspell/aspell/)
| aspell-en | [apell-en](https://packages.fedoraproject.org/pkgs/aspell-en/aspell-en/) |
| docker | [docker](https://developer.fedoraproject.org/tools/docker/about.html) | I'd like to switch to podman which comes preinstalled. |
| docker-compose | [docker-compose](https://developer.fedoraproject.org/tools/docker/compose.html) | Let's hope that podman and podman-compose can simply replace docker. |
| earlyoom | [earlyoom](https://packages.fedoraproject.org/pkgs/earlyoom/earlyoom/) | Install only if system starts to hang. |
| fd:8.3 | [fd:8.2](https://packages.fedoraproject.org/pkgs/rust-fd-find/fd-find/) |
| fish:3.3 | [fish:3.3](https://packages.fedoraproject.org/pkgs/fish/fish/) |
| go:1.17 | [go:1.16](https://packages.fedoraproject.org/pkgs/golang/golang/) | I don't need 1.17. |
| OpenJDK 11 | [OpenJDK 11](https://packages.fedoraproject.org/pkgs/java-11-openjdk/java-11-openjdk-devel/) |
| neovim:0.6 | [neovim:0.6](https://packages.fedoraproject.org/pkgs/neovim/neovim/) |
| nginx | [nginx](https://packages.fedoraproject.org/pkgs/nginx/nginx/) |
| Node 14 | Install a [Node 14 module](https://developer.fedoraproject.org/tech/languages/nodejs/nodejs.html) | Comes with NPM 6.
| maven:3 | [maven 3](https://packages.fedoraproject.org/pkgs/maven/maven/) |
| packer | [Install it from official repo](https://learn.hashicorp.com/tutorials/packer/get-started-install-cli) | 
| Python 3 | Comes preinstalled |
| rustup | [rust:1.57](https://packages.fedoraproject.org/pkgs/rust/rust/) and [cargo](https://packages.fedoraproject.org/pkgs/rust/cargo/) |
| Slack | [Slack](https://flathub.org/apps/details/com.slack.Slack) |
| Syncthing GTK | [Syncthing GTK](https://flathub.org/apps/details/me.kozec.syncthingtk) |
| sqlite 3 | [sqlite 3](https://packages.fedoraproject.org/pkgs/sqlite/sqlite/) |
| terraform | [Install it from official repo](https://learn.hashicorp.com/tutorials/terraform/install-cli) | Looks the same as for packer |
| tig | [tig](https://packages.fedoraproject.org/pkgs/tig/tig/) |
| tree | [tree](https://packages.fedoraproject.org/pkgs/tree/tree/) |
| zola:0.14 | [zola:0.12](https://packages.fedoraproject.org/pkgs/zola/zola/) | This is a bit outdated.

This website helps with finding the right packages for developer tools: [https://developer.fedoraproject.org/tech.html](https://developer.fedoraproject.org/tech.html)

I probably don't need to install all those tools globally. I should try scoping them with the toolbx.
