import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { IconBulb, IconEraser, IconPencil } from "@tabler/icons-preact";

type SudokuGrid = number[][];

export function SudokuPuzzle({
  initial,
  onSelectCell,
}: {
  initial: SudokuGrid;
  onSelectCell?: (row: number, col: number) => void;
}) {
  const grid = useSignal(initial);
  const notes = useSignal<Record<string, number[]>>({});
  const selected = useSignal<number[] | null>(null);
  const notesMode = useSignal(false);

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

  function setNotes(num: number | null, row: number, col: number) {
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
      existing = existing.filter((v) => v != num);
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
      setNotes(num, row, col);
      setValue(0, row, col);
      return;
    }

    setValue(num, row, col);
  }

  function selectCell(row: number, col: number) {
    selected.value = [row, col];
    onSelectCell?.(row, col);
  }

  useEffect(() => {
    document.addEventListener("keyup", keyboardListener);

    return () => {
      document.removeEventListener("keyup", keyboardListener);
    };
  }, []);

  return (
    <div class="max-w-xl mx-auto select-none">
      <div class="grid grid-cols-9 grid-rows-9 aspect-square">
        {grid.value.map((rowValues, row) => (
          <>
            {rowValues.map((cellValue, col) => {
              const s = selected.value;

              // Index of a 3x3 block
              const blockIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
              const selectedBlockIndex = s
                ? (Math.floor(s[0] / 3) * 3 + Math.floor(s[1] / 3))
                : null;

              // Row or column selected
              const rowColSelected = s ? (s[0] == row || s[1] == col) : false;
              // 3x3 block selected
              const blockSelected = blockIndex == selectedBlockIndex;
              // User set this cell value
              const userSpecified = !initial[row][col] && !!cellValue;

              return (
                <div
                  class={classNames(
                    "border border-gray-200 dark:border-gray-600",
                    {
                      // Border every three segments
                      "border-t-gray-900 dark:border-t-gray-200": row === 0,
                      "border-b-gray-900 dark:border-b-gray-200": row > 0 &&
                        (row + 1) % 3 == 0,
                      "border-l-gray-900 dark:border-l-gray-200": col === 0,
                      "border-r-gray-900 dark:border-r-gray-200": col > 0 &&
                        (col + 1) % 3 == 0,
                      // Selected row, column or 3x3 block
                      "bg-amber-100 dark:bg-amber-900": rowColSelected ||
                        blockSelected,
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
                    notes={notes.value[`${row},${col}`]}
                    onClick={() => selectCell(row, col)}
                  />
                </div>
              );
            })}
          </>
        ))}
      </div>

      <div class="flex mt-6 gap-12">
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

        {
          /* <button
            type="button"
            class="flex flex-col justify-center relative text-gray-600 dark:text-gray-300 text-sm"
            onClick={() => {}}
            >
            <span class="self-center">
            <IconBulb size={28} />
            </span>

            Hint
            </button> */
        }
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
    </div>
  );
}

function SudokuCell({
  value,
  notes,
  onClick,
  selectedNumber,
}: {
  value: number;
  notes?: number[];
  onClick: () => void;
  selectedNumber?: number;
}) {
  return (
    <div
      class="w-full h-full flex justify-center items-center text-3xl"
      onClick={onClick}
    >
      {value > 0 ? value : (
        !!notes && (
          <span class="text-xs sm:text-base text-gray-400 break-all">
            {notes.map((n) => (
              selectedNumber == n ? <b class="text-gray-900">{n}</b> : <>{n}</>
            ))}
          </span>
        )
      )}
    </div>
  );
}

function classNames(names: string, optional: Record<string, boolean>): string {
  const res = names;
  const extra = Object.entries(optional)
    .filter(([_key, value]) => value)
    .map(([key, _v]) => key)
    .join(" ");
  return res + " " + extra;
}
