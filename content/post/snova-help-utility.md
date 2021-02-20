+++
author = "Roman Zaynetdinov"
date = 2021-02-20T12:00:00+03:00
title = "Snova: an utility to build commands"
+++

Snova (снова) comes from the Russian language where it means "again". It is a simple command line utility that helps me build the commands.

I frequently find myself in a situation where I need to execute a simple command but I keep forgetting the arguments and flags I need to pass. Then I need to get back to the man pages. The problem is that some commands like `find` or `grep` have a lot (really a lot) of flags. But what if I need just one flag that I use all the time?


## Usage


1. First, you select a command (e.g `grep`)

    ```
    ➤ snova
    
    
    
    > Find lines in a file (grep)
      Find files or directories (find)
      Set git email address (git)
      Send an HTTP request (curl)
      1/4
    Pick a command:
    $
    ```

1. Second, you type the required arguments (e.g a file path)

    ```
    ➤ snova
    Command: grep [OPTIONS] PATTERN PATH
    PATH: ./some-file
    ```

1. Lastly, you pick optional flags (e.g case insensitive matching)

    ```
    ➤ snova
    Command: grep [OPTIONS] PATTERN PATH
    
    
    > Case insensitive matching
      Invert match (return non-matching lines)
      Print NUM lines after the matched line
      Print NUM lines before the matched line
      Search files recursively
      1/5
    grep  one ./some-file
    $
    ```

Whenever there is a list of options you can filter it out by typing. Select an option with `Enter`. If you don't want to choose anything then simply hit `ctrl-d`.

Some arguments require numerical input. They will not accept any other text (e.g `-A` flag in `grep` command).


## Configuration

Snova comes with a few builtin commands configured in [defs/builtin.toml](https://github.com/zaynetro/snova/blob/main/defs/builtin.toml). You can extend those commands with custom ones. Simply place a configuration file under `$HOME/.config/snova/commands.toml`.

This is a sample configuration file that describes all possible options:

```toml
# My custom commands

[[commands]]
# This is a command template. Arguments in square brackets mean they are optional.
template = "curl [_OPTIONS_] _URL_"
# A command description.
description = "Send an HTTP request (*curl*)"

# Specify which values to accept (string/number/path)
groups.URL.expect = "string"
# OPTIONS group expects flags
groups.OPTIONS.flags = [
  # Define a flag template. A template can either include an argument or not.
  # If you specified an argument then you can set which values an argument can expect (string/number/path).
  # Set multiple to true if this flag could be specified more than once.
  # Set suggest to a list of suggested options. Note, that user can still specify a custom option. These values are mostly for guidance and help.
  { template = "*-H* _VALUE_", description = "Include a header (e.g -H \"Content-Type: application/json\")", expect = "string", multiple = true },
  { template = "*-X* _METHOD_", description = "Set a request method", expect = "string", suggest = ["GET", "POST", "PUT", "DELETE", "HEAD", "PATCH"]  },
  { template = "-v", description = "Verbose logging" },
]
```

> You can also specify `suggest` values on a command argument.

```toml
groups.VALUE.expect = "string"
groups.VALUE.suggest = ["one", "two"]
```
