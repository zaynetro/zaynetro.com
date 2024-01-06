import { Renderer as MarkedRenderer } from "marked";
import { default as Prism } from "prismjs";

import "prismjs/components/prism-nix?no-check";

/** Markdown renderer for the browser */
export class BrowserRenderer extends MarkedRenderer {
  code(code: string, language?: string) {
    const grammar =
      language && Object.hasOwnProperty.call(Prism.languages, language)
        ? Prism.languages[language]
        : undefined;
    if (!grammar) {
      return `<pre><code class="notranslate">${code}</code></pre>`;
    }
    const html = Prism.highlight(code, grammar, language!);
    return `<div class="highlight highlight-source-${language} notranslate"><pre>${html}</pre></div>`;
  }
}
