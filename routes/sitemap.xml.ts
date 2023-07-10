import { Handlers } from "$fresh/server.ts";
import { blogPosts } from "@/posts.gen.ts";

export const handler: Handlers = {
  GET(req, _ctx) {
    const url = new URL(req.url);
    const baseUrl = "https://" + url.host;
    const posts = [...blogPosts.values()];

    const postEntries = posts.map((p) => `
<url>
  <loc>${baseUrl}/post/${p.slug}</loc>
</url>`).join("");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
    </url>
    ${postEntries}
</urlset>
`;

    return new Response(sitemap, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    });
  },
};
