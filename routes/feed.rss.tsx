// deno-lint-ignore-file jsx-void-dom-elements-no-children

import { Handler } from "$fresh/server.ts";
import render from "preact-render-to-string/jsx.js";
import { baseTitle } from "@/components/Header.tsx";
import { publishedPosts as posts } from "@/utils/env.ts";

export const handler: Handler = (_req, _ctx): Response => {
  const feed = render(
    <rss
      version="2.0"
      xmlns:content="http://purl.org/rss/1.0/modules/content/"
      xmlns:wfw="http://wellformedweb.org/CommentAPI/"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:atom="http://www.w3.org/2005/Atom"
      xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
      xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
    >
      <channel>
        <title>{baseTitle}</title>
        <link>https://www.zaynetro.com</link>
        <atom:link
          href="https://www.zaynetro.com/feed.rss"
          rel="self"
          type="application/rss+xml"
        />
        <description>
          Welcome to my personal blog! I write about different technologies and
          things I am working on.
        </description>
        <language>en-US</language>

        {posts.map((post) => (
          <item>
            <title>{post.title}</title>
            <guid isPermaLink="false">
              https://www.zaynetro.com/post/{post.slug}
            </guid>
            <link>https://www.zaynetro.com/post/{post.slug}</link>
            <pubDate>{(new Date(post.date)).toUTCString()}</pubDate>
            <description>{post.description}</description>
            <content:encoded
              // deno-lint-ignore react-no-danger
              dangerouslySetInnerHTML={{
                __html: `<![CDATA[${post.html}]]>`,
              }}
            >
            </content:encoded>
          </item>
        ))}
      </channel>
    </rss>,
    {},
    { pretty: true },
  )
    // Preact renders xmlns:* attributes as xmlns::*
    .replaceAll("xmlns::", "xmlns:");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>${feed}`,
    {
      headers: {
        "content-type": "text/xml; charset=utf-8",
      },
    },
  );
};

// This import is needed to allow extending module declaration.
import "preact";

type NoAttrs = preact.JSX.HTMLAttributes<HTMLElement>;

declare module "preact" {
  namespace JSX {
    interface IntrinsicElements {
      "channel": NoAttrs;
      "description": NoAttrs;
      "language": NoAttrs;
      "pubDate": NoAttrs;
      "item": NoAttrs;
      "guid": GuidAttrs;
      "content:encoded": NoAttrs;
      "atom:link": NoAttrs;
      "rss": RssAttrs;
    }
  }
}

interface RssAttrs extends preact.JSX.HTMLAttributes<HTMLElement> {
  version: string;
  "xmlns:content": string;
  "xmlns:wfw": string;
  "xmlns:dc": string;
  "xmlns:atom": string;
  "xmlns:sy": string;
  "xmlns:slash": string;
}

interface GuidAttrs extends preact.JSX.HTMLAttributes<HTMLElement> {
  isPermaLink: string;
}
