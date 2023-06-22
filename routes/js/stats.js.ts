import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(_req, _ctx) {
    return fetch("https://plausible.io/js/script.js");
  },
};
