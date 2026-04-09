+++
author = "Roman Zaynetdinov"
date = "2022-05-21T12:00:00+03:00"
title = "Trying out Flutter Rust bridge on Fedora"
draft = false
+++

## Prerequisites

Make sure that you have Flutter installed and verify that the doctor command succeeds. I will run a Linux application and only care about Linux support for now.

```
> flutter doctor
Doctor summary (to see all details, run flutter doctor -v):
[✓] Flutter (Channel stable, 3.0.0, on Fedora Linux 36 (Container Image) 5.17.6-300.fc36.x86_64, locale en_GB.UTF-8)
...
[✓] Linux toolchain - develop for Linux desktop
...
```

You also need to have `rustc` and `cargo`.

## Start with a tutorial

Flutter Rust bridge has a [tutorial](http://cjycode.com/flutter_rust_bridge/tutorial_with_flutter.html) that we can use first to verify we have the dependencies needed. Their documentation is great by the way.

I am running Fedora Silverblue 36 and will execute the next commands in a toolbox. Let's install the dependencies:

```
cargo install flutter_rust_bridge_codegen
dart pub global activate ffigen
sudo dnf -y install rustfmt
```

Clone the repo and try to run their example:

```
git clone https://github.com/fzyzcjy/flutter_rust_bridge && cd flutter_rust_bridge

flutter_rust_bridge_codegen --llvm-path /usr/lib64/libclang.so.14.0.0 \
  --rust-input frb_example/with_flutter/rust/src/api.rs \
  --dart-output frb_example/with_flutter/lib/bridge_generated.dart \
  --c-output frb_example/with_flutter/ios/Runner/bridge_generated.h
  
cd frb_example/with_flutter/
flutter run -d linux
```

> Dart's ffigen needs LLVM and apparently it doesn't know how to find one on Fedora. So I had to set a CPATH env var and pass a `llvm-path` flag. 
>
> Thanks sisou for [a nifty script](https://github.com/dart-lang/ffigen/issues/257#issuecomment-1061788936) to make ffigen work! 
> ```
> export CPATH="$(clang -v 2>&1 | grep "Selected GCC installation" | rev | cut -d' ' -f1 | rev)/include"
> ```

> If you are on Ubuntu you might not need to do any of that. [Make sure](https://pub.dev/packages/ffigen#installing-llvm) you have a `libclang-dev` package though.


If all goes well you should see a tutorial app:

![Tutorial App](tutorial-app.png)


## Start from scratch

Well it seems that I am able to generate glue code and run a sample app. Let's see how to set up a project from scratch.

Create a demo app:

```
flutter create flutter_demo
cd flutter_demo
flutter pub add flutter_rust_bridge
```

Start Rust setup:

```
cargo new --lib native
```

Add the lines to `native/Cargo.toml`:

```diff
+[lib]
+crate-type = ["staticlib", "cdylib"]

+[dependencies]
+flutter_rust_bridge = "1"
```

> I am using the minimal amount of dependencies for this example. If you want to use Rust enums from Flutter then you need to install more dependencies: [build-time dependecies](http://cjycode.com/flutter_rust_bridge/integrate/deps.html#build-time-dependencies)


Save to [`linux/rust.cmake`](https://raw.githubusercontent.com/Desdaemon/flutter_rust_bridge_template/main/windows/rust.cmake):

```cmake
# We include Corrosion inline here, but ideally in a project with
# many dependencies we would need to install Corrosion on the system.
# See instructions on https://github.com/AndrewGaspar/corrosion#cmake-install
# Once done, uncomment this line:
# find_package(Corrosion REQUIRED)

include(FetchContent)

FetchContent_Declare(
    Corrosion
    GIT_REPOSITORY https://github.com/AndrewGaspar/corrosion.git
    GIT_TAG origin/master # Optionally specify a version tag or branch here
)

FetchContent_MakeAvailable(Corrosion)

corrosion_import_crate(MANIFEST_PATH ../native/Cargo.toml)

# Flutter-specific

set(CRATE_NAME "native")

target_link_libraries(${BINARY_NAME} PRIVATE ${CRATE_NAME})

list(APPEND PLUGIN_BUNDLED_LIBRARIES $<TARGET_FILE:${CRATE_NAME}-shared>)
```

Add this line to your `linux/CMakeLists.txt` file:

```diff

 # Generated plugin build rules, which manage building the plugins and adding
 # them to the application.
 include(flutter/generated_plugins.cmake)

+include(./rust.cmake)

 # === Installation ===
 # Support files are copied into place next to the executable, so that it can
```

Bump cmake version:

```diff
-cmake_minimum_required(VERSION 3.10)
+cmake_minimum_required(VERSION 3.12)
```

We have just configured Flutter build steps. Now our Rust library will be automatically built when you start your Flutter app. Let's continue with our Rust library:

`native/src/lib.rs`:

```rust
mod api;
```

`native/src/api.rs`:

```rust
pub fn square(n: u32) -> u32 {
    n * n
}
```

Now is the time to generate glue code. Flutter Rust bridge generates glue code on the Rust side and on the Flutter side. The files are `native/src/bridge_generated.rs` and `lib/bridge_generated.dart` accordingly.

```
flutter_rust_bridge_codegen --llvm-path /usr/lib64/libclang.so.14.0.0 \
  --rust-input native/src/api.rs \
  --dart-output lib/bridge_generated.dart
```

That's about it. The last step is to call our Rust code from the app. In `lib/main.dart`:

```dart
const base = 'native';
final path = Platform.isWindows ? '$base.dll' : 'lib$base.so';
late final dylib = Platform.isIOS
    ? DynamicLibrary.process()
    : Platform.isMacOS
        ? DynamicLibrary.executable()
        : DynamicLibrary.open(path);
late final api = NativeImpl(dylib);

// Now we can use api.square(n: 2) to get a Future<int>
```

Run the app: `flutter run -d linux`

> By default all Rust functions will return a Future<?> in Dart. This is a conscious decision to improve usability of Flutter code. Flutter is single-threaded and we don't want to block a UI thread by calling Rust synchronously. This also means that we don't need to call Rust from another isolate.
>
> It is possible to generate [a synchronous function](http://cjycode.com/flutter_rust_bridge/feature/sync_dart.html) though.


## Use third-party dependencies in Rust 

You can easily use third-party dependencies in your Rust code as long as you do not export them to Dart. 

> It is possible to expose some third-party structs into Dart but the support is limited. The feature is called [external types](http://cjycode.com/flutter_rust_bridge/feature/lang_external.html).

Let's add a few dependencies to our `native/Cargo.toml`:

```diff
 [dependencies]
 flutter_rust_bridge = "1"
+anyhow = "1"
+lazy_static = "1.4"
+rusqlite = { version = "0.27", features = ["bundled"] }
```

Flutter Rust bridge uses a [thread pool](http://cjycode.com/flutter_rust_bridge/feature/concurrency.html) internally so we need a global variable that is shared among threads to hold our connection reference. 

> It is possible to not use a thread pool though. You would need to [customize the Handler](http://cjycode.com/flutter_rust_bridge/feature/handler.html) which executes Rust functions.

Now our `native/src/api.rs` could look like:

```rust
use std::sync::Mutex;

use anyhow::Result;
use lazy_static::lazy_static;
use rusqlite::{params, Connection};

lazy_static! {
    static ref CONN: Mutex<Option<Connection>> = Mutex::new(None);
}

#[derive(Debug)]
pub struct Person {
    pub id: i32,
    pub name: String,
    pub age: Option<i32>,
}

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

    *CONN.lock().unwrap() = Some(conn);
    Ok(())
}

pub fn save_person(name: String, age: Option<i32>) -> Result<Person> {
    let c = CONN.lock().unwrap();
    let conn = c.as_ref();
    conn.expect("Connection to exist").execute(
        "INSERT INTO persons (name, age) VALUES (?1, ?2)",
        params![&name, &age],
    )?;
    Ok(Person {
        id: conn.unwrap().last_insert_rowid() as i32,
        name,
        age,
    })
}

pub fn list_persons() -> Result<Vec<Person>> {
    let c = CONN.lock().unwrap();
    let conn = c.as_ref();
    let mut stmt = conn
        .expect("Connection to exist")
        .prepare("SELECT id, name, age FROM persons")?;
    let person_iter = stmt.query_map([], |row| {
        Ok(Person {
            id: row.get(0)?,
            name: row.get(1)?,
            age: row.get(2)?,
        })
    })?;

    let persons = person_iter.map(|p| p.unwrap()).collect();
    Ok(persons)
}
```

We expose three functions. Notice that we also export `Person` struct. It should be possible to call all those methods and to use `Person` in Dart.

```dart
await api.connect();
Person p = await api.savePerson(name: 'Tom');
List<Person> persons = await api.listPersons();
```

Flutter Rust bridge converts `Person` struct into a Dart class:

```dart
class Person {
  final int id;
  final String name;
  final int? age;

  Person({
    required this.id,
    required this.name,
    this.age,
  });
}
```

This makes it really easy to use exported persons in our app.


## Available features

Here is brief list of features available to you.

```rust
// Define a struct
pub struct City {
    pub name: String,
    pub population: Option<i32>,
}

// We can accept and return our struct
pub fn get_city(name: String) -> Option<City> {
pub fn save_city(city: City) -> Result<()> {
pub fn get_cities() -> Vec<City> {

// We can specify that our function should not return a Future. Currently, only Vec<u8> is supported.
pub fn get_blocking() -> SyncReturn<Vec<u8>> {

// We can also work with streams. We have to return Result though for now.
pub fn numbers_stream(s: StreamSink<i32>) -> Result<()> {
    let mut i = 0;
    loop {
        thread::sleep(Duration::from_millis(400));
        s.add(i);
        i += 1;
    }
    Ok(())
}
```

And this is how you would call Rust methods from Dart:

```dart
// Struct
City? city = await api.getCity(name: "London");
await api.saveCity(city: City(name: "Paris", population: 12));
List<City> cities = await api.getCities();

// Blocking call
List<int> data = api.getBlocking();

// Stream
Stream<int> numbers = api.numbersStream();
numbers.listen((num) {
  print('New number $num');
});
```

There are more features that I haven't covered here. They include enums, external types and zero copy buffer.

## Summary

I would like to write some core parts in Rust and Flutter Rust bridge provides excellent tools to glue two worlds together. If you do all the work in Rust then things should just work for you. On the other hand if you need to pass different structs between Dart and Rust then you might hit some limitations. Unfortunately, there are still some use cases that are not possible and setting up a Dart ffigen tool is not trivial: I spent a lot of time trying to figure out how to point the tool to LLVM and where clang should search for libraries.

Another topic that I might need to research is hot code reload. Currently, you have to restart the app every time you edit Rust code. 

## References:

* [flutter_rust_bridge](https://github.com/fzyzcjy/flutter_rust_bridge)
* [Dart ffigen](https://github.com/dart-lang/ffigen)
* [Fedora LLVM path for ffigen](https://github.com/dart-lang/ffigen/issues/222)
* [LLVM issues](https://github.com/dart-lang/ffigen/issues/257)
* [LLVM issues cont'd](https://github.com/fzyzcjy/flutter_rust_bridge/issues/108)
