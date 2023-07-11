import { defineConfig, Preset } from "@twind/core";
import { Options } from "$fresh/plugins/twindv1.ts";
import presetTailwind from "@twind/preset-tailwind";

export default {
  selfURL: import.meta.url,
  ...defineConfig({
    presets: [presetTailwind() as Preset],
  }),
} as Options;
