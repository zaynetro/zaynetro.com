import { Handler } from "$fresh/server.ts";

export const handler: Handler = async (req, _ctx): Promise<Response> => {
  const addr = _ctx.remoteAddr as Deno.NetAddr;

  return await fetch("https://plausible.io/api/event", {
    method: "POST",
    headers: {
      "User-Agent": req.headers.get("User-Agent") ?? "None",
      "X-Forwarded-For": addr.hostname,
      "Content-Type": "application/json",
    },
    body: await req.text(),
  });
};
