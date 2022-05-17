+++
author = "Roman Zaynetdinov"
date = 2021-01-19T12:00:00+03:00
title = "Follow RockPro64 boot process through serial connection"
draft = false
+++

Serial console device could be used to observe boot process from early stages. This becomes handy especially when you don't have an HDMI output available.

## RockPro64

{{ responsive_img(path="post/uart-rockpro64/rockpro64.jpg" alt="RockPro64 board") }}

Next to each GPIO pin there is a number. Connect *GND* to pin 6, *TXD* to pin 8 and *RXD* to pin 10. Configure serial device to run in *3.3V* mode.

> **Note:** In some cases the board will not boot if RXD is connected. Therefore connect it after the device is booted. 

The serial console runs on 1,500,000 baud rate in the bootloader. On Linux you can use `picocom` to connect to the device.

```sh
sudo picocom /dev/ttyUSB0 -b 1500000
```

## References

* [https://forum.pine64.org/showthread.php?tid=6387](https://forum.pine64.org/showthread.php?tid=6387) 
* [https://nixos.wiki/wiki/NixOS_on_ARM/PINE64_ROCKPro64](https://nixos.wiki/wiki/NixOS_on_ARM/PINE64_ROCKPro64)
* [https://pine64.com/product/serial-console-woodpecker-edition/?v=0446c16e2e66](https://pine64.com/product/serial-console-woodpecker-edition/)
* [https://en.wikipedia.org/wiki/Universal_asynchronous_receiver-transmitter](https://en.wikipedia.org/wiki/Universal_asynchronous_receiver-transmitter)
