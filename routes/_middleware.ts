import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { serveDir, serveFile } from "$std/http/file_server.ts";
import * as path from "$std/path/mod.ts";

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext,
) {
  const url = new URL(req.url);
  console.log("request", url.pathname);

  if (
    url.pathname.startsWith("/bundler-demo/") && url.pathname.endsWith(".ts")
  ) {
    // const res = await serveDir(req, {
    //   fsRoot: path.join(Deno.cwd(), "static"),
    //   // urlRoot: "_src/",
    //   showIndex: false,
    //   quiet: true,
    // });
    const res = await ctx.next();
    res.headers.set("Content-Type", "application/typescript");
    return res;

    // const res = await serveFile(
    //   req,
    //   path.join(Deno.cwd(), "static", url.pathname),
    // );
    // const body = await Deno.readTextFile(
    //   path.join(Deno.cwd(), "static", url.pathname),
    // );
    // console.log('body', body);
    // return new Response(body, {
    //   headers: {
    //     "Content-Type": "application/typescript",
    //   },
    // });
  }

  return await ctx.next();
}
