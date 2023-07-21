+++
author = "Roman Zaynetdinov"
date = "2023-07-14T12:00:00+03:00"
title = "How Deno works"
description = "What is Deno? How Deno works? Let's see how Deno is implemented and how it evaluates your TypeScript files."
draft = false

[extra]
preview_image = { href = "deno_hr_small.png", alt = "Deno logo" }
+++


There has been a lot of talk lately about [Deno](https://deno.land/). In this blog post I will share my notes about *how Deno works* based on me exploring their source code.

> If you are looking for an introductory post about Deno then you could read my earlier [What is Deno blog post](/post/what-is-deno).


## "The easiest, most secure JavaScript runtime."

Let's start with their website. Deno is a CLI tool and to use it we need to download Deno executable.

Deno's promise is to provide all the essential features out of the box. The binary provides us with: 
* evaluating TypeScript code
* formatting the code
* linting the code
* type checking the code
* language server
* and more.

What's more Deno is completely open source so we can freely explore what it includes and how it works on [GitHub](https://github.com/denoland/deno/).

> All of the findings below are for Deno v1.35.0

Deno CLI is a Rust application that uses [clap](https://lib.rs/crates/clap) crate for parsing command-line arguments and flags.

```
> deno --version
deno 1.35.0 (release, aarch64-apple-darwin)
v8 11.6.189.7
typescript 5.1.6
```

Deno bundles a V8 engine which executes JavaScript. TypeScript compiler is also embedded into the binary to provide type checking *(more on this later)*.


## Code formatting

`deno fmt` [source](https://github.com/denoland/deno/blob/v1.35.0/cli/tools/fmt.rs#L228:L245)

Deno scans all files in parallel and can either format a file in place or check if a file formatted. Deno can format Markdown, JSON and TypeScript/JavaScript files.

* Markdown is formatted with [dprint-plugin-markdown](https://lib.rs/crates/dprint-plugin-markdown)
* JSON and JSONC <small>*(JSON with comments)*</small> with [dprint-plugin-json](https://lib.rs/crates/dprint-plugin-json)
* TypeScript/JavaScript with [dprint-plugin-typescript](https://lib.rs/crates/dprint-plugin-typescript)


## Code linting

`deno lint` [source](https://github.com/denoland/deno_lint)

Deno uses [`deno_ast`](https://lib.rs/crates/deno_ast) crate to parse the source file which in turn uses [`swc_ecma_ast`](https://lib.rs/crates/swc_ecma_ast) crate. Deno traverses the program AST and applies lint rules.

* [All lint rules](https://github.com/denoland/deno_lint/blob/0.49.0/src/rules.rs#L224:L323)
* Default lint rules: rules that have a `recommended` tag

Example non-default lint rule: "Eqeqeq". It requires triple equals. [source](https://github.com/denoland/deno_lint/blob/0.49.0/src/rules/eqeqeq.rs#L52:L62)


## Type checking

`deno check main.ts` [source](https://github.com/denoland/deno/blob/v1.35.0/cli/tools/check.rs#L66)

Deno builds a [module graph](https://lib.rs/crates/deno_graph) first (loads all files). If there is a lock file then verify integrity of modules. If node built-ins are used then inject [`@types/node`](https://www.npmjs.com/package/@types/node) typings. Finally, transform the graph to feed to tsc *(official TypeScript compiler)*.

Deno runs a JSRuntime with [`deno_cli_tsc` extension](https://github.com/denoland/deno/blob/v1.35.0/cli/tsc/mod.rs#L757-L777) to evaluate tsc and type check the files. Deno includes a complete [`tsc` source code](https://github.com/denoland/deno/blob/v1.35.0/cli/tsc/00_typescript.js) (version 5.1.6). This is what we saw earlier when we printed `deno --version`.


## Code evaluation

`deno run main.ts`

Now comes the most interesting bit. How does Deno run TypeScript code?.

1. Find a file to run. Could be stdin, a file or a url.
1. Build allowed permissions. Permissions you specified when running a command (e.g `--allow-net`, `--allow-read`, etc).
1. Create a [MainWorker](https://github.com/denoland/deno/blob/v1.35.0/cli/worker.rs#L357)
    * Set up module loader, NPM resolver and other utilities
    * Check if entry point is a node, NPM or an ES module 
        * Module starts with `node:..` or `npm:..`
    * Create a JSRuntime
        * [Register extensions](https://github.com/denoland/deno/blob/v1.35.0/runtime/worker.rs#L227:L305).
        * Execute [`bootstrap.mainRuntime` function](https://github.com/denoland/deno/blob/v1.35.0/runtime/js/99_main.js#L433)
            * This initializes global variables on the JS side.
        * Initialize a main module (load main module).
        * Evaluate a main module.
        * Transpile every ES module from TypeScript into JavaScript before execution.
        * Run event loop until [nothing is running](https://github.com/denoland/deno_core/blob/0.195.0/core/runtime/jsruntime.rs#L1337:L1339).
        
> `deno run` is not the only way you can evaluate the code. There is also `deno repl` and `deno compile`. The latter bundles a Deno script and all of its dependencies into a standalone executable and uses [eszip v2](https://lib.rs/crates/eszip) file format for storing the module graph.


### JSRuntime

I have already mentioned JSRuntime a couple of times. JSRuntime is an abstraction from [`deno_core`](https://lib.rs/crates/deno_core) that wraps a V8 isolate and evaluates JavaScript code. 

> V8 orchestrates isolates: lightweight contexts that evaluate the code in a safe scoped environment. Rust integration is provided by [v8 crate](https://lib.rs/crates/v8).
>
> More about V8 isolates [here](https://developers.cloudflare.com/workers/learning/how-workers-works#isolates) and [here](https://docs.rs/v8/0.74.1/v8/struct.Isolate.html).

JSRuntime can execute a script and evaluate an ES module. JSRuntime lets you to integrate Rust with JS via extensions *(more on this later)*.

Loading a main module will load the module and all of its dependencies. Modules are loaded with a `deno_core::ModuleLoader`.
* Deno transpiles TypeScript into JavaScript when [loading a module](https://github.com/denoland/deno/blob/v1.35.0/cli/module_loader.rs#L256-L278).
* Uses [swc](https://lib.rs/crates/swc) with a combination of utilites from [deno_ast](https://lib.rs/crates/deno_ast).


### Extensions

Deno by default loads a plenty of extensions. Some of these extensions exist in separate crates *(meaning you can import and use them)*, while others are kind of private and exist solely for Deno CLI usage.

Runtime extensions could be defined with a macro:

```rust
deno_core::extension!(
  deno_url,
  deps = [deno_webidl],
  ops = [
    op_url_reparse,
    op_url_parse,
    op_url_get_serialization,
    op_url_parse_with_base,
    op_url_parse_search_params,
    op_url_stringify_search_params,
    op_urlpattern_parse,
    op_urlpattern_process_match_input
  ],
  esm = ["00_url.js", "01_urlpattern.js"],
);
```

This macro defines a `deno_url` extension that depends on `deno_webidl` extension. `deno_url` provides 8 operations *(op_url...)* that are defined in Rust. JavaScript can call these functions. When runtime initializes the extension it should execute `00_url.js` and `01_urlpattern.js` scripts.

Now you can call Rust functions from JavaScript:

```js
globalThis.Deno.core.op_url_parse(href, componentsBuf);
```

Rust side receives the arguments and an optional global state:

```rust
#[op(fast)]
pub fn op_url_parse(state: &mut OpState, href: &str, buf: &mut [u32]) -> u32 {
  // implementation that fills the buffer `buf`
}
```

> Operations defined on the Rust side could be synchronous *(like `op_url_parse`)* and also asynchronous.

*Available extensions:*

* [`deno_webidl`](https://lib.rs/crates/deno_webidl): implements [Web IDL](https://webidl.spec.whatwg.org/)
* [`deno_console`](https://lib.rs/crates/deno_console): implements the [Console API](https://console.spec.whatwg.org/)
* [`deno_url`](https://lib.rs/crates/deno_url): implements the [URL](https://url.spec.whatwg.org/) and [URLPattern](https://wicg.github.io/urlpattern/) APIs
* [`deno_web`](https://lib.rs/crates/deno_web): implements Event, TextEncoder, TextDecoder, [File API](https://w3c.github.io/FileAPI), streams, MessagePort and structuredClone.
* [`deno_fetch`](https://lib.rs/crates/deno_fetch): implements the [Fetch API](https://fetch.spec.whatwg.org/)
* [`deno_cache`](https://lib.rs/crates/deno_cache): implements the [Cache API](https://w3c.github.io/ServiceWorker/#cache-interface)
* [`deno_websocket`](https://lib.rs/crates/deno_websocket): implements [websocket functions](https://html.spec.whatwg.org/multipage/web-sockets.html)
* [`deno_webstorage`](https://lib.rs/crates/deno_webstorage): implements the [WebStorage spec](https://html.spec.whatwg.org/multipage/webstorage.html)
* [`deno_crypto`](https://lib.rs/crates/deno_crypto): implements the [Web Cryptography API](https://www.w3.org/TR/WebCryptoAPI/)
* [`deno_broadcast_channel`](https://lib.rs/crates/deno_broadcast_channel): implements the [BroadcastChannel functions](https://html.spec.whatwg.org/multipage/web-messaging.html)
* [`deno_ffi`](https://lib.rs/crates/deno_ffi): implements dynamic library ffi
* [`deno_net`](https://lib.rs/crates/deno_net): implements networking APIs
* [`deno_tls`](https://lib.rs/crates/deno_tls): implements common utilities for TLS handling in other Deno extensions
* [`deno_kv`](https://lib.rs/crates/deno_kv): provides a key/value store
* [`deno_napi`](https://lib.rs/crates/deno_napi): NAPI implementation
* [`deno_http`](https://lib.rs/crates/deno_http): implements server-side HTTP based on primitives from the [Fetch API](https://fetch.spec.whatwg.org/)
* [`deno_io`](https://lib.rs/crates/deno_io): provides IO primitives for other Deno extensions, this includes stdio streams and abstraction over File System files
* [`deno_fs`](https://lib.rs/crates/deno_fs): provides ops for interacting with the file system
* [`deno_node`](https://lib.rs/crates/deno_node): require and other node related functionality

*"Private" extensions from Deno CLI:*

> JavaScript implementations for these extensions are [here](https://github.com/denoland/deno/tree/v1.35.0/runtime/js).

* [`ops::runtime::deno_runtime`](https://github.com/denoland/deno/blob/v1.35.0/runtime/ops/runtime.rs#L9): implements helper methods to return main module URL and parent process id
* [`ops::worker_host::deno_worker_host`](https://github.com/denoland/deno/blob/v1.35.0/runtime/ops/worker_host.rs#L90): implements WebWorker
* [`ops::fs_events::deno_fs_events`](https://github.com/denoland/deno/blob/v1.35.0/runtime/ops/fs_events.rs#L31): implements File System events using [notify](https://lib.rs/crates/notify) crate
* [`ops::os::deno_os`](https://github.com/denoland/deno/blob/v1.35.0/runtime/ops/os/mod.rs#L42): implements methods to retrieve OS info
* [`ops::permissions::deno_permissions`](https://github.com/denoland/deno/blob/v1.35.0/runtime/ops/permissions.rs#L14): implements Deno [permission API](https://deno.land/manual@v1.35.0/runtime/permission_apis)
* [`ops::process::deno_process`](https://github.com/denoland/deno/blob/v1.35.0/runtime/ops/process.rs#L104): implements methods to spawn a child process
* [`ops::signal::deno_signal`](https://github.com/denoland/deno/blob/v1.35.0/runtime/ops/signal.rs#L32): implements methods to bind to OS signals
* [`ops::tty::deno_tty`](https://github.com/denoland/deno/blob/v1.35.0/runtime/ops/tty.rs#L75)
* [`ops::http::deno_http_runtime`](https://github.com/denoland/deno/blob/v1.35.0/runtime/ops/http.rs#L30) 
* [`deno_permissions_worker`](https://github.com/denoland/deno/blob/v1.35.0/runtime/worker.rs#L203)


### Snapshots

JSRuntime supports [snapshots](https://github.com/danbev/learning-v8/blob/master/notes/snapshots.md). Deno CLI uses a [pre-built snapshot](https://github.com/denoland/deno/blob/v1.35.0/cli/js.rs#L9) every time it creates a JSRuntime. Snapshot is built automatically when [compiling the crate](https://github.com/denoland/deno/blob/v1.35.0/cli/build.rs).

The snapshot's goal is to speed up initial startup time.


### Web workers

When launching a web worker Deno starts a new JSRuntime (a new V8 isolate). The process is [very similar](https://github.com/denoland/deno/blob/v1.35.0/runtime/web_worker.rs#L370) to executing a main module. Web worker communicates with a main worker via [futures_channel](https://lib.rs/crates/futures-channel).


## Build your own runtime

Deno makes it fairly trivial to implement custom runtimes using [`deno_core`](https://lib.rs/crates/deno_core) crate. The process is essentially:

1. Create a JSRuntime
    * You want to use a new runtime for every request/user/customer so as to keep them separated.
1. Register extensions
    * Implement the API you need to be accessible from JavaScript side.
1. Implement a module loader
    * Loader finds a module and its dependencies.
    * *Deno provides a file system loader out of the box.*
1. Now you are good to go.

> In the future it might be possible to sandbox code execution using [ShadowRealm](https://github.com/denoland/deno/issues/13239).

Here are a few helpful links:

* [Roll your own JavaScript runtime](https://deno.com/blog/roll-your-own-javascript-runtime) *(Three part series)*
* [Supabase's JS Runtime implementation](https://github.com/supabase/edge-runtime/blob/main/crates/base/src/deno_runtime.rs)
* [Zinnia's JS Runtime implementation](https://github.com/filecoin-station/zinnia/blob/v0.13.0/runtime/runtime.rs)

#### Are you building a custom JSRuntime? Let's get in touch!

<p style="max-width: 400px">
  <bk-contact-form></bk-contact-form>
  <script async src="https://eyuxylujanwriimduamk.supabase.co/storage/v1/object/public/cdn/ui/1elqj993emcb23/bk-contact-form.js"></script>
</p>

<div class="powered-by">Form powered by <a href="https://bolik.net" target="_blank">Bolik</a>.</div>


### Deno Deploy

You may think that Deno Deploy is based on Deno CLI. But it is not the case. Deno Deploy is a proprietary JS runtime implementation built on top of `deno_core`.
