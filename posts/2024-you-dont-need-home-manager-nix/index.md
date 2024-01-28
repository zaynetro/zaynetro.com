+++
author = "Roman Zaynetdinov"
date = "2024-01-28T12:00:00+03:00"
title = "You may not need a Home Manager"
description = "Do you manage your home environment with Home Manager? In this post I will try to show you the alternatives which might be simpler."
draft = false

[extra]
preview_image = { href = "nix-community.png", alt = "Nix community logo" }
+++

Do you manage your home environment with Home Manager? Have you ever wondered why every Nix tutorial suggests using it instead of managing config files yourself? In this post I will try to show you the alternative way and maybe teach you a bit about Nix flakes.

> I am by no means a Nix expert. This blog post is just me documenting my personal experiences and things that I've learned.

> If you are new to Nix language you might like my <a href="/explainix" target="_blank">Explainix</a> guide. It introduces you to the language.

## My Nix history

I've started using Nix a long time ago as a package manager on my mac. Before that I used homebrew but once in a while I've had weird problems with it. I gave Nix a spin and things just worked.

Nix was just a package manager for me with a weird interface. I couldn't remember how to search, install or uninstall packages. It got so frustrating that I had to write a [helper bash script](https://github.com/zaynetro/dotfiles/blob/master/bash/nix-rz.sh) just for that.

The overall complexity and scattered documentation discouraged me into going deeper into the Nix ecosystem. 

For a couple of years I switched to Fedora Silverblue and used rpm for package management but eventually I've returned to Nix. This time I decided to use declarative configuration management for my home. After browsing the web everybody suggested [Home Manager](https://github.com/nix-community/home-manager) so I went straight ahead with it.

Home Manager allows three different installation methods:

1. Standalone installation
2. NixOS module
3. nix-darwin module

I wasn't on NixOS nor I had nix-darwin installed. Following (1) required too many steps so I decided to skip this section for now and continued reading the manual. Then suddenly I noticed a familiar word that I saw in numerous blog posts: "flakes". It was too tempting not to try using newest cool tech so I've embraced myself and decided to give it a go...

Days later I had a working home manager configuration that installed the packages I needed. That wasn't too bad but still not newbie-friendly. That setup served me for some time but eventually I realized that I wanted to get rid of my bash scripts for managing dotfiles and do everything with Home Manager. Since my flake was already configured it didn't take long until I had my fish and git configurations there as well.

> Home Manager stores your configuration files in the Nix store and links to the store from your HOME directory. (More on this later)


## Let's talk about Nix flakes

Nix flake is a pure function that accepts inputs and produces an output. An output is usually a directory in the Nix store that holds files. Users can install those directories (create a new Nix profile that will link to installed binary) or run binaries from directories without adding them to the PATH.

> This is probably the worst flake description but I just want to highlight how I use flakes and what they are for me.

> This blog posts assumes you have configured Nix to use experimental features.
> ```
> > cat .config/nix/nix.conf 
> experimental-features = nix-command flakes
> ```

```nix
# flake.nix
{
  description = "An example";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.05";
  };

  outputs = { self, nixpkgs }:
    {
      packages.aarch64-darwin.default = nixpkgs.legacyPackages.aarch64-darwin.hello;
    };
}
```

In this short example we do two things:

1. Specify our inputs: Refer to the [nixpkgs repo](https://github.com/nixos/nixpkgs/tree/nixos-23.05) with a `flake.nix` file.
2. Return an object with a default package for `aarch64-darwin` system.

> P.S if you are curious, there is a list of [all available outputs](https://nixos.wiki/wiki/Flakes#Output_schema).

OK. I guess this makes sense. But how do we use it?

```
> nix build
> tree
.
├── flake.lock
├── flake.nix
└── result -> /nix/store/mcscvaclw240f7gp6x9n2kk90hwm7adi-hello-2.12.1

> tree result/
result/
├── bin
│   └── hello
└── share
    ├── info
    │   └── hello.info
    └── man
        └── man1
            └── hello.1.gz
```

So the flake built us a directory with `hello` package in the Nix store and linked to it from the current directory.

Let's dive deeper. What if we want to build multiple packages?

```nix
{
  description = "An example";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.05";
  };

  outputs = { self, nixpkgs }:
    let
      system = "aarch64-darwin";
      pkgs = nixpkgs.legacyPackages.${system};

    in
    {
      packages.${system}.default = pkgs.symlinkJoin {
        name = "my-packages";
        paths = [ pkgs.hello pkgs.cowsay ];
      };

      # Format with `nix fmt`
      formatter.${system} = pkgs.nixpkgs-fmt;
    };
}

```

Now we have a bit more going on. We define a couple of variables to make the definition cleaner. What is `pkgs.symlinkJoin`? In fact, it is a [trivial builder](https://ryantm.github.io/nixpkgs/builders/trivial-builders/#trivial-builder-symlinkJoin).

> This can be used to put many derivations into the same directory structure. It works by creating a new derivation and adding symlinks to each of the paths listed.

Let me try to explain. `packages.${system}.default` expects a derivation value. A derivation is a function that builds a directory. So we can't just assign an array of two packages to it. We have to merge them.

```
> tree result/
result/
├── bin
│   ├── cowsay -> /nix/store/r9z15rizldy3danm0zj1mnzkw129mw6c-cowsay-3.7.0/bin/cowsay
│   ├── cowthink -> cowsay
│   └── hello -> /nix/store/mcscvaclw240f7gp6x9n2kk90hwm7adi-hello-2.12.1/bin/hello
└── share
...
```

This all looks cool but how is it useful for package managers? Enter Nix profiles.


## Nix profiles

> A Nix profile is a set of packages that can be installed and upgraded independently from each other. Nix profiles are versioned, allowing them to be rolled back easily.

This definition is too generic. Let's explore what actually happens. 

```
> ls -lA ~/.nix-profile
lrwxr-xr-x  1 roman  staff  44 Jan 16  2023 .nix-profile@ -> /nix/var/nix/profiles/per-user/roman/profile

> ls -l /nix/var/nix/profiles/per-user/roman/
lrwxr-xr-x  1 roman  wheel  15 Oct 26 14:07 profile@ -> profile-66-link
lrwxr-xr-x  1 roman  wheel  51 Oct 26 14:07 profile-66-link@ -> /nix/store/ya6dzj8nfxff9r4ydc97ykm1595nhavs-profile
...
```

Nix has created a `.nix-profile` link in my HOME dir which points to another link which actually points to the currently active profile. In my case I am on version 66.

```
> tree /nix/var/nix/profiles/per-user/roman/profile-66-link/
/nix/var/nix/profiles/per-user/roman/profile-66-link/
├── Applications -> /nix/store/v36xvyap0pbxp678ff5f8wlpw08yvjps-home-manager-path/Applications
├── bin
│   ├── apropos -> /nix/store/v36xvyap0pbxp678ff5f8wlpw08yvjps-home-manager-path/bin/apropos
│   ├── hello -> /nix/store/2nsd0qwv17v6shhhmknyrpscjsa0p78r-hello-2.12.1/bin/hello
│   └── home-manager -> /nix/store/v36xvyap0pbxp678ff5f8wlpw08yvjps-home-manager-path/bin/home-manager
├── etc -> /nix/store/v36xvyap0pbxp678ff5f8wlpw08yvjps-home-manager-path/etc
├── manifest.json
└── share
...
```

Since I use home manager most of the files are links to the home manager environment but I did install a `hello` package into this profile using Nix CLI. How did I do that?

`nix profile install nixpkgs#hello` will install the package into a new profile.

> You can use binaries from your profile globally if you add `~/.nix-profile/bin` to your PATH. This is something that Nix installation script should do by default.

```
> nix profile history
...
Version 68 (2023-10-27) <- 67:
  flake:nixpkgs#legacyPackages.aarch64-darwin.hello: ∅ -> 2.12.1
  
> nix profile diff-closures
...
Version 67 -> 68:
  hello: ∅ → 2.12.1, +110.8 KiB
  profile: +133.9 KiB
```

New Nix CLI is actually very user-friendly and helpful. After installing a new package you can see exactly what happened to your profile.

`nix profile` has everything you need to manage packages imperatively for your system. For all profile operations I encourage you to check the [official docs](https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-profile).

> If you used `nix-env` then `nix profile` will not work as they create [incompatible profiles](https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-profile#profile-compatibility).


## Interlude

Now let's take some time off learning new things and complain a bit.

Nix builtins provide a [`readFileType` function](https://nixos.org/manual/nix/stable/language/builtins.html#builtins-readFileType). But somehow it is not found in flakes. `readFile` works though `¯\_(ツ)_/¯`.

> error: attribute 'readFileType' missing

What is the difference between `symlinkJoin` or `buildEnv`? I have used the former because I found it first. The latter is used in the examples in the official manual though.


## Declarative package management 

At this point of time you might ask how everything we learned so far is useful. How do we define our packages declaratively?

There is one useful command: `nix profile install`. Remember the flake example we created earlier? We used `nix build` to build it in the current directory. `nix profile install` is the same but it will install your packages into a new profile.

```
> nix profile install .

> nix profile diff-closures
...
Version 69 -> 70:
  cowsay: ∅ → 3.7.0, +54.5 KiB
  hello: ∅ → 2.12.1, +110.8 KiB
  my: ∅ → ε, +18.3 KiB
  profile: +134.6 KiB

> type cowsay
cowsay is /Users/roman/.nix-profile/bin/cowsay
```

I hope it all fits together. Now we can use our flake for declarative package management.

How do we modify the list of packages? If we try to install it again then Nix will fail due to conflicting binary names. In fact, we only need to install our flake once. All further changes to the flake would need to be applied with `nix profile upgrade 1`. Nix knows where flake source is located and will rebuild it. The flake doesn't even need to be present locally. You can install remote flakes. That's how we were able to install a `hello` package.

> You can find the correct index using `nix profile list`. Yes, you have to refer to your set of packages with a number.

That's about it. A simple flake and new Nix CLI is everything you need.

Let's take a look at a more complex example:

```nix
{
  description = "Manage installed packages";

  inputs = {
    # Common flake utilities
    flake-utils.url = "github:numtide/flake-utils";

    # Our package sources. I want some packages from a stable release and some to up-to-date.
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.05";
    nixpkgs-unstable.url = "github:NixOS/nixpkgs/nixos-unstable";

    # It could be that we need to install a specific version of a package.
    # Some package definitions let you pick the right version.
    # See `nodejs` for example: https://search.nixos.org/packages?channel=23.05&query=nodejs
    # You can pick `nodejs_20`, `nodejs_18` or `nodejs_16`.
    # This is very helpful but sometimes not enough.
    # You can use https://www.nixhub.io/ to find the commit reference that introduced the version.
    nixpkgs-go-1_19.url = "github:NixOS/nixpkgs/8ba120420fbdd9bd35b3a5366fa0206d8c99ade3";
  };

  outputs = { self, flake-utils, nixpkgs, nixpkgs-unstable, nixpkgs-go-1_19, ... }:
    # In previous flakes we hardcoded the current system. flake-utils exports a
    # function that lets us define our packages for all systems.
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        pkgs-unstable = nixpkgs-unstable.legacyPackages.${system};

        # Define the list of packages we want to be present on the system here.
        deps = [
          # Install hello from a stable release
          pkgs.hello
          # Install ponysay from an unstable release
          pkgs-unstable.ponysay
          # Install go v1.19.1 from a pinned commit (latest version is v1.19.13)
          nixpkgs-go-1_19.legacyPackages.${system}.go_1_19
        ];

      in
      {
        # Combine all packages together to return a single derivation.
        # Install locally with `nix profile install .`
        packages.default = pkgs.symlinkJoin {
          name = "my-packages";
          paths = deps;
        };

        # Let's say you want your collegue to run the project but they don't want
        # to install anything globally.
        # `nix develop` let's you start a new shell with all the packages present
        # in the environment.
        devShells.default = pkgs.mkShell {
          buildInputs = deps;
        };

        # Format with `nix fmt`
        formatter = pkgs.nixpkgs-fmt;
      }
    );
}
```

Now we can check that all of our packages are available.

```
> nix develop

nixflakes roman$ go version
go version go1.19.1 darwin/arm64

nixflakes roman$ hello
Hello, world!

nixflakes roman$ ponysay
ponysay — cowsay reimplemention for ponies
...
```

This is how you can manage packages in your home environment without home manager. After removing comments from the flake it becomes very readable. You also don't need to have a single flake for all of your packages.


## Declarative management of dotfiles

Well, home manager is more than just a list of packages to install. It also lets you manage your dotfiles.

```
> ls -l ~/.config/fish/
lrwxr-xr-x  1 roman  staff    87 Oct 23 11:12 config.fish@ -> /nix/store/qvv8g0xxmn3fjk4fixaqglnd1vfc09s6-home-manager-files/.config/fish/config.fish

> tree -a /nix/store/qvv8g0xxmn3fjk4fixaqglnd1vfc09s6-home-manager-files/
/nix/store/qvv8g0xxmn3fjk4fixaqglnd1vfc09s6-home-manager-files/
├── .config
│   ├── fish
│   │   └── config.fish -> /nix/store/bj4b2z7c04qad3v01smkrdbmi3n4h4s2-config.fish
│   ├── git
│   │   └── config -> /nix/store/grjcpb192vpx0dcmh2f2gxlkkxamcp5j-hm_gitconfig
│   └── kitty
│       └── kitty.conf -> /nix/store/6hws9frrx71rwhpq2kfs1jhhgf2gjlyg-hm_kittykitty.conf
└── .local
    └── share
        └── fish
            └── home-manager_generated_completions -> /nix/store/mw4x8glkay1gwwckn3i0xfvq6wc7r0cy-roman-fish-completions
```

Home manager is able to create links in the HOME to point to the Nix store where files are stored. Let's try to reproduce this solution with flakes.

```nix
{
  description = "Manage dotfiles";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.05";
  };

  outputs = { self, flake-utils, nixpkgs, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        fishConfig = pkgs.writeTextFile {
          name = "myconfig.fish";
          destination = "/.config/fish/myconfig.fish";
          text = builtins.readFile ./myconfig.fish;
        };

      in
      {
        packages.default = pkgs.symlinkJoin {
          name = "my-config";
          paths = [ fishConfig ];
        };

        formatter = pkgs.nixpkgs-fmt;
      }
    );
}
```

We read our `./myconfig.fish` file from the repo and store it in the Nix store under `.config/fish/myconfig.fish` path. Then our default output is a merge of all configuration files.

> `./myconfig.fish` must be checked into Git index otherwise Nix will ignore it and complain that it is not found.

```
> nix build
> tree -a result/
result/
└── .config
    └── fish
        └── myconfig.fish -> /nix/store/0jzf58ikfrym21l2rl1y83qcgcy1b0xj-myconfig.fish/.config/fish/myconfig.fish
```

OK this moves us forward. Let's try to create a link to our HOME directory.

```diff
           text = builtins.readFile ./myconfig.fish;
         };
 
+        linkConfig = pkgs.runCommandLocal "link-config" {} ''
+        ln -s ${fishConfig}/.config/fish/myconfig.fish /Users/roman/.config/fish/myconfig.fish
+        '';
+
       in
       {
         packages.default = pkgs.symlinkJoin {
           name = "my-config";
-          paths = [ fishConfig ];
+          paths = [ fishConfig linkConfig ];
         };
```

Sadly, this fails with:

```
> ln: failed to create symbolic link '/Users/roman/.config/fish/myconfig.fish': Permission denied
```

It turns our that Nix evaluates scripts in a sandbox environment. It doesn't even expose $HOME env variable to the script. How do we circumvent this?

> We can use `fishConfig` variable for creating a link because when it is converted to string it just points to the Nix store directory.

After pondering for a bit I've realzied that I use `nix run .` when evaluating home manager's flake. Flakes could also define apps or scripts to run. These scripts are not sandboxed and could help us!

```nix
{
  description = "Manage dotfiles";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.05";
  };

  outputs = { self, flake-utils, nixpkgs, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        fishConfig = pkgs.writeTextFile {
          name = "myconfig.fish";
          destination = "/.config/fish/myconfig.fish";
          text = builtins.readFile ./myconfig.fish;
        };

        mylink = pkgs.writeScript "my-link"
          ''
            #!/usr/bin/env bash

            ln -sf ${fishConfig}/.config/fish/myconfig.fish /Users/roman/.config/fish/myconfig.fish
          '';

      in
      {

        apps.default = {
          type = "app";
          program = "${mylink}";
        };

        formatter = pkgs.nixpkgs-fmt;
      }
    );
}
```

Now we define a script that creates the link. `nix run` evaluates the script.

```
> nix run

> ls -l ~/.config/fish/
lrwxr-xr-x  1 roman  staff    84 Oct 27 14:24 myconfig.fish@ -> /nix/store/0jzf58ikfrym21l2rl1y83qcgcy1b0xj-myconfig.fish/.config/fish/myconfig.fish
```

And... our configuration file is successfully present in our home environment.

> You don't need to hardcode your HOME directory in the script if you don't want to.  
> `homeDir = toString ~/.;` lets you do it automatically but this makes your flake not pure. Luckily, you can just add a `--impure` flag to all commands.

This is obviously still far behind of what home manager achieves. We still need to modify our script to create links for all configuration files and we want the script to remove old links if you decide to remove a file.

> NOTE: In the example above there is one major flaw: configuration files are not referenced by any profile. This means that when you run `nix store gc` 
> it will remove the files and invalidate the links. See [example](#proof-of-concept-home-management-implementation) from the appendix for a solution.


## Home manager pros

You may create your own tool for configuration management. But first let me list the problems you may encounter which home manager has solved already.

- Home manager links Applications on mac
    - *If derivation builds an Application home manager automatically links it to a global Application folder*
- Home manager installs fonts
- Home manager provides change hooks that let you run custom scripts only when config was changed
- Home manager lets you define configuration in multiple modules and merges them seamlessly


## Summary

You may not need a Home Manager. This is true and in fact you can go pretty far with basic Nix flakes. You will, however, need to reimplement several already solved problems. It is your choice but as for me I am sticking with home manager at least for now.


## Appendix

### Alternatives

> These are only for package management. They don't support managing home configuration files.

* [devbox](https://github.com/jetpack-io/devbox)
* [snow](https://github.com/snowflakelinux/snow)

### Proof-of-concept home management implementation

<details>
<summary>Code snippet</summary>

```nix
{
  description = ''
    My home configuration.

    Usage:
    nix run   (To install all dependencies and link config files)
  '';

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        file = builtins.readFile;

        # A map of destination paths to the contents.
        configFiles = {
          # Git
          "Code/git/config" = ''
            [user]
              email = "hello@example.com"
              name = "Roman Zaynetdinov"
          '';

          # Fish
          "Code/trial/config.fish" = file ./fish/config.fish;
        };

        configFilesList = map
          (path:
            let
              source = configFiles.${path};
            in
            pkgs.writeTextDir path source
          )
          (builtins.attrNames configFiles);

        # Merge all config files together
        configFilesDrv = pkgs.symlinkJoin {
          name = "myhome-files";
          paths = configFilesList;
        };

        deps = [
          pkgs.hello
          pkgs.cowsay
          # We need to install our configuration files into a profile.
          # Otherwise `nix store gc` will remove the files and invalidate the links.
          configFilesDrv
        ];

        linker = pkgs.writeShellApplication {
          name = "myhome-config-linker";
          runtimeInputs = [ pkgs.jq ];

          # Home Manager ref: https://github.com/nix-community/home-manager/blob/master/modules/files.nix#L169
          text = ''
            # This script uses safe for loops over find results: https://www.shellcheck.net/wiki/SC2044

            # Find if this flake is already installed
            installed=$(nix profile list --json | jq '.elements[].url' | grep -n -E ".*$(pwd)\"$")

            if [[ -z $installed ]]; then
              # Install new profile
              echo "Installing new profile..."
              nix profile install
            else
              # Update existing profile
              line=$(echo "$installed" | cut -d : -f 1)
              index=$((line-1))
              echo "Upgrading profile $index"
              nix profile upgrade $index
            fi

            # File where we cache last used generation path.
            genCache="$HOME/.config/myhome/current-gen"

            # Delete old links
            # (Here we go through all links from the previous generation and remove them)

            if [[ -f $genCache ]]; then
              # Cache exists --> remove old links
              oldStorePath=$(cat "$genCache")
              echo "Cleaning up old links"

              while IFS= read -r -d "" file
              do
                # Remove leading './' from the path
                name=$(echo "$file" | cut -c 3-)
                target="$HOME/$name"

                echo "Removing $target"
                rm "$target" || echo "Failed to remove $target, maybe you have already removed it."

                # Delete empty dirs. NOTE: ideally also delete parent dirs
                dir=$(dirname "$target")
                if [[ -d $dir ]]; then
                  if [[ $dir != "$HOME" ]]; then
                    find "$dir" -type d -empty -delete
                  fi
                fi

              done <   <(cd "$oldStorePath" && find . -type l -print0)
            fi


            # Link config files
            # (Here we create links under HOME dir that point to files in the Nix store)

            while IFS= read -r -d "" file
            do
              # Remove leading './' from the path
              name=$(echo "$file" | cut -c 3-)
              source=$(readlink "${configFilesDrv}/$name")
              target="$HOME/$name"

              echo "Linking to $target"
              mkdir -p "$(dirname "$target")"
              ln -sf "$source" "$target"
            done <   <(cd ${configFilesDrv} && find . -type l -print0)

            # Save used store path in the cache
            mkdir -p "$(dirname "$genCache")"
            echo ${configFilesDrv} > "$genCache"
          '';
        };
      in
      {
        # nix build            (Build this derivation in local directory)
        # nix profile install  (Install globally)
        packages.default = pkgs.symlinkJoin {
          name = "myhome";
          paths = deps;
        };

        # nix run  (Run the script. The script installs derivation globally)
        apps.default = {
          type = "app";
          program = "${linker}/bin/${linker.name}";
        };

        formatter = pkgs.nixpkgs-fmt;
      }
    );
}
```
</details>

### Nix community has strong preferences

Sometimes it could be hectic to get help. Instead of helping with solving the problem people start suggesting how I should use my own computer. The end result is I get irritated and the problem remains unsolved.

> **Me:**  
> Hi! I am trying to install rustup and rust-analyzer with home-manager.
>
> ```
> error: collision between `/nix/store/8svca0a1a6irbgjkcc9qhr6gvkh7xbvk-rust-analyzer-2023-07-03/bin/rust-analyzer' 
>   and `/nix/store/g1cmgw0rnaqkak5nhlj6pay6jcna7giq-rustup-1.26.0/bin/rust-analyzer'
> ```
>
> sadly it fails because both rustup and rust-analyzer output rust-analyzer binary (rustup does a symlink actually).
>
> How can I exclude rustup's symlink or how can I override it?

> **User A:**  
> use devshells, not home-manager
> https://ayats.org/blog/nix-rustup/

> **Me:**  
> My editor is currently set up to use global packages so using devshells will require additional work :/ I've had rust-analyzer installed manually before and now finally got to fix that. Really annoying that things just don't work

> **User A:**  
> things don't work the same way in your FHS distro to prevent the toolchain hell
> the editor should keep the environment if launched within the shell or otherwise you can use direnv extensions

> **User B:**  
> Relying on global tooling will cause you more trouble in the long term then now configuring your editor to use everything via shell. Assuming you actually use an editor that can be used with dev shells and not some overblown IDE that doesn't care about the environment it was started from…
