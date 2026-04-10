/** Explainix Island entry point.
 * Mounts the ExplainixApp Preact component into the #explainix-root element.
 * Remove any plausible analytics calls per migration requirements.
 */
import { render } from "preact";
import Explainix from "@/components/nix/ExplainixApp.tsx";

const root = document.getElementById("explainix-root");
if (root) {
  root.textContent = "";
  render(<Explainix />, root);
}
