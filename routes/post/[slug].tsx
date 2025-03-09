import { Footer, Header } from "@/components/Header.tsx";
import { blogPosts } from "@/build/posts.gen.ts";
import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import BlogPostImports from "@/islands/BlogPostImports.tsx";
import BlogPostEnd from "@/islands/BlogPostEnd.tsx";
import {
  GFM_CSS,
  GFM_CSS_CODE,
  GFM_CSS_CUSTOM,
  GFM_VARS,
} from "@/utils/css.ts";

export default function PostPage(props: PageProps) {
  const post = blogPosts.get(props.params.slug);

  if (!post) {
    return (
      <>
        <Header title="Not found" url={props.url} />

        <main class="mt-8">
          <section class="max-w-xl mx-auto">
            <h1>Not found</h1>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        {!!post.description && (
          <meta name="description" content={post.description} />
        )}

        <style>{GFM_VARS}</style>
        <style>{GFM_CSS}</style>
        <style>{GFM_CSS_CODE}</style>
        <style>{GFM_CSS_CUSTOM}</style>
      </Head>
      <Header title={post.title} url={props.url} />

      <div class="mt-4 px-4">
        <div class="mt-8 max-w-4xl mx-auto">
          <div class="text-gray-600 dark:text-gray-400 text-sm pb-2">
            {formatDate(new Date(post.date))}
          </div>
          <h1 class="text-3xl dark:text-gray-200">{post.title}</h1>
        </div>

        <div class="mt-4 flex flex-col xl:flex-row">
          <section class="static xl:sticky xl:grow xl:shrink xl:basis-0 xl:self-start pt-2 xl:top-0 xl:mr-2 xl:mr-4">
            <ul class="mx-auto list-disc list-inside max-w-3xl xl:max-w-lg text-gray-700">
              <li>
                <a href="#">↑ Top</a>
              </li>
              {post.toc!.map((heading) => (
                <li>
                  <a href={`#${heading.entry.slug}`}>{heading.entry.text}</a>

                  {!!heading.subheadings && (
                    <ul class="list-[circle] list-inside ml-6">
                      {heading.subheadings.map((sub) => (
                        <li>
                          <a href={`#${sub.slug}`}>
                            {sub.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <main class="max-w-4xl mx-0 md:mx-auto mt-4 xl:mt-0 xl:grow">
            <div
              class="my-2 markdown-body"
              // deno-lint-ignore react-no-danger
              dangerouslySetInnerHTML={{ __html: post.html! }}
            />

            <div class="mt-4">
              <BlogPostEnd />
            </div>
          </main>

          <div class="hidden xl:block xl:grow xl:shrink xl:basis-0" />
        </div>
      </div>

      <Footer />

      <BlogPostImports mermaid={post.mermaid} />
    </>
  );
}

export function formatDate(d: Date) {
  const month = ("" + (d.getMonth() + 1)).padStart(2, "0");
  const day = ("" + (d.getDate())).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}
