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

import { BuildSnapshot } from "$fresh/src/build/mod.ts";
import * as base64 from "$std/encoding/base64.ts";

let snapshotText = await Deno.readTextFile("build/build.snapshot.json");
const snapshotJson = JSON.parse(snapshotText);
snapshotText = "";

export const snapshot: BuildSnapshot = {
  get paths() {
    return Object.keys(snapshotJson.files);
  },

  read(path: string): Uint8Array | null {
    const v = snapshotJson.files[path];
    if (!v) {
      return null;
    }

    return base64.decode(v);
  },

  dependencies(path: string): string[] {
    return snapshotJson.dependencies[path] ?? [];
  },
};

await start(manifest, {
  plugins: [twindPlugin(twindConfig)],
  snapshot,
});
