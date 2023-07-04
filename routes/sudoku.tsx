import { baseTitle, Footer, globalStyles } from "@/components/Header.tsx";
import { asset, Head } from "$fresh/runtime.ts";
import { exercises } from "@/routes/sudoku/[exercise].tsx";

export default function SudokuPage() {
  const title = `Sudoku | ${baseTitle}`;
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <meta name="description" content="Practice Sudoku solving online." />
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
        <a href="/" class="text-lg no-underline">zaynetro.com</a>
      </header>

      <main class="max-w-xl mx-auto mt-8 mb-16 flex flex-col gap-4 px-4">
        <h1 class="text-2xl">Pick Sudoku exercises</h1>
        <ul class="flex flex-col gap-4 mt-4 ml-6 list-disc">
          {exercises.map((e) => (
            <li>
              <a href={`/sudoku/${e.slug}`}>{e.name}</a>
            </li>
          ))}
        </ul>
      </main>

      <Footer />
    </>
  );
}
