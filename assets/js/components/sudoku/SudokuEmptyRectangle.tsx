import { useSignal } from "@preact/signals";
import {
  Exercise,
  SingleExercise,
  SolvedStep,
} from "@/components/SudokuExercise.tsx";

const materials = [
  "https://sudokusolver.app/emptyrectangle.html",
  "https://www.youtube.com/watch?v=xbd6UeNWhI0&t=1002s",
];

const exercises: Exercise[] = [{
  grid: [
    [6, 1, 0, 0, 2, 5, 8, 3, 4],
    [0, 4, 3, 8, 0, 1, 2, 6, 0],
    [8, 0, 2, 6, 3, 4, 7, 1, 0],
    [2, 3, 0, 0, 6, 0, 0, 0, 8],
    [1, 0, 8, 0, 5, 3, 0, 2, 6],
    [4, 6, 0, 0, 8, 2, 0, 7, 0],
    [3, 2, 1, 5, 4, 8, 6, 9, 7],
    [0, 0, 4, 2, 0, 6, 0, 8, 0],
    [0, 8, 6, 3, 1, 0, 0, 0, 2],
  ],
  answer: ["R8C5"],
  hints: [
    (ctx) => {
      ctx.highlight(8, 1);
      ctx.highlight(8, 2);
      ctx.highlight(9, 1);
      return "Take a look at block 7.";
    },
    (ctx) => {
      ctx.highlight(2, 1);
      ctx.highlight(2, 5);
      ctx.highlight(8, 5);

      ctx.fillCandidates();
      ctx.highlightCandidate(2, 5, 7, "normal");
      ctx.highlightCandidate(8, 5, 7, "removed");

      return (
        <>
          If 7 is in R8C1 or R8C2 then R8C5 cannot have a 7. Otherwise if 7 is
          in R8C1 or R9C1 then R2C1 cannot have a 7 which puts 7 to R2C5. In
          either case we cannot put 7 to R8C5.
          <br />
          Finally, we can place number 9 in R8C5.
        </>
      );
    },
  ],
  hideCandidates: ["R9C1:5", "R8C7:5", "R8C9:5", "R6C9:5", "R6C9:9"],
}];

export default function SudokuEmptyRectangle() {
  const exerciseIndex = useSignal(0);
  const exercise = exercises[exerciseIndex.value];

  function onNext() {
    exerciseIndex.value += 1;

    if ("plausible" in self) {
      const plausible = self.plausible as (
        event: string,
        data: { props: Record<string, string> },
      ) => void;

      plausible("sudoku-solved", { props: { exercise: "empty-rectangle" } });
    }
  }

  return (
    <section class="flex flex-col gap-4">
      <h1 class="text-2xl">
        Use Empty Rectangle technique

        {!!exercise && (
          <span class="text-lg text-gray-500 pl-4">
            ({exerciseIndex.value + 1} / {exercises.length})
          </span>
        )}
      </h1>

      {exercise
        ? (
          <>
            <div class="flex flex-col gap-1">
              <p class="text-gray-600 dark:text-gray-200">
                Find a cell where a candidate can be eliminated using Empty
                Rectangle technique.
              </p>

              <p class="text-sm text-gray-500 dark:text-gray-300">
                If you are not sure how to look for Empty Rectangles then check
                the materials below or click on a "Hint" button.
              </p>
            </div>

            <div class="mt-4 mb-16">
              <SingleExercise
                key={exerciseIndex.value}
                exercise={exercise}
                onNext={onNext}
              />
            </div>
          </>
        )
        : <SolvedStep />}

      <h2 class="text-lg">Empty rectangle materials</h2>
      <ul class="list-disc ml-6 text-sm">
        {materials.map((m) => (
          <li>
            <a href={m} target="_blank">{m}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
