import { Footer, Header } from "@/components/Header.tsx";
import { Head } from "$fresh/runtime.ts";
import { Handlers } from "$fresh/server.ts";
import { JSX } from "preact";
import { PageProps } from "$fresh/server.ts";
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

export const handler: Handlers<SudokuProps> = {
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

type SudokuProps = {
  exercise: SudokuExercise;
};

export default function SudokuExercisePage(props: PageProps<SudokuProps>) {
  const { exercise } = props.data;

  return (
    <>
      <Head>
        <meta
          name="description"
          content={`${exercise.name}. Practice solving Sudoku online. Do you want to get better at Sudoku? Try completing this exercise.`}
        />
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

      <Header title={`${exercise.name} | Sudoku`} url={props.url} />

      <main class="max-w-3xl mx-auto px-4 mt-8">
        {exercise == xWing && <SudokuXWing />}
        {exercise == yWing && <SudokuYWing />}
      </main>

      <Footer />
    </>
  );
}
