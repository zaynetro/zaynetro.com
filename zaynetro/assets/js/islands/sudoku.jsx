/** Sudoku Island entry point.
 * Reads data-exercise from the mount point to determine which exercise to render.
 */
import { render } from "preact";
import SudokuXWing from "@/components/sudoku/SudokuXWing.tsx";
import SudokuYWing from "@/components/sudoku/SudokuYWing.tsx";
import SudokuEmptyRectangle from "@/components/sudoku/SudokuEmptyRectangle.tsx";

const root = document.getElementById("sudoku-root");
if (root) {
  const exercise = root.dataset.exercise;
  let App = null;
  if (exercise === "x-wing") {
    App = SudokuXWing;
  } else if (exercise === "y-wing") {
    App = SudokuYWing;
  } else if (exercise === "empty-rectangle") {
    App = SudokuEmptyRectangle;
  }
  if (App) {
    render(<App />, root);
  }
}
