+++
author = "Roman Zaynetdinov"
date = 2021-04-25T12:00:00+03:00
title = "Trying out helloSystem on rockpro64"
+++

## Preparing the image

* Download FreeBSD 13 for the board: [https://www.freebsd.org/where/](https://www.freebsd.org/where/)
* Burn the image onto micro SD card (Use Balena Etcher or Disk Image Writer in Gnome)
* Place the card into the board and power it up
* Wait for some time. It might take a while for the OS to start booting. There should a while LED indicator once FreeBSD is starting to boot.
* Default FreeBSD credentials *freebsd / freebsd* and *root / root*

## Configure the system

From now on this guide mostly follows [the official one for the raspberry pi](https://hellosystem.github.io/docs/developer/rpi).

Log into the system with root and run the script:

```sh
#!/bin/sh

set -e

uzip=

echo "Installing dependencies..."
pkg install -y xorg xterm nano openbox curl

pkg install -y -U git-lite cmake pkgconf qt5-qmake qt5-buildtools qt5-concurrent qt5-quickcontrols qt5-quickcontrols2 kf5-kdbusaddons kf5-kwindowsystem libdbusmenu-qt5

if [ -e "/usr/local/bin/launch" ]; then
  echo "launch is already installed."
else
  echo "Installing launch..."
  rm -r launch || true
  git clone https://github.com/helloSystem/launch
  mkdir -p launch/build
  cd launch/build/
  cmake ..
  make -j4
  #./launch
  make install
  cd ../../
fi

if [ -e "/usr/local/bin/Menu" ]; then
  echo "Menu is already installed."
else
  echo "Installing Menu..."
  rm -r Menu || true
  git clone https://github.com/helloSystem/Menu
  mkdir -p Menu/build
  cd Menu/build
  cmake ..
  make -j4
  make install
  ln -s /usr/local/bin/menubar /usr/local/bin/Menu # Workaround for the 'launch' command to find it
  cd ../../
fi

if [ -e "/usr/local/bin/Filer" ]; then
  echo "Filer is already installed."
else
  echo "Installing Filer..."
  rm -r Filer || true
  git clone https://github.com/helloSystem/Filer
  mkdir -p Filer/build
  cd Filer/build/
  pkg install -y -U libfm
  cmake ..
  make -j4
  make install
  ln -s /usr/local/bin/filer-qt /usr/local/bin/Filer # Workaround for the 'launch' command to find it
  cd ../../
fi

if [ -e "/usr/local/bin/Dock" ]; then
  echo "Dock is already installed."
else
  echo "Installing Dock..."
  rm -r Dock || true
  git clone https://github.com/helloSystem/Dock
  mkdir -p Dock/build
  cd Dock/build
  cmake ..
  make -j4
  make install
  ln -s /usr/bin/cyber-dock /usr/local/bin/Dock 
  cd ../../
fi

if [ -e "/usr/local/etc/xdg/stylesheet.qss" ]; then
  echo "QtPlugin is already installed."
else
  echo "Installing QtPlugin..."
  rm -r QtPlugin || true
  git clone https://github.com/helloSystem/QtPlugin
  mkdir -p QtPlugin/build
  cd QtPlugin/build/
  pkg install -y -U libqtxdg
  cmake ..
  make -j4
  make install
  cp ../stylesheet.qss /usr/local/etc/xdg/
  cd ../../
fi

if [ -d "/usr/local/share/icons/elementary-xfce" ]; then
  echo "System icons are already installed."
else
  echo "Installing system icons..."
  pkg install -y -U wget
  wget -c -q http://archive.ubuntu.com/ubuntu/pool/universe/x/xubuntu-artwork/xubuntu-icon-theme_16.04.2_all.deb
  tar xf xubuntu-icon-theme_16.04.2_all.deb
  tar xf data.tar.xz
  mkdir -p "${uzip}"/usr/local/share/icons/
  mv ./usr/share/icons/elementary-xfce "${uzip}"/usr/local/share/icons/
  mv ./usr/share/doc/xubuntu-icon-theme/copyright "${uzip}"/usr/local/share/icons/elementary-xfce/
  sed -i -e 's|usr/share|usr/local/share|g' "${uzip}"/usr/local/share/icons/elementary-xfce/copyright
  rm "${uzip}"/usr/local/share/icons/elementary-xfce/copyright-e
fi

if [ -e "/usr/local/share/fonts/TTF/C059-Roman.ttf" ]; then
  echo "System fonts are already installed."
else
  echo "Installing system fonts..."
  wget -c -q https://github.com/ArtifexSoftware/urw-base35-fonts/archive/20200910.zip
  unzip -q 20200910.zip
  mkdir -p "${uzip}/usr/local/share/fonts/TTF/"
  cp -R urw-base35-fonts-20200910/fonts/*.ttf "${uzip}/usr/local/share/fonts/TTF/"
  rm -rf urw-base35-fonts-20200910/ 20200910.zip
fi


wget "https://raw.githubusercontent.com/helloSystem/hello/master/branding/computer-hello.png" -O "${uzip}"/usr/local/share/icons/elementary-xfce/devices/128/computer-hello.png

url="https://raw.githubusercontent.com/helloSystem/ISO/experimental/settings/packages.hello"
echo "Fetching packages from $url..."

# Install all uncommented packages
curl -fsS $url | egrep -v '^#' | while read line ; do
  echo "Installing: $line..."
  pkg install -y -U $line || echo "[error] $line cannot be installed"
done

echo "Enabling automount..."
service devd restart

if [ -d "ISO" ]; then
  echo "Overlays are already installed."
else
  echo "Installing overlays..."
  git clone https://github.com/helloSystem/ISO
  cp -Rfv ISO/overlays/uzip/hello/files/ /
  cp -Rfv ISO/overlays/uzip/localize/files/ /
  cp -Rfv ISO/overlays/uzip/openbox-theme/files/ /
  cp -Rfv ISO/overlays/uzip/mountarchive/files/ /
fi

echo "Enabling dbus and avahi..."
service dbus enable
service dbus start
service avahi-daemon enable
service avahi-daemon start

echo "Dependencies installed."
```


Save this script to `/usr/local/bin/start-hello` or other directory in the PATH: [start-hello script](https://nopaste.ml/#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)

Unfortunately, I couldn't run helloSystem Xorg session so I had to install fluxbox and run though it.

```sh
setenv QT_QPA_PLATFORMTHEME panda
pkg install -y fluxbox
echo startfluxbox > ~/.xinitrc
startx

# Then open an xterm with right-mouse click and run
start-hello
```

{{ responsive_img(path="post/hellosystem-rockpro64/helloSystem-rockpro64.png" alt="helloSystem on rockpro64") }}


### Changes from the original guide

* Install curl 
* Install git before installing launch
* Not starting launch when building it
* Install qt5-concurrent, qt5-quickcontrols, qt5-quickcontrols2
* Copy stylesheet.qss from parent directory
* Symlink cyber-dock from /usr/bin/cyber-dock
* Had to install fluxbox and run start-hello from that session
* `setenv QT_QPA_PLATFORMTHEME panda` before running the Xorg
* Set uzip variable


## Misc

### Taking a screenshot

```
pkg install -y scrot
scrot screenshot.png
```
