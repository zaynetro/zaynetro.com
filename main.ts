/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import "$std/dotenv/load.ts";

import { start } from "$fresh/server.ts";
import manifest from "@/fresh.gen.ts";

import twindPlugin from "$fresh/plugins/twindv1.ts";
import twindConfig from "@/twind.config.ts";
import { loadPosts } from "@/utils/blog.ts";

{
  const t0 = performance.now();
  await loadPosts();
  const t1 = performance.now();
  console.log(`Loading posts took ${t1 - t0}ms`);
}

await start(manifest, { plugins: [twindPlugin(twindConfig)] });
