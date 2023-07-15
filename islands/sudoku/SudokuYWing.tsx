import { useSignal } from "@preact/signals";
import {
  Exercise,
  SingleExercise,
  SolvedStep,
} from "@/components/SudokuExercise.tsx";

const materials = [
  "https://www.sudoku.academy/learn/xy-wing/",
  "https://www.learn-sudoku.com/xy-wing.html",
];

const exercises: Exercise[] = [{
  grid: [
    [6, 4, 7, 9, 1, 5, 3, 8, 2],
    [3, 9, 5, 2, 8, 4, 7, 6, 1],
    [0, 2, 0, 3, 0, 0, 5, 4, 9],
    [0, 0, 0, 0, 3, 0, 0, 0, 6],
    [0, 0, 0, 5, 0, 1, 0, 0, 0],
    [9, 0, 0, 0, 4, 0, 0, 0, 0],
    [0, 8, 6, 0, 5, 0, 0, 2, 3],
    [5, 0, 2, 6, 0, 3, 0, 0, 0],
    [0, 3, 9, 0, 2, 8, 6, 7, 5],
  ],
  answer: ["R5C2", "R5C5", "R8C5"],
  hints: [
    (ctx) => {
      ctx.highlightRow(5);
      ctx.highlightCol(5);
      return "Take a look at row 5 and column 5.";
    },
    (ctx) => {
      ctx.clearHighlight();

      ctx.highlight(5, 2);
      ctx.highlight(5, 5);
      ctx.highlight(8, 5);

      ctx.fillCandidates();
      ctx.highlightCandidate(8, 2, 7);

      return (
        <>
          R5C2, R5C5, R8C5 forms a Y-wing. R5C5 is a pivot. R5C2 and R8C5 are
          pins. Either pin will have number 7. This allows us to remove number 7
          from an intercecting cell R8C2.
          <br />
          Finally, we can place number 1 in R8C2.
        </>
      );
    },
  ],
  hideCandidates: ["R4C1:4", "R5C1:4", "R4C6:7", "R5C5:7", "R6C6:7"],
}, {
  grid: [
    [3, 1, 5, 9, 4, 8, 7, 2, 6],
    [7, 4, 0, 1, 0, 0, 3, 9, 0],
    [0, 0, 2, 0, 0, 0, 0, 1, 4],
    [0, 0, 3, 4, 0, 0, 0, 6, 1],
    [2, 0, 0, 5, 9, 1, 4, 7, 3],
    [4, 0, 1, 6, 0, 0, 2, 0, 9],
    [0, 2, 9, 0, 1, 0, 6, 4, 7],
    [6, 0, 4, 0, 0, 9, 1, 3, 2],
    [1, 3, 7, 2, 6, 4, 9, 0, 0],
  ],
  answer: ["R3C1", "R3C7", "R4C1"],
  hints: [
    (ctx) => {
      ctx.highlightRow(3);
      ctx.highlightCol(1);
      return "Take a look at row 3 and column 1.";
    },
    (ctx) => {
      ctx.clearHighlight();

      ctx.highlight(3, 1);
      ctx.highlight(3, 7);
      ctx.highlight(4, 1);

      ctx.fillCandidates();
      ctx.highlightCandidate(4, 7, 5);

      return (
        <>
          R3C1, R3C7, R4C1 forms a Y-wing. R3C1 is a pivot. R3C7 and R4C1 are
          pins. Either pin will have number 5. This allows us to remove number 5
          from an intersecting cell R4C7.
          <br />
          Finally, we can place number 5 in R4C7.
        </>
      );
    },
  ],
  hideCandidates: ["R4C1:8", "R4C2:8", "R6C2:8"],
}];

export default function SudokuYWing() {
  const exerciseIndex = useSignal(0);
  const exercise = exercises[exerciseIndex.value];

  function onNext() {
    exerciseIndex.value += 1;

    if ("plausible" in window) {
      const plausible = window.plausible as (
        event: string,
        data: { props: Record<string, string> },
      ) => void;

      plausible("sudoku-solved", { props: { exercise: "y-wing" } });
    }
  }

  return (
    <section class="flex flex-col gap-4">
      <h1 class="text-2xl">
        Find an Y-wing

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
                Click on three cells that form a Y-wing (or XY-wing).
              </p>

              <p class="text-sm text-gray-500 dark:text-gray-300">
                If you are not sure how look for a Y-wing then check the
                materials below or click on a "Hint" button.
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

      <h2 class="text-lg">Y-wing materials</h2>
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
