import { Footer, Header } from "@/components/Header.tsx";
import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { exercises } from "@/routes/sudoku/[exercise].tsx";

export default function SudokuPage(props: PageProps) {
  return (
    <>
      <Head>
        <meta
          name="description"
          content="Practice solving Sudoku online. Do you want to get better at Sudoku? Try completing these exercises."
        />
      </Head>

      <Header title="Sudoku" url={props.url} />

      <main class="max-w-xl mx-auto mt-8 mb-16 flex flex-col gap-4 px-4">
        <h1 class="text-2xl">Pick Sudoku exercises</h1>
        <ul class="flex flex-col gap-4 mt-4 ml-6 list-disc">
          {exercises.map((e) => (
            <li>
              <a
                href={`/sudoku/${e.slug}`}
                class="py-1"
              >
                {e.name}
              </a>
            </li>
          ))}
        </ul>

        {/* Next sudoku exercise poll */}
        <div class="mt-48 h-52">
          <bk-poll-form></bk-poll-form>
          <script
            async
            src="https://cdn.bolik.net/ui/123a845qgb381/bk-poll-form.js"
          >
          </script>

          <div class="mt-4 text-xs text-gray-500">
            Poll powered by{" "}
            <a href="https://bolik.net" target="_blank">Bolik</a>.
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

// This import is needed to allow extending module declaration.
import "preact";

declare module "preact" {
  namespace JSX {
    interface IntrinsicElements {
      "bk-poll-form": BkPollFormAttrs;
    }
  }
}

interface BkPollFormAttrs extends preact.JSX.HTMLAttributes<HTMLElement> {
  href?: string;
}
