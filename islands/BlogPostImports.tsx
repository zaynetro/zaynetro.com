import { useEffect } from "preact/hooks";

export default function BlogPostImports({
  mermaid,
}: {
  mermaid: boolean;
}) {
  async function loadMermaid() {
    const mermaid = await import("mermaid");

    let theme = "default";
    if (
      self.matchMedia &&
      self.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      theme = "dark";
    }

    mermaid.default.initialize({
      startOnLoad: false,
      theme: theme,
    });

    await mermaid.default.run({
      querySelector: ".mermaid",
    });
  }

  useEffect(() => {
    if (mermaid) {
      loadMermaid();
    }
  }, []);

  return null;
}
