+++
author = "Roman Zaynetdinov"
date = "2023-06-06T12:00:00+03:00"
title = "Bundling TypeScript in the browser"
description = "We are all used to bundling and transpiling our JS code. Did you know that it is possible to do all of that in the browser? In this post I will explain how."

[extra]
preview_image = { href = "ts-logo.png", alt = "TypeScript logo" }
+++

> This is a Part 2 of *"Bundling TypeScript in the browser series"*. 
> 
> Part 1: [ES Modules and import maps](/post/2023-es-modules/)


## Bundling & Transpiling

There is no question that bundling and traspiling are essential for web development. Before going deeper into the topic let's reiterate what bundling and what transpiling is.

*Bundling* is a process of merging all of your source files and dependencies into a single file.

*Transpiling* is a process of analyzing each source file and modifying it so that all browsers could execute it. This step allows us to use the most recent JS/TS features and not worry whether all browsers have the support.

[Babel](https://babeljs.io/) is the most well-known transpiling tool.

Webpack, Rollup are bundling tools.

At the moment transpiling and bundling happen on your computer and then you import the bundle to be processed in the browser. Later in the blog I will show how bundling and transpiling could happen completely in the browser.


## ESBuild

Meet [ESBuild](https://esbuild.github.io/). ESBuild is a single executable that can transpile and bundle JavaScript/TypeScript projects.

> ESBuild is not the only tool that could be run in the browser. [SWC](https://swc.rs/) has a WASM option as well. [Rollup](https://rollupjs.org/faqs/#how-do-i-run-rollup-itself-in-a-browser) has a browser build as well.


## Why bundling in the browser?

You might be building a service where users could build the code or customize existing components.

### Usecase #1: Code editor

Let's say you are building an online code editor. Users could write TypeScript code and the execute it. You have two options: *A)* send TypeScript code to the server, compile it and respond with JS code that browser could execute; or *B)* compile TypeScript code in the browser and execute it. Option *(B)* if possible is easier and removes the need to maintain a pool of servers to execute untrusted code.

### Usecase #2: Customize web component

My personal use case is with [Bolik.net](https://bolik.net/) service. Bolik allows users to create custom web components. After receiving user configuration I compile the web component source and produce a single bundle that users could import on the website. 

> For the time being Bolik is not building web components in the browser. I will, however, show in this blog post that it is possible.


## Howto in the browser

Bundling and transpiling in the browsers differs slighlty compared to running it directly on your machine. While WASM makes it possible to run binaries in the browser there is one major difference still: <u>File System</u>. All tools assume that they can read files from the local file system. This condition breaks in the browser. Let's see how we can circumvent it.

### Transpiling in the browser

Transpiling (compiling) the code is the simplest step we can do. ESBuild makes it really trivial. We only need to import ESBuild library, initialize WASM module and then we are ready to transpile TypeScript.

```js
const { default: esbuild } = await import("https://esm.sh/esbuild-wasm@0.18.11/");
await esbuild.initialize({
  wasmURL: "https://esm.sh/esbuild-wasm@0.18.11/esbuild.wasm",
});

const res = await esbuild.transform(`
let a: number = 2;
`, {
  loader: "ts",
});
// Prints: let a = 2;
console.log(res.code);
```

And just like that we have our TypeScript code transpiled into JavaScript. 

> ESBuild wasm module is ~10MB so it does take some time to initialize the setup.

### Bundling in the browser

Let's try to bundle now.

```js
const { default: esbuild } = await import("https://esm.sh/esbuild-wasm@0.18.11/");
await esbuild.initialize({
  wasmURL: "https://esm.sh/esbuild-wasm@0.18.11/esbuild.wasm",
});

const res = await esbuild.build({
  bundle: true,
  write: false,
  entryPoints: ['main.ts'],
});
```

This will fail because browsers do not have access to the file system so our `maint.ts` could not be read. How can we make it work then?

Luckily, ESBuild supports plugins. OK but how does writing a plugin help us? Browsers can't access local file system but they can send HTTP requests! Instead of reading local files our plugin can fetch files from a server. 

```js
function withBrowserResolver() {
  return {
    name: "browser-resolver",
    async setup(build) {
      // Intercept import paths starting with "https://" or "http://" so
      // esbuild doesn't attempt to map them to a file system location.
      build.onResolve({ filter: /^http[s]{0,1}:\/\// }, (args) => ({
        path: args.path,
        namespace: "http-url",
      }));

      // We also want to intercept all import paths inside downloaded
      // files and resolve them against the original URL. All of these
      // files will be in the "http-url" namespace. Make sure to keep
      // the newly resolved URL in the "http-url" namespace so imports
      // inside it will also be resolved as URLs recursively.
      build.onResolve({ filter: /.*/, namespace: "http-url" }, (args) => ({
        path: new URL(args.path, args.importer).toString(),
        namespace: "http-url",
      }));

      // When a URL is loaded, we want to actually download the content
      // from the internet.
      build.onLoad({ filter: /.*/, namespace: "http-url" }, async (args) => {
        const url = new URL(args.path);
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch ${url}: status=${res.statusText}`);
        }

        const body = await res.text();
        return {
          contents: body,
          // ESBuild can't get extension from a URL so it falls back to js loader.
          loader: resolveLoader(url),
        };
      });
    },
  };
}

function resolveLoader(url) {
  if (url.pathname.endsWith(".ts")) {
    return "ts";
  }

  if (url.pathname.endsWith(".tsx")) {
    return "tsx";
  }

  return undefined;
}
```

Now we can use it

```js
const { default: esbuild } = await import("https://esm.sh/esbuild-wasm@0.18.11/");
await esbuild.initialize({
  wasmURL: "https://esm.sh/esbuild-wasm@0.18.11/esbuild.wasm",
});

const res = await esbuild.build({
  bundle: true,
  write: false,
  entryPoints: [`${location.protocol}//${location.host}/bundler-demo/main.ts`],
  loader: {},
  plugins: [withBrowserResolver()],
});

console.log(res.outputFiles[0].text);
```

*How does it work?* That was a lot of new code. 

1. First of all we defined an ESBuild plugin to support fetching files via HTTP request. 
    * This plugin overrides every ES module import that starts with `http://` or `https://`.
    * In case imported module wants to load more files then our plugin will be able to import those dependencies as well.
2. Then we asked ESBuild to bundle our project. 
    * Notice that our entry point is now a URL. *I am hosting a couple of demo files on this website that ESBuild fetches and bundles.*


### Evaluating in the browser

We usually don't want to just bundle the code. We want to evaluate it to see whether it works and how it works. Luckily, it is possible to do as well. As I mentioned in the [Part 1](http://localhost:8000/post/2023-es-modules#import-from-a-string) we can evaluate out built module by importing a string:

```js
// Define our module
const code = `export const name = 'James Bond';`;
// Create a URL object
const blob = new Blob([code], { type: "text/javascript" });
const url = URL.createObjectURL(blob);
// Import
const module = import(url);
URL.revokeObjectURL(url); // Garbage collect

// Use imported module
const { name } = await module;
console.log(`Hi from JS ${name}!`);
```

## Trying out

You can try out [ESBuild Online](https://esbuild.github.io/try/#YgAwLjE4LjExAC0tYnVuZGxlAGUAZW50cnkudHMAaW1wb3J0IHsgc3VtIH0gZnJvbSAnLi9zdW0nCgpleHBvcnQgZGVmYXVsdCBzdW0oMSwyKQAAc3VtLnRzAGV4cG9ydCBjb25zdCBzdW0gPSAoYTogbnVtYmVyLCBiOiBudW1iZXIpID0+IGEgKyBi).
