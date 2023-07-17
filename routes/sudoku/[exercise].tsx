import { baseTitle, Footer, globalStyles } from "@/components/Header.tsx";
import { asset, Head } from "$fresh/runtime.ts";
import { Handlers } from "$fresh/server.ts";
import { JSX } from "preact";
import SudokuXWing from "@/islands/sudoku/SudokuXWing.tsx";
import SudokuYWing from "@/islands/sudoku/SudokuYWing.tsx";

export type SudokuExercise = {
  slug: string;
  name: string;
  island: () => JSX.Element;
};

const xWing: SudokuExercise = {
  slug: "x-wing",
  name: "Find an X-wing",
  island: SudokuXWing,
};

const yWing: SudokuExercise = {
  slug: "y-wing",
  name: "Find a Y-wing",
  island: SudokuYWing,
};

export const exercises: SudokuExercise[] = [xWing, yWing];

export const handler: Handlers<PageProps> = {
  GET(_req, ctx) {
    const exercise = exercises.find((e) => e.slug == ctx.params.exercise);

    if (!exercise) {
      return new Response(null, {
        status: 301,
        headers: {
          "Location": "/sudoku",
        },
      });
    }

    return ctx.render({
      exercise,
    });
  },
};

type PageProps = {
  exercise: SudokuExercise;
};

export default function SudokuExercisePage({ data }: {
  data: PageProps;
}) {
  const { exercise } = data;
  const title = `${exercise.name} | Sudoku | ${baseTitle}`;
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <link
          rel="canonical"
          href={`https://www.zaynetro.com/sudoku/${exercise.slug}`}
        />
        <meta
          name="description"
          content={`${exercise.name}. Practice solving Sudoku online. Do you want to get better at Sudoku? Try completing this exercise.`}
        />
        <link rel="icon" href={asset("/favicon.png")} />
        <script
          defer
          data-domain="zaynetro.com"
          data-api="/js/stats-event"
          src="/js/stats.js"
        />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
        <style
          dangerouslySetInnerHTML={{
            __html: `
/* Disable zooming in mobile Safari  https://stackoverflow.com/a/62165035 */
body {
  touch-action: pan-x pan-y;
}`,
          }}
        />
      </Head>

      <header class="max-w-3xl mx-auto pt-6 px-4 flex gap-6 items-center">
        <a href="/" class="text-lg no-underline py-1.5">zaynetro.com</a>
        <div>
          <a href="/sudoku" class="text-md py-1">Sudoku exercises</a>
        </div>
      </header>

      <main class="max-w-3xl mx-auto px-4 mt-8">
        {exercise == xWing && <SudokuXWing />}
        {exercise == yWing && <SudokuYWing />}
      </main>

      <Footer />
    </>
  );
}
