import { HintFunc, SudokuPuzzle } from "@/components/SudokuPuzzle.tsx";
import { useSignal } from "@preact/signals";
import {
  IconArrowRight,
  IconCircleCheck,
  IconExclamationCircle,
  IconMoodSmileBeam,
} from "@tabler/icons-preact";

const materials = [
  "https://www.sudoku.academy/learn/x-wing/",
  "https://www.youtube.com/watch?v=az2M0V9QCXk",
  "http://www.sudokubeginner.com/x-wing/",
  "https://www.youtube.com/watch?v=z--Mo2GMqhI",
];

type Exercise = {
  grid: number[][];
  notes?: Record<string, number[]>;
  answer: string[];
  hints: HintFunc[];
};

const exercises: Exercise[] = [{
  grid: [
    [0, 0, 1, 0, 9, 0, 6, 0, 0],
    [0, 0, 0, 0, 6, 0, 5, 0, 1],
    [5, 6, 0, 1, 0, 8, 0, 0, 4],
    [6, 4, 2, 3, 7, 9, 8, 1, 5],
    [7, 3, 8, 0, 1, 0, 2, 6, 9],
    [1, 5, 9, 0, 0, 6, 4, 0, 0],
    [2, 0, 0, 6, 0, 1, 0, 5, 8],
    [3, 0, 5, 0, 0, 0, 1, 0, 6],
    [0, 1, 6, 0, 5, 0, 7, 0, 0],
  ],
  answer: ["R3C5", "R3C7", "R7C5", "R7C7"],
  hints: [
    (ctx) => {
      ctx.highlightCol(5);
      ctx.highlightCol(7);
      return "Take a look at columns 5 and 7.";
    },
    () => "Number 3 could be only in two cells in columns 5 and 7.",
    (ctx) => {
      ctx.clearHighlight();

      ctx.highlight(3, 5);
      ctx.note(3, 5, 3);
      ctx.highlight(3, 7);
      ctx.note(3, 7, 3);
      ctx.highlight(7, 5);
      ctx.note(7, 5, 3);
      ctx.highlight(7, 7);
      ctx.note(7, 7, 3);

      ctx.fillCandidates();
      ctx.highlightCandidate(3, 3, 3);
      ctx.highlightCandidate(3, 8, 3);

      return (
        <>
          R3C5, R3C7, R7C5, R7C7 forms an X-wing. Number 3 must be in either of
          these four cells. This removes all 3 number candidates from rows 3 and
          7.
          <br />
          Finally, we can place number 7 in R3C3.
        </>
      );
    },
  ],
}, {
  grid: [
    [6, 0, 0, 0, 9, 5, 0, 0, 7],
    [5, 4, 0, 0, 0, 7, 1, 0, 0],
    [0, 0, 2, 8, 0, 0, 0, 5, 0],
    [8, 0, 0, 0, 0, 0, 0, 9, 0],
    [0, 0, 0, 0, 7, 8, 0, 0, 0],
    [0, 3, 0, 0, 0, 0, 0, 0, 8],
    [0, 5, 0, 0, 0, 2, 3, 0, 0],
    [3, 0, 4, 5, 0, 0, 0, 2, 0],
    [9, 2, 0, 0, 3, 0, 5, 0, 4],
  ],
  answer: [
    "R1C2",
    "R1C7",
    "R8C2",
    "R8C7",
  ],
  hints: [
    (ctx) => {
      ctx.highlightCol(2);
      ctx.highlightCol(7);
      return "Take a look at columns 2 and 7.";
    },
    () => "Number 8 could be only in two cells in columns 2 and 7.",
    (ctx) => {
      ctx.clearHighlight();

      ctx.highlight(1, 2);
      ctx.note(1, 2, 8);
      ctx.highlight(1, 7);
      ctx.note(1, 7, 8);
      ctx.highlight(8, 2);
      ctx.note(8, 2, 8);
      ctx.highlight(8, 7);
      ctx.note(8, 7, 8);

      ctx.fillCandidates();
      ctx.highlightCandidate(1, 3, 8);
      ctx.highlightCandidate(1, 8, 8);
      ctx.highlightCandidate(8, 5, 8);
      ctx.highlightCandidate(7, 5, 8, "normal");

      return (
        <>
          R1C2, R1C7, R8C2, R8C7 forms an X-wing. Number 8 must be in either of
          these four cells. This removes all 8 number candidates from rows 1 and
          8.
          <br />
          Finally, we can place number 8 in R7C5.
        </>
      );
    },
  ],
}, {
  grid: [
    [1, 6, 5, 9, 0, 0, 8, 0, 0],
    [3, 7, 4, 0, 8, 5, 0, 9, 6],
    [8, 2, 9, 0, 0, 6, 0, 0, 4],
    [0, 0, 1, 0, 5, 2, 0, 3, 0],
    [0, 0, 3, 0, 1, 0, 0, 0, 5],
    [0, 5, 6, 3, 0, 0, 7, 0, 0],
    [6, 9, 8, 0, 0, 1, 0, 0, 7],
    [4, 1, 0, 5, 0, 0, 0, 6, 0],
    [5, 3, 0, 0, 6, 0, 9, 0, 0],
  ],
  answer: [
    "R3C5",
    "R3C7",
    "R7C5",
    "R7C7",
  ],
  hints: [
    (ctx) => {
      ctx.highlightRow(3);
      ctx.highlightRow(7);
      return "Take a look at rows 3 and 7.";
    },
    () => "Number 3 could be only in two cells in rows 3 and 7.",
    (ctx) => {
      ctx.clearHighlight();

      ctx.highlight(3, 5);
      ctx.note(3, 5, 3);
      ctx.highlight(3, 7);
      ctx.note(3, 7, 3);
      ctx.highlight(7, 5);
      ctx.note(7, 5, 3);
      ctx.highlight(7, 7);
      ctx.note(7, 7, 3);

      ctx.fillCandidates();
      ctx.highlightCandidate(1, 5, 3);
      ctx.highlightCandidate(8, 5, 3);
      ctx.highlightCandidate(8, 7, 3);

      return (
        <>
          R3C5, R3C7, R7C5, R5C7 forms an X-wing. Number 3 must be in either of
          these four cells. This removes all 3 number candidates from columns 5
          and 7.
          <br />
          Finally, we can place number 2 in R8C7.
        </>
      );
    },
  ],
}, {
  grid: [
    [4, 5, 8, 0, 0, 0, 7, 9, 3],
    [6, 9, 3, 5, 0, 0, 2, 1, 4],
    [7, 0, 0, 4, 9, 3, 6, 8, 5],
    [0, 0, 5, 9, 0, 0, 0, 0, 6],
    [0, 4, 0, 0, 3, 5, 0, 7, 0],
    [3, 0, 0, 0, 0, 2, 4, 5, 0],
    [0, 6, 0, 1, 0, 0, 0, 0, 7],
    [0, 0, 4, 0, 0, 9, 0, 6, 0],
    [1, 0, 0, 0, 5, 0, 8, 4, 0],
  ],
  answer: [
    "R5C1",
    "R5C7",
    "R7C1",
    "R7C7",
  ],
  hints: [
    (ctx) => {
      ctx.highlightCol(1);
      ctx.highlightCol(7);
      return "Take a look at columns 1 and 7.";
    },
    () => "Number 9 could be only in two cells in columns 1 and 7.",
    (ctx) => {
      ctx.clearHighlight();

      ctx.highlight(5, 1);
      ctx.note(5, 1, 9);
      ctx.highlight(5, 7);
      ctx.note(5, 7, 9);
      ctx.highlight(7, 1);
      ctx.note(7, 1, 9);
      ctx.highlight(7, 7);
      ctx.note(7, 7, 9);

      ctx.fillCandidates();
      ctx.highlightCandidate(5, 3, 9);
      ctx.highlightCandidate(5, 9, 9);
      ctx.highlightCandidate(7, 3, 9);

      return (
        <>
          R5C1, R5C7, R7C1, R5C7 forms an X-wing. Number 9 must be in either of
          these four cells. This removes all 9 number candidates from rows 5 and
          7.
          <br />
          Finally, we can place number 2 in R7C3.
        </>
      );
    },
  ],
}];

export default function SudokuXWing() {
  const exerciseIndex = useSignal(0);
  const exercise = exercises[exerciseIndex.value];

  function onNext() {
    exerciseIndex.value += 1;

    if ("plausible" in window) {
      (window.plausible as (event: string) => void)("sudoku-solved");
    }
  }

  return (
    <section class="flex flex-col gap-4">
      <h1 class="text-2xl">
        Find an X-wing

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
                Click on four cells that form an X-wing.
              </p>

              <p class="text-sm text-gray-500 dark:text-gray-300">
                If you are not sure how look for an X-wing then check the
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
        : (
          <div class="flex flex-col items-center gap-2 mt-8 mb-16 rounded-md p-4 bg-green-100 dark:bg-green-900">
            <p class="text-lg">
              You have successfully solved all available exercises!
            </p>

            <p>Thank you!</p>

            <span class="text-stone-600 dark:text-stone-300">
              <IconMoodSmileBeam size={40} />
            </span>

            {/* TODO: add Bolik.net form for exercise suggestions/feedback */}

            <div class="mt-4">
              <a href="/sudoku">More Sudoku exercises</a>
            </div>
          </div>
        )}

      <h2 class="text-lg">X-wing materials</h2>
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

function SingleExercise({
  exercise,
  onNext,
}: {
  exercise: Exercise;
  onNext: () => void;
}) {
  const selected = useSignal<number[][]>([]);
  const solved = useSignal(false);

  function selectCell(row: number, col: number) {
    if (solved.value) {
      return;
    }

    const cur = [...selected.value];
    if (cur.length >= 4) {
      cur.shift();
    }
    cur.push([row, col]);

    selected.value = cur;

    // Verify answer
    const copy = cur.map(([row, col]) => `R${row + 1}C${col + 1}`).sort();
    if (copy.toString() == exercise.answer.toString()) {
      solved.value = true;
    }
  }

  return (
    <>
      <div class="flex mb-4 items-center gap-4">
        <span class="text-gray-700 dark:text-gray-400 text-sm hidden sm:block">
          Selected:
        </span>
        <div class="grid grid-cols-4 grid-rows-1 h-12">
          {selected.value.map(([row, col]) => (
            <span class="flex border border-gray-300 w-12 h-12 justify-center items-center -ml-px text-sm text-gray-600 dark:text-gray-400">
              {`R${row + 1}C${col + 1}`}
            </span>
          ))}
        </div>

        {(selected.value.length == 4) && !solved.value && (
          <span class="text-red-500" title="Incorrect answer">
            <IconExclamationCircle />
          </span>
        )}

        {solved.value && (
          <>
            <span class="hidden sm:block text-green-600">
              <IconCircleCheck />
            </span>

            <div class="ml-1 sm:ml-6">
              <button
                type="button"
                onClick={onNext}
                class="inline-flex items-center gap-x-2 px-2 pl-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
              >
                Next exercise
                <IconArrowRight size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      <SudokuPuzzle
        initial={exercise.grid}
        onSelectCell={selectCell}
        hints={exercise.hints}
      />
    </>
  );
}
