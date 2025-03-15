import * as path from "$std/path/mod.ts";
import { marked } from "marked";
import { default as Prism } from "prismjs";
import { ASSET_CACHE_BUST_KEY } from "$fresh/runtime.ts";
import GithubSlugger from "github-slugger";

// Support more languages (by default only HTML, JS and CSS are supported)
import "prismjs/components/prism-typescript?no-check";
import "prismjs/components/prism-bash?no-check";
import "prismjs/components/prism-cmake?no-check";
import "prismjs/components/prism-dart?no-check";
import "prismjs/components/prism-diff?no-check";
import "prismjs/components/prism-java?no-check";
import "prismjs/components/prism-jsx?no-check";
import "prismjs/components/prism-nix?no-check";
import "prismjs/components/prism-protobuf?no-check";
import "prismjs/components/prism-rust?no-check";
import "prismjs/components/prism-toml?no-check";
import "prismjs/components/prism-sql?no-check";
import "prismjs/components/prism-xml-doc?no-check";
import { BrowserRenderer } from "@/utils/browser_renderer.ts";

console.log("Syntax highlight for languages", Object.keys(Prism.languages));

const baseDir = Deno.cwd();

export type TocHeading = {
  entry: TocEntry;
  subheadings: TocEntry[];
};

export type TocEntry = {
  text: string;
  slug: string;
};

// Ref: https://deno.land/x/gfm@0.2.3/mod.ts?source#L23
const anchorIcon =
  '<svg class="octicon octicon-link" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path></svg>';

/** Inject tailwind class names */
export class Renderer extends BrowserRenderer {
  /* Table of contents */
  toc: TocHeading[] = [];
  /* Mermaid is used */
  mermaid = false;

  slugger = new GithubSlugger();

  constructor(
    private filePath: string,
    private fileSlug: string,
    private images: Map<string, string>,
  ) {
    super();
  }

  override heading(
    text: string,
    level: 1 | 2 | 3 | 4 | 5 | 6,
    raw: string,
  ): string {
    const slug = this.slugger.slug(raw);
    const c = level == 1 ? "text-xl" : "text-lg";
    const tocEntry: TocEntry = {
      text: text
        .replaceAll("&amp;", "&")
        .replaceAll("&quot;", `"`)
        .replaceAll("&#39;", `'`),
      slug,
    };
    if (level == 2) {
      this.toc.push({
        entry: tocEntry,
        subheadings: [],
      });
    } else if (level == 3 && this.toc.length) {
      this.toc[this.toc.length - 1].subheadings.push(tocEntry);
    }

    return (
      `<h${level} class="mt-2 ${c}" id="${slug}">` +
      /**/ `<a class="anchor" aria-hidden="true" tabindex="-1" href="#${slug}">` +
      /*  */ `${anchorIcon}` +
      /**/ `</a>` +
      /**/ `${text}` +
      `</h${level}>`
    );
  }

  override html(html: string, block: boolean): string {
    const trimmed = html.trim();
    if (block && trimmed.startsWith("<mermaid-block")) {
      const lines = trimmed.split("\n");
      const tagStart = lines[0];
      const matches = tagStart.match(/name="(.+)"/);
      if (!matches || matches.length < 2) {
        throw new Error("Invalid use of a <mermaid-block>");
      }

      const code = lines.slice(1, -1).join("\n");
      const name = matches[1];

      this.mermaid = true;

      return `
<section class="mermaid-block">
  <pre class="mermaid">${code}</pre>
  <div class="mermaid-label">
    <i>Diagram: ${name}</i>
  </div>
</section>`;
    } else if (block && trimmed.startsWith("<labeled-img")) {
      const lines = trimmed.split("\n");
      const tagStart = lines[0];
      const matches = tagStart.match(/label="(.+)"/);
      if (!matches || matches.length < 2) {
        throw new Error("Invalid use of a <labeled-img>");
      }

      const body = lines.slice(1, -1)
        .map((line) => {
          const matches = line.match(/\<img src="([^"]+)"/);

          if (!matches || matches.length < 2) {
            // Image not found
            return line;
          }

          const src = matches[1];
          const dirname = path.dirname(this.filePath);
          const imagePath = path.join(dirname, src);

          const id = this.fileSlug + "/" + path.basename(imagePath);
          this.images.set(id, path.relative(baseDir, imagePath));

          return line.replace(src, imgHref({ id, file: imagePath }));
        })
        .join("\n");
      const label = marked.parseInline(matches[1], {});

      this.mermaid = true;

      return `
<section class="img-block">
  <div class="img-block-list">${body}</div>
  <div class="img-block-label">${label}</div>
</section>`;
    } else if (trimmed == "<u>" || trimmed == "</u>" || trimmed == "<br />") {
      return html;
    }

    return html;
  }

  override image(src: string, title: string | null, alt: string | null) {
    if (src.startsWith("http")) {
      return `
<a href="${src}" class="img-link">
  <img src="${src}" alt="${alt ?? ""}" title="${title ?? ""}" />
</a>`;
    }

    const dirname = path.dirname(this.filePath);
    const imagePath = path.join(dirname, src);
    const info = Deno.lstatSync(imagePath);

    const id = this.fileSlug + "/" + path.basename(imagePath);
    this.images.set(id, path.relative(baseDir, imagePath));

    const imgSrc = (width?: number) => imgHrefWithInfo({ info, width, id });

    if (title?.includes("no-resize")) {
      title = title?.replaceAll("no-resize", "");

      return `
<img
  src="${imgSrc()}"
  alt="${alt ?? ""}"
  title="${title ?? ""}"
/>`;
    }

    return `
<a href="${imgSrc()}" class="img-link">
  <picture>
    <source
      media="(max-width: 500px)"
      srcset="${imgSrc(500)}, ${imgSrc(1000)} 2x" />

    <img
      src="${imgSrc(900)}"
      srcset="${imgSrc(900)}, ${imgSrc(1800)} 2x"
      alt="${alt ?? ""}"
      title="${title ?? ""}" />
  </picture>
</a>`;
  }
}

function imgHref({
  file,
  id,
  width,
}: {
  file: string;
  id: string;
  width?: number;
}) {
  const info = Deno.lstatSync(file);
  return imgHrefWithInfo({ info, id, width });
}

function imgHrefWithInfo({
  info,
  id,
  width,
}: {
  info: Deno.FileInfo;
  id: string;
  width?: number;
}) {
  const cacheId = info.mtime?.getTime() ?? 0;
  let href = `/img?id=${id}`;

  if (width) {
    href += `&w=${width}`;
  } else {
    href += `&orig`;
  }

  href += `&${ASSET_CACHE_BUST_KEY}=${cacheId}`;

  return href;
}
