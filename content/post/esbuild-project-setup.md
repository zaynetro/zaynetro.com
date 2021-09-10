+++
author = "Roman Zaynetdinov"
date = 2021-09-06T12:00:00+03:00
title = "Use esbuild for your next JS project"
+++

## What esbuild

> An extremely fast JavaScript bundler

Ref: [esbuild.github.io](https://esbuild.github.io/)


## Why esbuild

I am tired of slow webpack builds that take dozens of seconds or sometimes even minutes to build. Esbuild solves that problem.

Another great thing about esbuild is that it comes as a single dependency. You don't need to install gazilion of webpack plugins to build your project. This greatly simplifies maintenance.

There are a few catches though...

1. Esbuild doesn't support some necessary features out of the box. See their [roadmap](https://esbuild.github.io/faq/#upcoming-roadmap).

   The lack of CSS modules could be solved by using plugins while others cannot be solved at all yet. E.g the support for dynamic imports is missing and could not be solved with a plugin.

1. There is no typescript type checking so you will need to run `tsc` yourself and this could lead to build slowness.

### Future

Once esbuild completes its roadmap your project could include only two dev dependencies: esbuild and typescript (for type checking). That's all*!

* I am yet to find a clean testing framework that doesn't pull XXX dependencies with it...


## How esbuild

Esbuild could be run from the command line or with a JS API.

```javascript
// build.mjs
import { build } from 'esbuild';

build({
  entryPoints: [
    './src/index.tsx',
  ],
  bundle: true,
  sourcemap: true,
  minify: true,
  target: 'es6',
  outdir: './dist',
}).catch(() => process.exit(1))
```

And build: `node build.mjs`

### Dev server

Esbuild comes with a built-in dev server. See usage example in the [sample project](https://github.com/zaynetro/esbuild-starter/blob/main/serve.mjs).


## Sample project

There is a [sample project](https://github.com/zaynetro/esbuild-starter) that you can play around with.
