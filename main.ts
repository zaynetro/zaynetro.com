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

/**
 * Lazy-loaded snapshot. Read JSON file only when needed.
 * (Atm called only on Sudoku page)
 */
const lazySnapshot = (function () {
  let json: {
    paths: string[];
    deps: Record<string, string[]>;
  } | null = null;

  return {
    get value() {
      if (!json) {
        // load
        const t0 = performance.now();
        const snapshotText = Deno.readTextFileSync(
          path.join("build", "build.snapshot.json"),
        );
        const t1 = performance.now();
        json = JSON.parse(snapshotText);
        console.log(`Loaded snapshot in ${t1 - t0}ms`);
      }

      return json!;
    },
  };
})();

const filesDir = path.join("build", "files");

export const snapshot: BuildSnapshot = {
  get paths() {
    return lazySnapshot.value.paths;
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
    return lazySnapshot.value.deps[path] ?? [];
  },
};

await start(manifest, {
  plugins: [twindPlugin(twindConfig)],
  snapshot,
});
