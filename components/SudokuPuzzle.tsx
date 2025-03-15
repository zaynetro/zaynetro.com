import { batch, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import IconBulb from "@tabler/icons-preact/dist/esm/icons/IconBulb.js";
import IconEraser from "@tabler/icons-preact/dist/esm/icons/IconEraser.js";
import IconPencil from "@tabler/icons-preact/dist/esm/icons/IconPencil.js";
import IconRobot from "@tabler/icons-preact/dist/esm/icons/IconRobot.js";
import { Fragment, JSX } from "preact";
import { classNames } from "@/components/util.ts";

type SudokuGrid = number[][];

type CandidateHighlightStyle = "normal" | "removed";

/** All methods use a 1-based indexing (human-readable). */
export type HintCtx = {
  highlightRow: (row: number) => void;
  highlightCol: (col: number) => void;
  highlight: (row: number, col: number) => void;
  highlightCandidate: (
    row: number,
    col: number,
    num: number,
    style?: CandidateHighlightStyle,
  ) => void;
  clearHighlight: () => void;
  note: (row: number, col: number, num: number) => void;
  fillCandidates: () => void;
};
export type HintFunc = (ctx: HintCtx) => string | JSX.Element;

const nineLengthArr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const boxes = [
  { rows: [0, 2], cols: [0, 2] },
  { rows: [0, 2], cols: [3, 5] },
  { rows: [0, 2], cols: [6, 8] },
  { rows: [3, 5], cols: [0, 2] },
  { rows: [3, 5], cols: [3, 5] },
  { rows: [3, 5], cols: [6, 8] },
  { rows: [6, 8], cols: [0, 2] },
  { rows: [6, 8], cols: [3, 5] },
  { rows: [6, 8], cols: [6, 8] },
];

export function SudokuPuzzle({
  initial,
  onSelectCell,
  hints,
  hideCandidates,
}: {
  initial: SudokuGrid;
  onSelectCell?: (row: number, col: number) => void;
  hints: HintFunc[];
  hideCandidates?: string[];
}) {
  const grid = useSignal(initial);
  const notes = useSignal<Record<string, number[]>>({});
  const selected = useSignal<number[] | null>(null);
  const notesMode = useSignal(false);
  const highlights = useSignal<Record<string, boolean>>({});
  const candidateHighlights = useSignal<
    Record<string, CandidateHighlightStyle>
  >({});
  const visibleHints = useSignal<(string | JSX.Element)[]>([]);

  const selectedNumber = selected.value
    ? grid.value[selected.value[0]][selected.value[1]]
    : undefined;

  function keyboardListener(e: KeyboardEvent) {
    if (e.key == "Backspace") {
      erase();
      return;
    }

    try {
      const num = parseInt(e.key, 10);
      if (!isNaN(num)) {
        setNum(num);
      }
    } catch (_e) {
      // No op
    }
  }

  function erase() {
    const pos = selected.value;
    if (!pos) {
      return;
    }

    const [row, col] = pos;
    setValue(0, row, col);
    setNotes(null, row, col);
  }

  function setNotes(
    num: number | null,
    row: number,
    col: number,
    { appendOnly } = { appendOnly: false },
  ) {
    const key = `${row},${col}`;
    if (!num) {
      notes.value = {
        ...notes.value,
        [key]: [],
      };
      return;
    }

    if (num < 1 || num > 9) {
      return;
    }

    let existing = notes.value[key];
    if (existing) {
      existing = [...existing];
    } else {
      existing = [];
    }

    // Either append or remove from the notes
    if (existing.includes(num)) {
      if (!appendOnly) {
        existing = existing.filter((v) => v != num);
      }
    } else {
      existing.push(num);
      existing.sort();
    }

    notes.value = {
      ...notes.value,
      [key]: existing,
    };
  }

  function setValue(num: number, row: number, col: number) {
    if (num >= 0 && num <= 9) {
      const copy = grid.value.map((row) => row.map((cell) => cell));
      copy[row][col] = num;
      grid.value = copy;
    }
  }

  function setNum(num: number) {
    const pos = selected.value;
    if (!pos) {
      return;
    }

    const [row, col] = pos;
    if (initial[row][col]) {
      // Initial values are immutable
      return;
    }

    if (notesMode.value) {
      batch(() => {
        setNotes(num, row, col);
        setValue(0, row, col);
      });
      return;
    }

    setValue(num, row, col);
  }

  function selectCell(row: number, col: number) {
    const current = selected.value;
    if (current && current[0] == row && current[1] == col) {
      // Clicked on the same cell --> deselect
      selected.value = null;
      return;
    }

    selected.value = [row, col];
    onSelectCell?.(row, col);
  }

  function highlightCell(row: number, col: number) {
    const key = `${row},${col}`;
    highlights.value = {
      ...highlights.value,
      [key]: true,
    };
  }

  function highlightCandidate(
    row: number,
    col: number,
    num: number,
    style: CandidateHighlightStyle = "removed",
  ) {
    const key = `${row},${col},${num}`;
    candidateHighlights.value = {
      ...candidateHighlights.value,
      [key]: style,
    };
  }

  function nextHint() {
    if (visibleHints.value.length >= hints.length) {
      // No more hints
      return;
    }

    const index = visibleHints.value.length;
    const hint = hints[index]({
      highlightRow: (row) => {
        for (let i = 0; i < 9; i += 1) {
          highlightCell(row - 1, i);
        }
      },
      highlightCol: (col) => {
        for (let i = 0; i < 9; i += 1) {
          highlightCell(i, col - 1);
        }
      },
      highlight: (row, col) => {
        highlightCell(row - 1, col - 1);
      },
      highlightCandidate: (
        row: number,
        col: number,
        num: number,
        style?: CandidateHighlightStyle,
      ) => {
        highlightCandidate(row - 1, col - 1, num, style);
      },
      clearHighlight: () => {
        batch(() => {
          highlights.value = {};
          candidateHighlights.value = {};
        });
      },
      note: (row, col, num) => {
        setNotes(num, row - 1, col - 1, { appendOnly: true });
      },
      fillCandidates,
    });

    batch(() => {
      const next = [...visibleHints.value];
      next.push(hint);
      visibleHints.value = next;
    });
  }

  function fillCandidates() {
    /** Numbers in each box */
    const allBoxNumbers: Map<number, number[]> = new Map();
    boxes.forEach((box, boxIndex) => {
      const numbers: number[] = [];
      for (let row = box.rows[0]; row <= box.rows[1]; row += 1) {
        for (let col = box.cols[0]; col <= box.cols[1]; col += 1) {
          const value = grid.value[row][col];
          if (value) {
            numbers.push(value);
          }
        }
      }

      allBoxNumbers.set(boxIndex, numbers);
    });

    // Go through each cell and calculate the possibilities
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        const value = grid.value[row][col];
        if (value) {
          // Value already filled. Nothing to do here...
          continue;
        }

        const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);

        // Check row, column and box
        const rowNumbers = nineLengthArr.map((_, i) => grid.value[row][i])
          .filter((v) => !!v);
        const colNumbers = nineLengthArr.map((_, i) => grid.value[i][col])
          .filter((v) => !!v);
        const boxNumbers = allBoxNumbers.get(boxIndex) ?? [];

        const candidates = nineLengthArr.filter((v) =>
          !rowNumbers.includes(v) && !colNumbers.includes(v) &&
          !boxNumbers.includes(v) &&
          !(hideCandidates?.includes(`R${row + 1}C${col + 1}:${v}`) ?? false)
        );

        for (const num of candidates) {
          setNotes(num, row, col, { appendOnly: true });
        }
      }
    }
  }

  useEffect(() => {
    document.addEventListener("keyup", keyboardListener);

    return () => {
      document.removeEventListener("keyup", keyboardListener);
    };
  }, []);

  return (
    <div class="max-w-lg mx-auto select-none">
      <div class="grid grid-cols-9 grid-rows-9 aspect-square">
        {grid.value.map((rowValues, row) => (
          <>
            {rowValues.map((cellValue, col) => {
              const s = selected.value;
              const key = `${row},${col}`;
              const highlighted = highlights.value[key];

              // Index of a 3x3 box
              const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
              const selectedBoxIndex = s
                ? (Math.floor(s[0] / 3) * 3 + Math.floor(s[1] / 3))
                : null;

              // Row or column selected
              const rowColSelected = s ? (s[0] == row || s[1] == col) : false;
              // 3x3 box selected
              const boxSelected = boxIndex == selectedBoxIndex;
              // User set this cell value
              const userSpecified = !initial[row][col] && !!cellValue;

              return (
                <div
                  class={classNames(
                    "aspect-square border border-gray-200 dark:border-gray-600",
                    {
                      // Border every three segments
                      "border-t-gray-900 dark:border-t-gray-200": row === 0,
                      "border-b-gray-900 dark:border-b-gray-200": row > 0 &&
                        (row + 1) % 3 == 0,
                      "border-l-gray-900 dark:border-l-gray-200": col === 0,
                      "border-r-gray-900 dark:border-r-gray-200": col > 0 &&
                        (col + 1) % 3 == 0,
                      // Highlighted cell
                      "bg-fuchsia-200 dark:bg-fuchsia-800": highlighted,
                      // Selected row, column or 3x3 box
                      "bg-amber-100 dark:bg-amber-900": rowColSelected ||
                        boxSelected,
                      // User specified cell
                      "text-blue-700 dark:text-blue-300": userSpecified,
                      // Same number
                      "bg-amber-200 dark:bg-amber-700": cellValue > 0 &&
                        cellValue == selectedNumber,
                      // Selected cell
                      "!bg-amber-300 !dark:bg-amber-600": s
                        ? (s[0] == row && s[1] == col)
                        : false,
                    },
                  )}
                >
                  <SudokuCell
                    selectedNumber={selectedNumber}
                    value={cellValue}
                    notes={notes.value[key]}
                    onClick={() => selectCell(row, col)}
                    getStyle={(num) => {
                      const key = `${row},${col},${num}`;
                      return candidateHighlights.value[key];
                    }}
                  />
                </div>
              );
            })}
          </>
        ))}
      </div>

      <div class="flex items-start mt-6 gap-12">
        <button
          type="button"
          class="flex flex-col justify-center relative text-gray-600 dark:text-gray-300 text-sm"
          onClick={erase}
        >
          <span class="self-center">
            <IconEraser size={28} />
          </span>

          Erase
        </button>

        <button
          type="button"
          class="flex flex-col justify-center relative text-gray-600 dark:text-gray-300 text-sm"
          onClick={() => notesMode.value = !notesMode.value}
        >
          <div
            class={classNames(
              "absolute uppercase rounded-lg px-1 text-xs text-white -top-1 -right-3",
              {
                "bg-gray-400": !notesMode.value,
                "bg-blue-400": notesMode.value,
              },
            )}
          >
            {notesMode.value ? "on" : "off"}
          </div>

          <span class="self-center">
            <IconPencil size={28} />
          </span>
          Notes
        </button>

        {!!hints.length && (
          <button
            type="button"
            class="flex flex-col justify-center relative text-gray-600 dark:text-gray-300 text-sm"
            onClick={nextHint}
          >
            <span class="self-center">
              <IconBulb size={28} />
            </span>

            Hint
          </button>
        )}

        <button
          type="button"
          class="flex flex-col justify-center relative text-gray-600 dark:text-gray-300 text-sm"
          title="Fill all candidates"
          onClick={fillCandidates}
        >
          <span class="self-center">
            <IconRobot size={28} />
          </span>

          <span>Fill notes</span>
        </button>
      </div>

      <div class="flex mt-2 justify-center">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            type="button"
            class={classNames("text-2xl sm:text-3xl py-4 px-3 sm:px-4", {
              "text-blue-700 dark:text-blue-300": !notesMode.value,
              "text-gray-600 dark:text-gray-300": notesMode.value,
            })}
            onClick={() => setNum(num)}
          >
            {num}
          </button>
        ))}
      </div>

      {!!visibleHints.value.length && (
        <div class="flex flex-col gap-1 rounded-md p-2 bg-yellow-100 text-gray-800 dark:bg-yellow-900 dark:text-gray-300">
          {visibleHints.value.map((h) => <p key={h}>{h}</p>)}

          {(visibleHints.value.length < hints.length) && (
            <div class="flex justify-end">
              <button
                type="button"
                class="p-2 rounded-md text-sm bg-blue-700 text-white dark:text-gray-100"
                onClick={nextHint}
              >
                {(visibleHints.value.length + 1) == hints.length
                  ? "Solution"
                  : "More"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SudokuCell({
  value,
  notes,
  onClick,
  selectedNumber,
  getStyle,
}: {
  value: number;
  notes?: number[];
  onClick: () => void;
  selectedNumber?: number;
  getStyle: (num: number) => CandidateHighlightStyle | null;
}) {
  return (
    <div
      class="w-full h-full flex justify-center items-center text-3xl"
      onClick={onClick}
    >
      {value > 0 ? value : (
        !!notes && (
          <span class="text-xs sm:text-base text-gray-400 break-all">
            {notes.map((n) => {
              const selected = selectedNumber == n;
              const highlighted = getStyle(n);
              const selectedClass =
                "rounded-xl px-1 text-gray-600 dark:text-gray-300";

              if (highlighted == "removed") {
                return (
                  <span
                    class={`${selectedClass} bg-red-300 dark:bg-red-700 line-through`}
                  >
                    {n}
                  </span>
                );
              }

              if (highlighted == "normal" || selected) {
                return (
                  <b
                    class={`${selectedClass} bg-yellow-200 dark:bg-yellow-800`}
                  >
                    {n}
                  </b>
                );
              }

              return <Fragment key={n}>{n}</Fragment>;
            })}
          </span>
        )
      )}
    </div>
  );
}
