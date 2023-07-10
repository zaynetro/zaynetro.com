import { MiddlewareHandlerContext } from "$fresh/server.ts";

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext,
) {
  const url = new URL(req.url);

  if (
    url.pathname.startsWith("/bundler-demo/") && url.pathname.endsWith(".ts")
  ) {
    const res = await ctx.next();
    res.headers.set("Content-Type", "application/typescript");
    return res;
  }

  return await ctx.next();
}
