import { Footer, Header } from "@/components/Header.tsx";
import { Head } from "$fresh/runtime.ts";
import { PageProps } from "$fresh/server.ts";
import IconBrandGithub from "@tabler/icons-preact/dist/esm/icons/IconBrandGithub.js";
import IconBrandLinkedin from "@tabler/icons-preact/dist/esm/icons/IconBrandLinkedin.js";
import IconFileTypePdf from "@tabler/icons-preact/dist/esm/icons/IconFileTypePdf.js";
import IconDog from "@tabler/icons-preact/dist/esm/icons/IconDog.js";
import IconGridDots from "@tabler/icons-preact/dist/esm/icons/IconGridDots.js";
import IconMail from "@tabler/icons-preact/dist/esm/icons/IconMail.js";
import * as path from "$std/path/mod.ts";
import { blogImages } from "@/build/posts.gen.ts";
import { ComponentChildren } from "preact";

// Register logo image
blogImages.set(
  "logo.jpg",
  path.join("static", "images", "logo.jpg"),
);

// Register bolik timeline logo
blogImages.set(
  "bolik-timeline-logo.png",
  path.join("static", "images", "bolik-timeline-logo.png"),
);

export default function AboutPage(props: PageProps) {
  return (
    <>
      <Head>
        <meta
          name="description"
          content="Welcome to my personal blog! I write about different technologies and things I am working on."
        />
      </Head>

      <Header url={props.url} />

      <main class="mt-8">
        <section class="max-w-xl mx-auto flex flex-col gap-8 px-2">
          <div class="flex gap-4 sm:gap-12">
            <div>
              <picture>
                <img
                  src="/img?id=logo.jpg&w=200"
                  srcset="/img?id=logo.jpg&w=200, /img?id=logo.jpg&w=400 2x"
                  loading="lazy"
                  class="w-[200px] h-[200px] object-cover rounded-lg shadow-md"
                  alt="Roman Zaynetdinov"
                />
              </picture>
            </div>
            <div>
              <h1 class="text-2xl sm:text-3xl">Hi, I'm Roman Zaynetdinov.</h1>
              <p class="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                I build services that help people.
              </p>

              <nav class="flex flex-col gap-4 mt-4">
                <ul class="flex flex-col gap-1">
                  <li>
                    <NavLink href="https://github.com/zaynetro">
                      <IconBrandGithub size={16} />
                      GitHub
                    </NavLink>
                  </li>

                  <li class="flex flex-col sm:flex-row gap-1 sm:gap-6">
                    <NavLink
                      href="https://www.linkedin.com/in/roman-zay/"
                      target="_blank"
                    >
                      <IconBrandLinkedin size={16} />
                      LinkedIn
                    </NavLink>
                  </li>

                  <li>
                    <NavLink href="mailto:roman@zaynetro.com">
                      <IconMail size={16} />
                      Get in touch
                    </NavLink>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          <div class="mt-4">
            <h2 class="text-2xl">Projects</h2>
            <ul class="list-inside flex flex-col gap-8 mt-4">
              <li>
                <h3 class="text-xl">
                  <NavLink
                    href="https://bolik.net"
                    target="_blank"
                  >
                    <IconDog size={16} />
                    Bolik
                  </NavLink>
                </h3>
                <p class="text-gray-600 dark:text-gray-400 mt-2">
                  Bolik helps you to make your website interactive in just a few
                  clicks. Configure UI and then choose an integration. Bolik
                  will generate a Web Component that you can include on your
                  page.
                </p>
              </li>
              <li>
                <h3 class="text-xl">
                  <NavLink href="/sudoku">
                    <IconGridDots size={16} />
                    Sudoku
                  </NavLink>
                </h3>
                <p class="text-gray-600 dark:text-gray-400 mt-2">
                  Solve exercises to become better at Sudoku.
                </p>
              </li>
              <li>
                <h3 class="text-xl">
                  <NavLink
                    href="https://timeline.bolik.tech"
                    target="_blank"
                  >
                    <img
                      src="/img?id=bolik-timeline-logo.png&w=100"
                      loading="lazy"
                      class="w-[50px] h-[50px] object-cover"
                      alt="Bolik Timeline logo"
                    />
                    Bolik Timeline
                  </NavLink>
                </h3>
                <p class="text-gray-600 dark:text-gray-400 mt-2">
                  Bolik Timeline is an application for managing personal
                  documents like notes, photos and memories. It supports offline
                  editing, is end-to-end encrypted and is open source.
                </p>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <Footer />
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
    <a
      href={href}
      target={target}
      class="inline-flex gap-2 items-center py-1.5 sm:py-0"
    >
      {children}
    </a>
  );
}
