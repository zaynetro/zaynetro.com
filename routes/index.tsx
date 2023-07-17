import { Footer, Header } from "@/components/Header.tsx";
import { isProd } from "@/utils/env.ts";
import { formatDate } from "@/routes/post/[slug].tsx";
import { Head } from "$fresh/runtime.ts";
import { blogPosts } from "@/build/posts.gen.ts";
import { PageProps } from "$fresh/server.ts";

export default function HomePage(props: PageProps) {
  const posts = [...blogPosts.values()]
    // Exclude draft posts in production
    .filter((p) => isProd ? !p.draft : true)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
        <section class="max-w-3xl mx-auto flex flex-col gap-8 px-2">
          {posts.map((p) => (
            <article class="flex gap-4">
              <div class="w-12 sm:w-16 shrink-0">
                {!!p.previewImage && (
                  <picture>
                    <source
                      media="(max-width: 640px)"
                      srcset={`/img?id=${p.previewImage.id}&w=48, /img?id=${p.previewImage.id}&w=96 2x`}
                    />
                    <img
                      src={`/img?id=${p.previewImage.id}&w=64`}
                      srcset={`/img?id=${p.previewImage.id}&w=64, /img?id=${p.previewImage.id}&w=128 2x`}
                      loading="lazy"
                      alt={p.previewImage.alt}
                      class="max-w max-h object-contain mx-auto"
                    />
                  </picture>
                )}
              </div>

              <div class="flex flex-col gap-1">
                <span class="text-gray-600 dark:text-gray-400 text-sm">
                  {formatDate(new Date(p.date))}
                </span>
                <h2 class="text-2xl">
                  <a href={`/post/${p.slug}`} class="no-underline">
                    {p.title}
                  </a>
                </h2>
              </div>
            </article>
          ))}
        </section>
      </main>

      <Footer />
    </>
  );
}
