import { asset, Head } from "$fresh/runtime.ts";
import * as path from "$std/path/mod.ts";
import { blogImages } from "@/posts.gen.ts";

export const baseTitle = "Roman Zaynetdinov (zaynetro)";

export const globalStyles = `
:root {
  --text-color: #333;
  --a-hover-color: #ffe69c;
}


@media (prefers-color-scheme: dark) {
  :root {
    --text-color: #f1f1f1;
    --a-hover-color: #826e30;
  }

  body {
    background-color: #111;
  }
}

body {
  color: var(--text-color);
}

a {
  color: var(--text-color);
  overflow-wrap: break-word;
  padding: 1px 2px;
  border-radius: 5px;
  text-decoration: underline dotted #777;
  text-decoration-thickness: from-font;
}

a:hover {
  background-color: var(--a-hover-color);
  text-decoration: none;
}
`;

// Register our logo image
blogImages.set(
  "logo.png",
  path.join(Deno.cwd(), "static", "images", "logo.png"),
);

export function Header({
  title,
}: {
  title?: string;
}) {
  const pageTitle = title ? `${title} | ${baseTitle}` : baseTitle;

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{pageTitle}</title>
        <meta property="og:title" content={pageTitle} />
        <link rel="icon" href={asset("/favicon.png")} />
        <script
          defer
          data-domain="zaynetro.com"
          data-api="/js/stats-event"
          src="/js/stats.js"
        />

        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </Head>

      <header class="max-w-3xl mx-auto pt-6 px-4">
        <div class="flex gap-12">
          <a
            href="/"
            class="block rounded-md p-2 hover:bg-amber-200 hover:dark:bg-amber-300 transition-colors"
          >
            <picture>
              <img
                src="/img?id=logo.png&w=100"
                srcset="/img?id=logo.png&w=155, /img?id=logo.png&w=312 2x"
                loading="lazy"
                alt="Racoon"
                width="100"
                height="155"
              />
            </picture>
          </a>

          <nav class="flex flex-col gap-4">
            <a href="/" class="text-lg no-underline">zaynetro.com</a>

            <ul class="flex flex-col gap-1 list-disc ml-4">
              <li>
                <a href="https://github.com/zaynetro">GitHub</a>
              </li>

              <li>
                <a href="https://www.linkedin.com/in/roman-zay/">CV</a>
              </li>

              <li>
                <a href="mailto:roman@zaynetro.com">Get in touch</a>
              </li>

              <li>
                <a href="/sudoku">Sudoku</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}

export function Footer() {
  return (
    <footer class="text-center mt-8 mb-4 px-4">
      <p class="inline-flex flex-col sm:flex-row text-gray-700 dark:text-gray-200 text-sm gap-2">
        <span>
          Roman Zaynetdinov (zaynetro) {new Date().getFullYear()}
        </span>
        <span class="hidden sm:block text-gray-300">|</span>
        <span>
          <a href="https://github.com/zaynetro/zaynetro.com">
            Source
          </a>
        </span>
        <span class="hidden sm:block text-gray-300">|</span>
        <span>
          <a href="mailto:roman@zaynetro.com">Get in touch</a>
        </span>
      </p>
    </footer>
  );
}
