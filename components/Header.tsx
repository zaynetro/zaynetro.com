import { asset, Head } from "$fresh/runtime.ts";
import IconGridDots from "@tabler/icons-preact/dist/esm/icons/IconGridDots.js";
import { ComponentChildren } from "preact";

export const baseTitle = "Roman Zaynetdinov (zaynetro)";

export function Header({
  title,
  url,
}: {
  title?: string;
  url: URL;
}) {
  const pageTitle = title ? `${title} | ${baseTitle}` : baseTitle;

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{pageTitle}</title>
        <meta property="og:title" content={pageTitle} />
        <link
          rel="canonical"
          href={`https://www.zaynetro.com${url.pathname}`}
        />
        <link rel="icon" href={asset("/favicon.png")} />
        <link rel="stylesheet" href="/styles.css" />
        <link
          rel="alternate"
          type="application/rss+xml"
          href="https://zaynetro.com/feed.rss"
        />
        <script
          defer
          data-domain="zaynetro.com"
          data-api="/js/stats-event"
          src="/js/stats.js"
        />
      </Head>

      <header class="max-w-3xl mx-auto pt-10 pb-6 px-4">
        <nav class="flex gap-4 flex-wrap sm:flex-nowrap justify-between items-center">
          <a href="/" class="text-lg no-underline">zaynetro.com</a>

          <div class="flex gap-4">
            <a href="/" class="text-lg no-underline py-1.5 sm:py-0 px-2">
              Blog
            </a>
            <a href="/about" class="text-lg no-underline py-1.5 sm:py-0 px-2">
              About
            </a>
          </div>

          <ul class="flex gap-2 text-lg">
            <NavLink href="/sudoku">
              <IconGridDots size={16} />
              Sudoku
            </NavLink>
          </ul>
        </nav>
      </header>
    </>
  );
}

function NavLink({
  href,
  target,
  children,
}: {
  href: string;
  target?: string;
  children: ComponentChildren;
}) {
  return (
    <li>
      <a
        href={href}
        target={target}
        class="inline-flex gap-1 items-center py-1.5 sm:py-0 px-2"
      >
        {children}
      </a>
    </li>
  );
}

export function Footer() {
  return (
    <footer class="text-center mt-8 mb-4 px-4">
      <div class="inline-flex flex-col sm:flex-row text-gray-700 dark:text-gray-200 text-sm gap-4">
        <span>
          Roman Zaynetdinov (zaynetro) {new Date().getFullYear()}
        </span>
        <span class="hidden sm:block text-gray-300">|</span>

        <div class="flex gap-4 justify-center">
          <span>
            <a
              href="https://github.com/zaynetro/zaynetro.com"
              class="py-1.5 sm:py-0"
            >
              Source
            </a>
          </span>
          <span class="text-gray-300">|</span>
          <span>
            <a
              href="mailto:roman@zaynetro.com"
              class="py-1.5 sm:py-0"
            >
              Get in touch
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
