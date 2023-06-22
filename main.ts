/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "$std/dotenv/load.ts";

import { start } from "$fresh/server.ts";
import manifest from "@/fresh.gen.ts";

import twindPlugin from "$fresh/plugins/twindv1.ts";
import twindConfig from "@/twind.config.ts";
import { loadPosts } from "@/utils/blog.ts";

await loadPosts();

await start(manifest, { plugins: [twindPlugin(twindConfig)] });
