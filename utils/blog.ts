import * as path from "$std/path/mod.ts";
import { walk, WalkEntry } from "$std/fs/walk.ts";
import { extract as extractFrontMatter } from "$std/front_matter/toml.ts";
import { marked } from "marked";
import { Renderer, TocHeading } from "@/utils/renderer.ts";

const baseDir = Deno.cwd();
const postsDir = path.join(baseDir, "posts");

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
  const html = marked.parse(body, {
    gfm: true,
    renderer: mdRenderer,
  }) as string;

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
