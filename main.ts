/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { start } from "$fresh/server.ts";
import manifest from "@/fresh.gen.ts";

import twindPlugin from "$fresh/plugins/twindv1.ts";
import twindConfig from "@/twind.config.ts";

import { BuildSnapshot } from "$fresh/src/build/mod.ts";
import * as path from "$std/path/mod.ts";

const t0 = performance.now();
let snapshotText = await Deno.readTextFile("build/build.snapshot.json");
const snapshotJson = JSON.parse(snapshotText);
snapshotText = "";

const filesDir = path.join(Deno.cwd(), "build", "files");

export const snapshot: BuildSnapshot = {
  get paths() {
    return snapshotJson.paths;
  },

  read(p: string): ReadableStream<Uint8Array> | null {
    try {
      const file = Deno.openSync(path.join(filesDir, p));
      return file.readable;
    } catch (e) {
      if (!(e instanceof Deno.errors.NotFound)) {
        throw e;
      }

      return null;
    }
  },

  dependencies(path: string): string[] {
    return snapshotJson.deps[path] ?? [];
  },
};

const t1 = performance.now();
console.log(`Took ${t1 - t0}ms to start`);

await start(manifest, {
  plugins: [twindPlugin(twindConfig)],
  snapshot,
});
