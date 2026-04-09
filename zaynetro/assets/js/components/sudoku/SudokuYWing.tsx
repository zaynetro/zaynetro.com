import { useSignal } from "@preact/signals";
import {
  Exercise,
  SingleExercise,
  SolvedStep,
} from "@/components/SudokuExercise.tsx";

const materials = [
  "https://www.sudoku.academy/learn/xy-wing/",
  "https://www.learn-sudoku.com/xy-wing.html",
  "https://masteringsudoku.com/y-wings/",
  "https://www.stolaf.edu/people/hansonr/sudoku/explain.htm",
];

const exercises: Exercise[] = [{
  grid: [
    [9, 1, 8, 2, 5, 7, 4, 6, 3],
    [2, 7, 3, 9, 4, 6, 0, 0, 0],
    [5, 6, 4, 3, 1, 8, 0, 0, 7],
    [4, 9, 5, 0, 2, 3, 7, 0, 6],
    [7, 0, 6, 0, 9, 4, 5, 3, 0],
    [3, 0, 1, 7, 6, 5, 0, 4, 9],
    [1, 3, 2, 5, 8, 9, 6, 7, 4],
    [6, 5, 7, 4, 3, 2, 0, 0, 8],
    [8, 4, 9, 6, 7, 1, 3, 0, 0],
  ],
  answer: ["R2C7", "R5C9", "R6C7"],
  hints: [
    (ctx) => {
      ctx.highlightCol(7);
      ctx.highlightCol(9);
      return "Take a look at columns 7 and 9.";
    },
    (ctx) => {
      ctx.clearHighlight();
      ctx.highlight(6, 7);
      return "R6C7 is a pivot. Look for two pins. Three cells together form a bent naked triple.";
    },
    (ctx) => {
      ctx.clearHighlight();

      ctx.highlight(2, 7);
      ctx.highlight(5, 9);
      ctx.highlight(6, 7);

      ctx.fillCandidates();
      ctx.highlightCandidate(2, 9, 1);

      return (
        <>
          R2C7, R5C9, R6C7 form a Y-wing. R6C7 is a pivot. R2C7 and R5C9 are
          pins. Either pin will have number 1. This allows us to remove number 1
          from an intercecting cell R2C9.
          <br />
          Finally, we can place number 5 in R2C9.
        </>
      );
    },
  ],
  hideCandidates: [],
}, {
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
      ctx.highlight(5, 5);
      return "R5C5 is a pivot. Look for two pins. Three cells together form a bent naked triple.";
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
          R5C2, R5C5, R8C5 form a Y-wing. R5C5 is a pivot. R5C2 and R8C5 are
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
      return "R3C1 is a pivot. Look for two pins. Three cells together form a bent naked triple.";
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
          R3C1, R3C7, R4C1 form a Y-wing. R3C1 is a pivot. R3C7 and R4C1 are
          pins. Either pin will have number 5. This allows us to remove number 5
          from an intersecting cell R4C7.
          <br />
          Finally, we can place number 5 in R4C7.
        </>
      );
    },
  ],
  hideCandidates: ["R4C1:8", "R4C2:8", "R6C2:8"],
}, {
  grid: [
    [0, 4, 0, 3, 7, 9, 0, 0, 0],
    [7, 2, 3, 6, 8, 1, 0, 5, 0],
    [8, 9, 1, 2, 4, 5, 7, 3, 6],
    [4, 7, 0, 5, 2, 8, 0, 0, 3],
    [2, 0, 8, 1, 9, 3, 0, 7, 0],
    [1, 3, 0, 4, 6, 7, 0, 0, 8],
    [9, 0, 7, 8, 1, 4, 3, 0, 0],
    [3, 8, 2, 7, 5, 6, 0, 4, 0],
    [0, 1, 4, 9, 3, 2, 0, 0, 7],
  ],
  answer: ["R1C7", "R7C9", "R9C7"],
  hints: [
    (ctx) => {
      ctx.highlightRow(7);
      ctx.highlightCol(7);
      return "Take a look at row 7 and column 7.";
    },
    (ctx) => {
      ctx.clearHighlight();
      ctx.highlight(9, 7);
      return "R9C7 is a pivot. Look for two pins. Three cells together form a bent naked triple.";
    },
    (ctx) => {
      ctx.clearHighlight();

      ctx.highlight(1, 7);
      ctx.highlight(7, 9);
      ctx.highlight(9, 7);

      ctx.fillCandidates();
      ctx.highlightCandidate(1, 9, 2);

      return (
        <>
          R1C7, R9C7, R7C9 form a Y-wing. R9C7 is a pivot. R1C7 and R7C9 are
          pins. Either pin will have number 2. This allows us to remove number 2
          from an intersecting cell R1C9.
          <br />
          Finally, we can place number 1 in R1C9.
        </>
      );
    },
  ],
  hideCandidates: ["R1C7:1", "R4C7:9", "R4C8:6", "R5C7:5", "R6C7:9", "R9C7:6"],
}, {
  grid: [
    [7, 2, 4, 5, 8, 9, 1, 3, 6],
    [6, 3, 5, 1, 0, 0, 9, 4, 8],
    [1, 9, 8, 3, 6, 4, 5, 7, 2],
    [4, 1, 6, 0, 9, 0, 7, 5, 3],
    [9, 5, 7, 6, 1, 3, 2, 8, 4],
    [2, 8, 3, 0, 0, 0, 6, 1, 9],
    [3, 7, 9, 0, 0, 1, 8, 6, 5],
    [0, 4, 2, 0, 0, 6, 3, 9, 1],
    [0, 6, 1, 9, 3, 0, 4, 2, 7],
  ],
  answer: ["R6C6", "R8C4", "R9C6"],
  hints: [
    (ctx) => {
      ctx.highlightRow(8);
      ctx.highlightCol(6);
      return "Take a look at row 8 and column 6.";
    },
    (ctx) => {
      ctx.clearHighlight();
      ctx.highlight(9, 6);
      return "R9C6 is a pivot. Look for two pins. Three cells together form a bent naked triple.";
    },
    (ctx) => {
      ctx.clearHighlight();

      ctx.highlight(8, 4);
      ctx.highlight(6, 6);
      ctx.highlight(9, 6);

      ctx.fillCandidates();
      ctx.highlightCandidate(6, 4, 7);

      return (
        <>
          R8C4, R6C6, R9C6 form a Y-wing. R9C6 is a pivot. R8C4 and R6C6 are
          pins. Either pin will have number 7. This allows us to remove number 7
          from an intersecting cell R6C4.
          <br />
          Finally, we can place number 4 in R6C4.
        </>
      );
    },
  ],
  hideCandidates: [],
}];

export default function SudokuYWing() {
  const exerciseIndex = useSignal(0);
  const exercise = exercises[exerciseIndex.value];

  function onNext() {
    exerciseIndex.value += 1;

    if ("plausible" in self) {
      const plausible = self.plausible as (
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
                If you are not sure how to look for a Y-wing then check the
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
