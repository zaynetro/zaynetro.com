+++
author = "Roman Zaynetdinov"
date = 2022-05-17T09:00:00+03:00
title = "Missing plugins on Fedora 36 when running podman-compose"
+++

After updating to Fedora Silverblue 36 I couldn't run my podman containers with podman-compose. There were strange warnings about missing plugins:

```
Error validating CNI config file /etc/cni/net.d/87-podman.conflist: 
  [failed to find plugin \"bridge\" in path [...]
```

> Note that the error might mention different plugin names: bridge, portmap, firewall, tuning, dnsname.

podman-compose creates a network configuration and puts it under `~/.config/cni/net.d/` directory. That config file lists all the plugins that it needs. Plugins are apparently not included by default?

I had to install [containernetworking-plugins](https://packages.fedoraproject.org/pkgs/containernetworking-plugins/containernetworking-plugins/) package for podman to my network to start working.

There is also [podman-plugins](https://packages.fedoraproject.org/pkgs/podman/podman-plugins/) package that I have installed but I am not sure if it was needed.
