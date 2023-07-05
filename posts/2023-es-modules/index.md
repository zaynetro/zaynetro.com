+++
author = "Roman Zaynetdinov"
date = "2023-06-05T12:00:00+03:00"
title = "ES Modules and import maps"
description = "What are ES modules? What is an import map? How to use them? I try to answer these and other questions in this blog post."
draft = false

[extra]
preview_image = { href = "es-logo.png", alt = "EcmaScript logo" }
+++

> This is a Part 1 of *"Bundling TypeScript in the browser series"*. 


## A brief history of bundlers

Let's take a small detour and find out how we used JS before ES modules. *(The years are approximate)*

### 1. The dark ages (pre-2010)

JavaScript could be imported via script tags for as long as there was JavaScript. You would just import a bunch of scripts that would pollute global namespace and hope that all scripts were loaded. 


### 2. A new hope (2010-2018)

With a Node.js initial release in 2009 things started to look a bit brighter and JS community became more active. Around the same time we saw a couple of iconic projects like [RequireJs](https://requirejs.org/) and [browserify](https://browserify.org/). 

RequireJS is a library to asynchronously import modules in the browser. Browserify is a JS bundler for Node.js-like (CommonJS) modules. With Browserify came a lot, yeah a lot of utility tools like uglify, reactify, sassify, babelify, likify-this-post, etc.

Slightly simplified method of defining a module in the olden days:

```js
if(typeof define === "function" && define.amd) {
  // RequireJS module
  define("jquery", [], function() {
    return jQuery;
  });
} else if (typeof module === "object" && typeof module.exports === "object") {
  // CommonJS module (Node.js / Browserify)
  module.exports = jQuery;
} else {
  // Export to global namespace
  window.jQuery = jQuery;
}
```

Yep, that is a lot of steps and every library had to provide a single bundle that will support different export mechanisms.


### 3. The king (2018-2022)

[Webpack](https://webpack.js.org/) was released in 2014 but it took some time for it to gain a traction. But once it did it became **the only built tool** for JS projects. Webpack introduced a concept of loaders.

> A loader is a Webpack plugin to support importing a non-JS file. E.g if you want to import CSS you would need a css-loader.

Webpack allowed you customize a lot of things and eventually it became a major source of issues and complaints. People just could figure out how to configure a build pipeline correctly with it. Then with every major release the API changed so each loaded needed to be updated by their authors which in turn modified the API of the loader and so goes down the rabbit hole...

There was an attempt by React team to "improve" the situation with [create-react-app](https://github.com/facebook/create-react-app) project. A lot of people seemed to like the project. I was not one of them. *create-react-app* hid Webpack behind a clean interface. Their [webpack configuration file](https://github.com/facebook/create-react-app/blob/9802941ff049a28da2682801bc182a29761b71f4/packages/react-scripts/config/webpack.config.js) is almost 800 lines long! That was too complex for me and I always prefered to write a webpack configuration file by hand to only configure things I needed.

<bk-poll-form></bk-poll-form>
<script async src="https://eyuxylujanwriimduamk.supabase.co/storage/v1/object/public/cdn/ui/122cfbhd3j8bog2/bk-poll-form.js"></script>
<div class="powered-by">Poll powered by <a href="https://bolik.net" target="_blank">Bolik</a>.</div>

Webpack has solved a lot of issues like bundling, using plugins, importing CSS, etc. With time though, the slowness of it and the frustration of misconfiguring a loader has become too much. Luckily, new projects continued to appear each year that made life simpler.


### 4. Future (2022-)

> It is 2023 by the way! This essentially means that future has already begun.

It turns out that Node.js while being undisputedly fast is not as fast as native code. [ESBuild](https://esbuild.github.io/) (written in Go) and [swc](https://swc.rs/) (written in Rust) has shown that we don't need to wait seconds for JS build to finish. It could be done in milliseconds. 

Projects like [Vite](https://vitejs.dev/) and [Turbo](https://turbo.build/) use a hybrid approach. They pick the right tool for the job.

**Notable mentions** that I haven't written about:

* [Rollup](https://rollupjs.org/)


## ES modules

We are so used to using JS bundlers, transpilers and whatnot to build our UI projects. But do we really need all the extra complexity that comes with those tools nowadays? Can we just import the code we write?

The answer is: "It depends".

![It Depends book](it-depends.jpg)

First of all let's figure out how we can import the code. All browsers now support ES Modules. A standart mechanism for managing modules in JavaScript.

I highly recommend this [excellent explanation](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/) if you want to learn the details. For the purpose of this blog post I will only talk about using ES Modules.

Let's dive into the code! Let's start by defining a module:

```js
// name.js
export const name = 'James Bond';
```

That was easy. We have a single file named `name.js` that exports a variable named `name`. By itself this file is not very useful. The actual benefit comes from the fact that we can import this file. And as long as the import URL is the same then the browser with cache this module and reuse it.

```js
// main.js
import { name } from './name.js';
console.log(`Hi from JS ${name}!`);
```

```html
<!-- index.html -->
<html>
  <head>
    <title>Sample page</title>
    <script type="module">
      import { name } from './name.js';
      console.log(`Hi from HTML ${name}!`);
    </script>
    <script type="module" src="./main.js"></script>
  </head>
</html>
```

Our ES module can have a code that will be executed when module is imported for the first time.
Browser console will have two entries:

```
Hi from JS James Bond!
Hi from HTML James Bond!
```

In the example above we imported `name.js` module twice: from `main.js` and from `index.html`. The browser builds a module import URL (e.g `http://localhost/name.js`) and caches it. Because of this cache mechanism `name.js` is downloaded and executed once.
Query parameters in the URL will make a module unique. 


### Importing dependencies

If your project is small and you have no external dependencies then using ES modules directly is a great starting point. 

Let's see what happens if we add a single dependency. Lodash provides a convenient `debounce` implementation that I frequently use. Paste this import snippet into your browser console:

```js
const { default: debounce } = await import('https://unpkg.com/lodash-es@4.17.21/debounce.js');
```

A single function import fetches 14 files! This is where problems started to appear. Luckily, unpkg.com is not our only option.

```js
await import('https://esm.sh/lodash-es@4.17.21/debounce.js');
```

Esm.sh bundles the module into a single file. This import brings the amount of requests down to 2. And if we specify a direct import URL we can bring requests count down to just 1.


## Import map

Now that we have the basics covered let's talk about external dependencies. Existing bundlers either import a relative file or import a dependency from `node_modules` directory. If a file or dependency not found then it fails during build time. 

In the browser, however, we don't have a build phase. The web has solved this with URLs. Let's get back to our main module and pretend that we download it from `http://localhost`.
 
```js
// main.js
import { name } from './name.js';
// OR import { name } from 'http://localhost/name.js';
console.log(`Hi from JS ${name}!`);
```

Browser builds a module URL `http://localhost/main.js` and imports `name.js` relatively `http://localhost/name.js`.

> When importing from ES modules you have to use a relative path or a complete URL.

How about third-party dependencies? 

Sadly, there is no silver bullet here. You can vendor dependencies and host them yourself or you can import them from a CDN provider like [esm.sh](https://esm.sh/), [jspm](https://jspm.org/), [unpkg](https://unpkg.com/) or [skypack](https://www.skypack.dev/).

We can either import by a relative path or a complete URL. Does it mean that every time we want to import a lodash or some other library we will need to use a `https://esm.sh/lodash-es@4.17.21` monstrosity? No! This is exactly the problem that [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) is solving.

```html
<script type="importmap">
{
  "imports": {
    "lodash-es": "https://esm.sh/v124/lodash-es@4.17.21"
  }
}
</script>
```

If you include the above mentioned map before any of your imports then you can freely use `lodash-es`. 

Import maps not only allow you to alias your imports but also allow you to override [dependency's imports](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap#scoped_module_specifier_maps).

> Note that import map is for application use only. Import maps cannot be nested. If you are developing a library then you will need to use a different mechanism of managing dependencies. *(See what Deno recommends [here](https://deno.com/manual@v1.34.1/basics/import_maps#import-maps-are-for-applications))*


## Dynamic imports

Modules could be imported statically and dynamically. *Static imports* must be in the beginning of the file. They are always resolved and cannot have any variables in import paths. *Dynamic imports* on the other hand allow us to pick any strategy in import paths.
Static import is a statement while dynamic import is a function that returns a Promise.

```js
// main.js
const { name } = await import('./name.js');
console.log(`Hi from JS ${name}!`);
```

It turns out that we can even import the module from a string. *(Feel free to paste the snippet below in your browser console)*

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


## TypeScript

ES Modules work great in the browser until we start using TypeScript. Sadly, browsers cannot evaluate TypeScript as of now. Luckily, this problem is not as complex as it might sound. When browser imports a module it sends a plain GET HTTP request to the server. Server, however, could transpile TypeScript code on the fly and respond with a JavaScript file that browsers can parse.

```ts
// Transpile our TS file
const body = await Deno.readTextFile(filePath);
const res = await esbuild.transform(
  body,
  {
    loader: "ts",
  },
);
// Now we can respond with a JS file
```

> I will cover [ESBuild](https://esbuild.github.io/) more in the next blog post.
