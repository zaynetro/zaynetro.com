import { Renderer as MarkedRenderer } from "marked";

/** Markdown renderer for the browser (no server-side syntax highlighting — uses raw <pre>) */
export class BrowserRenderer extends MarkedRenderer {
  override code({ text, lang }: { text: string; lang?: string; escaped?: boolean }): string {
    const cls = lang ? ` class="language-${lang}"` : "";
    return `<pre><code${cls}>${text}</code></pre>`;
  }
}
