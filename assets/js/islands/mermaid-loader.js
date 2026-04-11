import mermaid from "mermaid";

const theme =
  self.matchMedia && self.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "default";

mermaid.initialize({ startOnLoad: false, theme });

mermaid.run({ querySelector: ".mermaid" });
