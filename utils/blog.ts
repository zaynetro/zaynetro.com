import * as path from "$std/path/mod.ts";
import { walk, WalkEntry } from "$std/fs/walk.ts";
import { extract as extractFrontMatter } from "$std/front_matter/toml.ts";
import * as Marked from "marked";
import { default as Prism } from "prismjs";

// Support more languages (by default only HTML, JS and CSS are supported)
import "prismjs/components/prism-typescript?no-check";
import "prismjs/components/prism-bash?no-check";
import "prismjs/components/prism-cmake?no-check";
import "prismjs/components/prism-dart?no-check";
import "prismjs/components/prism-diff?no-check";
import "prismjs/components/prism-java?no-check";
import "prismjs/components/prism-nix?no-check";
import "prismjs/components/prism-protobuf?no-check";
import "prismjs/components/prism-rust?no-check";
import "prismjs/components/prism-toml?no-check";
import "prismjs/components/prism-sql?no-check";
import "prismjs/components/prism-xml-doc?no-check";
import { asset } from "$fresh/runtime.ts";

const baseDir = Deno.cwd();
const postsDir = path.join(baseDir, "posts");

// Ref: https://deno.land/x/gfm@0.2.3/mod.ts?source#L23
const anchorIcon =
  '<svg class="octicon octicon-link" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path></svg>';

console.log("Supported languages", Object.keys(Prism.languages));

/** Inject tailwind class names */
class Renderer extends Marked.Renderer {
  /* Table of contents */
  toc: TocHeading[] = [];
  /* Mermaid is used */
  mermaid = false;

  constructor(
    private filePath: string,
    private fileSlug: string,
    private images: Map<string, string>,
  ) {
    super();
  }

  heading(
    text: string,
    level: 1 | 2 | 3 | 4 | 5 | 6,
    raw: string,
    slugger: Marked.Slugger,
  ): string {
    const slug = slugger.slug(raw);
    const c = level == 1 ? "text-xl" : "text-lg";
    const tocEntry: TocEntry = {
      text: text.replaceAll("&amp;", "&").replaceAll("&quot;", `"`),
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
    return `<h${level} class="mt-2 ${c}" id="${slug}"><a class="anchor" aria-hidden="true" tabindex="-1" href="#${slug}">${anchorIcon}</a>${text}</h${level}>`;
  }

  code(code: string, language?: string) {
    const grammar =
      language && Object.hasOwnProperty.call(Prism.languages, language)
        ? Prism.languages[language]
        : undefined;
    if (!grammar) {
      return `<pre><code class="notranslate">${code}</code></pre>`;
    }
    const html = Prism.highlight(code, grammar, language!);
    return `<div class="highlight highlight-source-${language} notranslate"><pre>${html}</pre></div>`;
  }

  html(html: string, block: boolean): string {
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
          Deno.lstatSync(imagePath);

          const id = this.fileSlug + "/" + path.basename(imagePath);
          this.images.set(id, path.relative(baseDir, imagePath));

          return line.replace(src, asset(`/img?id=${id}&orig`));
        })
        .join("\n");
      const label = Marked.marked.parseInline(matches[1], {
        headerIds: undefined,
        mangle: undefined,
      });

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

  image(src: string, title: string | null, alt: string | null) {
    if (src.startsWith("http")) {
      return `
<a href="${src}" class="img-link">
  <img src="${src}" alt="${alt ?? ""}" title="${title ?? ""}" />
</a>`;
    }

    const dirname = path.dirname(this.filePath);
    const imagePath = path.join(dirname, src);
    Deno.lstatSync(imagePath);

    const id = this.fileSlug + "/" + path.basename(imagePath);
    this.images.set(id, path.relative(baseDir, imagePath));

    if (title?.includes("no-resize")) {
      title = title?.replaceAll("no-resize", "");

      return `
<img
  src="/img?id=${id}&orig"
  alt="${alt ?? ""}"
  title="${title ?? ""}"
/>`;
    }

    return `
<a href="/img?id=${id}&orig" class="img-link">
  <picture>
    <source
      media="(max-width: 500px)"
      srcset="${this.imgSrc(id, 500)}, ${this.imgSrc(id, 1000)} 2x" />

    <img
      src="${this.imgSrc(id, 900)}"
      srcset="${this.imgSrc(id, 900)}, ${this.imgSrc(id, 1800)} 2x"
      alt="${alt ?? ""}"
      title="${title ?? ""}" />
  </picture>
</a>`;
  }

  private imgSrc(id: string, w: number): string {
    return asset(`/img?id=${id}&w=${w}`);
  }
}

export type BlogPost = {
  slug: string;
  title: string;
  draft: boolean;
  description?: string;
  html: string;
  date: string;
  previewImage?: PreviewImage;
  /* Table of contents */
  toc: TocHeading[];
  /* Mermaid is used */
  mermaid: boolean;
};

type PreviewImage = {
  id: string;
  alt: string;
};

type TocHeading = {
  entry: TocEntry;
  subheadings: TocEntry[];
};

type TocEntry = {
  text: string;
  slug: string;
};

export async function loadPosts(): Promise<{
  posts: Map<string, BlogPost>;
  images: Map<string, string>;
}> {
  /** All known blog posts. Slug to post mapping. */
  const posts = new Map<string, BlogPost>();
  /** All known blog images. ID to path mapping. */
  const images = new Map<string, string>();

  for await (
    const file of walk(postsDir, {
      maxDepth: 2,
      exts: [".md"],
    })
  ) {
    await loadPost(file, { posts, images });
  }

  return { posts, images };
}

async function loadPost(file: WalkEntry, {
  posts,
  images,
}: {
  posts: Map<string, BlogPost>;
  images: Map<string, string>;
}) {
  // If file is index.md then use directory as slug otherwise use markdown file name.
  let slug: string;
  if (file.path.endsWith("index.md")) {
    // Use directory name in which index.md is located
    slug = path.basename(path.dirname(file.path));
  } else {
    // Use file name without the extension
    slug = path.basename(file.path).split(".")[0];
  }
  const text = await Deno.readTextFile(file.path);
  const { body, attrs } = extractFrontMatter(text);

  const mdRenderer = new Renderer(file.path, slug, images);
  const html = Marked.marked(body, {
    gfm: true,
    renderer: mdRenderer,
    mangle: undefined,
    headerIds: undefined,
  });

  const post: BlogPost = {
    slug,
    title: attrs.title! as string,
    draft: !!attrs.draft,
    description: attrs.description as string | undefined,
    html,
    date: new Date(Date.parse(attrs.date! as string)).toISOString(),
    toc: mdRenderer.toc,
    mermaid: mdRenderer.mermaid,
  };

  const extraAttrs = attrs.extra as Record<string, unknown> | undefined;
  if (extraAttrs?.preview_image) {
    const previewImage = extraAttrs!.preview_image as {
      href: string;
      alt: string;
    };
    // Verify that image exists
    const dirname = path.dirname(file.path);
    const imagePath = path.join(dirname, previewImage.href);
    await Deno.lstat(imagePath);

    const imgId = slug + "/" + path.basename(imagePath);
    post.previewImage = {
      id: imgId,
      alt: previewImage.alt,
    };
    images.set(imgId, path.relative(baseDir, imagePath));
  }

  posts.set(slug, post);
  console.log(
    "Processed",
    path.relative(baseDir, file.path),
    post.draft ? "(draft)" : "",
  );
}
