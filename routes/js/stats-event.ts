import { Handler } from "$fresh/server.ts";

export const handler: Handler = async (req, ctx): Promise<Response> => {
  const addr = ctx.remoteAddr;

  return await fetch("https://plausible.io/api/event", {
    method: "POST",
    headers: {
      "User-Agent": req.headers.get("User-Agent") ?? "None",
      // On Deno Deploy addr was undefined sometimes ...
      "X-Forwarded-For": addr?.hostname,
      "Content-Type": "application/json",
    },
    body: await req.text(),
  });
};
