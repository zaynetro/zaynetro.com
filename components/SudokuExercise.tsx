import { HintFunc, SudokuPuzzle } from "@/components/SudokuPuzzle.tsx";
import { useSignal } from "@preact/signals";
import {
  IconArrowRight,
  IconCircleCheck,
  IconExclamationCircle,
  IconMoodSmileBeam,
} from "@tabler/icons-preact";

export type Exercise = {
  grid: number[][];
  notes?: Record<string, number[]>;
  answer: string[];
  hints: HintFunc[];
  hideCandidates?: string[];
};

export function SingleExercise({
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
        hideCandidates={exercise.hideCandidates}
      />
    </>
  );
}

export function SolvedStep() {
  return (
    <div class="flex flex-col items-center gap-2 mt-8 mb-16 rounded-md p-4 bg-green-100 dark:bg-green-900">
      <p class="text-lg">
        You have successfully solved all available exercises!
      </p>

      <p>Thank you!</p>

      <span class="text-stone-600 dark:text-stone-300">
        <IconMoodSmileBeam size={40} />
      </span>

      <div class="mt-4">
        <a href="/sudoku">More Sudoku exercises</a>
      </div>
    </div>
  );
}
