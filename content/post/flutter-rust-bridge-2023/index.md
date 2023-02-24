+++
author = "Roman Zaynetdinov"
date = 2023-02-24T12:00:00+03:00
title = "Using Flutter Rust bridge in 2023"
description = "How to set up Flutter Rust bridge and how to use it in 2023."
draft = false
+++

[Flutter Rust bridge](https://github.com/fzyzcjy/flutter_rust_bridge) is super useful project that allows you to call Rust code from Flutter. Instead of manually writing FFI methods and type conversions, bridge will generate all that glue code for you.


## Intro

Before we begin let's list all the dependencies we will need:

* Flutter
* Rust
* Flutter Rust bridge codegen: `cargo install -f flutter_rust_bridge_codegen@1.65.0`

Library authors have created an excellent guide to set up the bridge on all platforms: [see more](https://cjycode.com/flutter_rust_bridge/template/setup.html). Also I have previously written how to [setup Flutter Rust bridge on Fedora](/post/flutter-rust-bridge-on-fedora/).

For the purpose of this post we won't go into platform details. Instead we will focus on finding out what is possible with the bridge and how to use the features.

In this post we will reference two files: 

1. `api.rs` that will contain our public Rust methods 
2. `main.dart` that will contain Dart code calling into Rust


## Basic example

First thing that everybody needs is how to call a function. Let's define it:

```rust
pub fn square(n: u32) -> u32 {
    n * n
}
```

Now let's generate glue code. Flutter Rust bridge codegen will go through all public methods in `api.rs` and generate FFI methods for each.

```sh
# This generates bindings for all platforms.
# `native/src/api.rs` is our Rust file with public methods.
flutter_rust_bridge_codegen \
  -r native/src/api.rs \
  -d lib/bridge_generated.dart \
  -c ios/Runner/bridge_generated.h \
  -e macos/Runner/
```

Finally, we can call our square function from Dart:

```dart
// Import generated glue code.
import 'package:timeline/bridge_generated.dart';

final _dylib = /* load library */;
final Native native = NativeImpl(_dylib);

Future<int> result = native.square(4);
```

> By default Flutter Rust bridge executes a FFI call on [a thread pool](https://cjycode.com/flutter_rust_bridge/feature/worker_pool.html) and returns a Future so as not to hang Dart's main thread. If you really want to make your call synchronous you can return [`SyncReturn<u32>` from Rust](https://cjycode.com/flutter_rust_bridge/feature/sync_dart.html).


## Features

### Returning structs

In our basic example we used primitive types. In real world we rely on a lot more types: structs, datetime, enums, etc.

Structs usage is self-explanatory. They work just as you would expect. Fields could be primitive types, other structs, Option or chrono::DateTime. Bridge project is very active and with each release there are less and less restrictions.

```rust
pub struct Person {
    pub name: String,
    pub age: u16,
}

pub fn save_person(p: Person) -> Result<Person> {
    Ok(Person {
        name: p.name,
        age: p.age + 1
    })
}
```

```dart
Person saved = await native.savePerson(p: Person(name: "Tom", age: 23));
```

> There is one catch with structs though: *you cannot use structs from external crate directly*. Bridge needs to know the fields of the struct and can't do that with structs defined in external crates.

You have to redefine the struct in `api.rs` or in any other file in the same crate. Our struct usage becomes more complex:

```rust
pub struct Person {
    pub name: String,
    pub age: u16,
}

pub fn save_person(p: Person) -> Result<Person> {
    // We need to convert Person into othercrate::Person.
    let p2: othercrate::Person = p.into();
    // Now we call a method from an external crate.
    let saved: othercrate::Person = othercrate::save_person(p)?;
    // We need to convert othercrate::Person into Person.
    Ok(saved.into())
}

impl Into<othercrate::Person> for Person {
    fn into(self) -> othercrate::Person {
        othercrate::Person {
            name: self.name,
            age: self.age,
        }
    }
}

impl From<othercrate::Person> for Person {
    fn from(p: othercrate::Person) -> Self {
        Self {
            name: p.name,
            age: p.age,
        }
    }
}
```

This gets quite hectic if you need to convert all of your types. Luckily, Flutter Rust bridge comes with a solution to this problem. They call it [mirroring](https://cjycode.com/flutter_rust_bridge/feature/lang_external.html#types-in-other-crates). "Mirroring" still requires your to re-define a struct but it removes the need for writing manual conversion methods.

With "Mirroring" our example becomes:

```rust
/// Important to re-export Person import.
pub use othercrate::Person;

#[frb(mirror(Person))]
pub struct _Person {
    pub name: String,
    pub age: u16,
}

// Conversions are no longer needed
pub fn save_person(p: Person) -> Result<Person> {
    let saved = othercrate::save_person(p)?;
    Ok(saved)
}
```

Based on my experience I couldn't switch fully to "mirroring" because there are some use cases where writing a custom conversion method is helpful.

### Log streaming

When creating an application it is very helpful to be able to access all logs from somewhere. In my case I wanted to display all logs in the UI. With the bridge and Rust's [tracing](https://github.com/tokio-rs/tracing) it is straightforward. Flutter Rust bridge allows us to return a stream of events from Rust side. 

We will create our own sink for Rust logs and forward all lines to Dart.

```rust
use std::io::Write;

use anyhow::{bail, Result};
use flutter_rust_bridge::StreamSink;
use tracing_subscriber::{fmt::MakeWriter, EnvFilter};

/// Wrapper so that we can implement required Write and MakeWriter traits.
struct LogSink {
    sink: StreamSink<String>,
}

/// Write log lines to our Flutter's sink.
impl<'a> Write for &'a LogSink {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        let line = String::from_utf8_lossy(buf).to_string();
        self.sink.add(line);
        Ok(buf.len())
    }

    fn flush(&mut self) -> std::io::Result<()> {
        Ok(())
    }
}

impl<'a> MakeWriter<'a> for LogSink {
    type Writer = &'a LogSink;

    fn make_writer(&'a self) -> Self::Writer {
        self
    }
}

/// Public method that Dart will call into.
pub fn setup_logs(sink: StreamSink<String>) -> Result<()> {
    let log_sink = LogSink { sink };

    // Subscribe to tracing events and publish them to the UI
    if let Err(err) = tracing_subscriber::fmt()
        .with_max_level(tracing::Level::TRACE)
        .with_env_filter(EnvFilter::new("info,bolik_sdk=trace"))
        .with_writer(log_sink)
        .try_init()
    {
        bail!("{}", err);
    }
    Ok(())
}
```

Dart side is way simpler.

```dart
Stream<String> nativeLogs = native.setupLogs();
nativeLogs.handleError((e) {
  print("Failed to set up native logs: $e");
}).listen((logRow) {
  print("[native] $logRow");
});
```

Now all calls to `tracing::info!()`, `tracing::error!()`, ... will forward logs to our Flutter application. 

> In my application I use the same stream pattern to dispatch events from native module to Flutter.

### Global state and Tokio

So far we have only looked at how to call the pure functions, functions that don't reference a global state. In practice we often need a global state. Be it a database connection, an async runtime, or something else.

#### SQLite

Let's start with the essentials. How about having an SQLite connection?

```rust
use rusqlite::{params, Connection};

/// Keep a global database reference
static DB: Mutex<Option<Connection>> = Mutex::new(None);

/// First we need to initialize our db connection
pub fn connect() -> Result<()> {
    let conn = Connection::open_in_memory()?;

    conn.execute(
        "CREATE TABLE persons (
            id    INTEGER PRIMARY KEY,
            name  TEXT NOT NULL,
            age   INTEGER
        )",
        [],
    )?;

    *DB.lock().expect("Set db") = Some(conn);
    Ok(())
}


pub struct Person {
    pub id: i32,
    pub name: String,
    pub age: u16,
}

/// Now we can use established connection to save people
pub fn save_person(name: String, age: u16) -> Result<Person> {
    // Mutex boilerplate...
    let db_guard = DB.lock().expect("Get db");
    let conn = db_guard.as_mut().expect("Db present");

    conn.execute(
        "INSERT INTO persons (name, age) VALUES (?1, ?2)",
        params![&name, &age],
    )?;
    Ok(Person {
        id: conn.last_insert_rowid() as i32,
        name,
        age,
    })
}
```

You could see the pattern here: Dart code tends to be short and clean.

```dart
await native.connect();
Person saved = await native.savePerson(name: "Tom", age: 23);
```

#### Tokio runtime

Now comes the big question: How do you call async functions? 

First thing I would suggest is to check if you could use blocking API (e.g reqwest provides [blocking](https://docs.rs/reqwest/latest/reqwest/blocking/index.html) clients). There is nothing terribly wrong with blocking. Also check more [potential solutions](https://cjycode.com/flutter_rust_bridge/article/async_in_rust.html) from bridge's docs.

> There is no silver bullet when it comes to using async with Flutter Rust bridge. All solutions have trade-offs. Async work is tracked [here](https://github.com/fzyzcjy/flutter_rust_bridge/issues/966).

If none of the previous solutions suit your needs or you need your runtime to be running all the time then let's continue here.

```rust
use tokio::runtime::Runtime;

static RUNTIME: Mutex<Option<Runtime>> = Mutex::new(None);

pub fn start() -> Result<()> {
    // Initialize a runtime
    let rt = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(2)
        .enable_all()
        .thread_name("bolik-timeline-client")
        .build()?;
        
    // Here we can spawn background tasks to be run on the runtime.

    // Store runtime in a global variable
    *RUNTIME.lock().expect("Set runtime") = Some(rt);
    Ok(())
}

pub struct Person {
    pub id: i32,
    pub name: String,
    pub age: u16,
}

pub fn save_person(name: String, age: u16) -> Result<Person> {
    // We are calling async methods from a thread that is not managed by
    // Tokio runtime. For this to work we need to enter the handle first.
    // Ref: https://docs.rs/tokio/latest/tokio/runtime/struct.Handle.html#method.current
    let mut rt_guard = RUNTIME.lock().expect("Get runtime");
    let rt = rt_guard.as_mut().expect("Runtime present");
    let _guard = rt.enter();

    // Let's pretend that we have `othercrate::save_person` function that returns a `Future<String>`.
    let id = rt.block_on(othercrate::save_person(name, age))?;
    Ok(Person {
        id,
        name,
        age,
    })
}
```

Dart:

```dart
await native.start();
Person saved = await native.savePerson(name: "Tom", age: 23);
```

There is one downside to this approach though. Since we lock the runtime for the duration of the call only one UI action could be processed at a time. 

> Due to this limitation I am using an event-based approach in my app. In example when I want to download a file I call async method to start download and do not wait till the file is downloaded. Instead I wait for a download complete event that is sent from the native module.


## Project references

I have created a cross-platform Flutter application that uses Flutter Rust bridge, [Bolik Timeline](https://bolik.tech/). If you want to see some "real life" examples check out the links:

* [Set up native module](https://github.com/boliktech/bolik/blob/833f4e2dd0c09e439d7684d15fa1e0d62b1aebc6/app/lib/common/models/phase_info.dart#L40:L71): Listen to logs and start a runtime.
    * [Rust side of setup](https://github.com/boliktech/bolik/blob/833f4e2dd0c09e439d7684d15fa1e0d62b1aebc6/app/native/src/api.rs#L69:L135)
* Sample method call: [Dart](https://github.com/boliktech/bolik/blob/833f4e2dd0c09e439d7684d15fa1e0d62b1aebc6/app/lib/common/models/app_state.dart#L24) and [Rust](https://github.com/boliktech/bolik/blob/833f4e2dd0c09e439d7684d15fa1e0d62b1aebc6/app/native/src/api.rs#L232:L235)

And finally, if you have any questions feel free to get in touch with me.
