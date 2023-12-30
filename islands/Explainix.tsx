// TODO: change of plans!
// Instead of parsing user code. I want to display a Nix snippet that will show case the syntax.
// It should include all primitive types and language constructs.
// On hover it shows a tooltip with explanation.
// On click it saves this tooltip to the sidebar.
// Sidebar shows a stack of saved tooltips and can hover to highlight the code.
// Clicking a tooltip expands it (by default it shows only the title)

import { ExprView, TooltipCtx } from "@/components/nix/views.tsx";
import { Expr, ident } from "@/components/nix/datatypes.tsx";
import { signal } from "@preact/signals";
import { useContext } from "preact/hooks";

// Modes:
// 1) Display a snippet of code of all features
// 2) Display list of features one by one (e.g number, string, attrset, ...)
//    (kind of a list of all tooltips)

const showcase: Expr = {
  type: "AttrSet",
  entries: [{
    name: ident("description"),
    value: `Welcome to Explainix!

In this code sample I will showcase the Nix language.
Hover over any element to see how it spans.
Click on any element to display help.`,
  }, {
    /* https://nixos.org/manual/nix/stable/language/values */
    name: "Data types",
    value: {
      type: "AttrSet",
      entries: [{
        name: "list of numbers",
        value: [123, 456.78],
      }, {
        name: ident("booleans"),
        value: [true, false],
      }, {
        name: ident("null"),
        value: null,
      }, {
        name: ident("string"),
        value: "Hello world!",
      }, {
        name: ident("multiline_string"),
        value: `This string
can span multiple lines.`,
      }, {
        name: ident("uri"),
        value: { type: "Uri", uri: "https://zaynetro.com/explainix" },
      }, {
        name: ident("paths"),
        value: {
          type: "AttrSet",
          entries: [{
            name: ident("relative"),
            value: { type: "Path", path: "./config/hello.txt" },
          }, {
            name: ident("absolute"),
            value: { type: "Path", path: "/var/lib/nginx.log" },
          }, {
            name: ident("home_path"),
            value: { type: "Path", path: "~/Downloads" },
          }, {
            name: ident("lookup_path"),
            value: { type: "Path", path: "<nixpkgs>" },
          }],
        },
      }, {
        name: "attribute set",
        value: {
          type: "AttrSet",
          entries: [{
            name: ident("a"),
            value: 123,
          }],
        },
      }],
    },
  }, {
    /* https://nixos.org/manual/nix/stable/language/constructs */
    name: "Language constructs",
    value: {
      type: "AttrSet",
      entries: [{
        name: "recursive set",
        value: {
          type: "AttrSet",
          recursive: true,
          entries: [{
            name: ident("x"),
            value: ident("y"),
          }, {
            name: ident("y"),
            value: 123,
          }],
        },
      }, {
        name: "conditionals",
        value: {
          type: "IfElse",
          condition: ident("condition"),
          body: "this",
          else: "otherwise",
        },
      }, {
        name: "let-expressions",
        value: {
          type: "LetIn",
          defs: [{
            name: ident("a"),
            value: 23,
          }, {
            name: ident("b"),
            value: 45,
          }],
          // TODO: make this a + b
          body: {
            type: "AttrSet",
            entries: [],
          },
        },
      }, {
        name: "inheriting attributes",
        value: "TODO",
      }, {
        name: "functions",
        value: "TODO",
      }, {
        name: "assertions",
        value: "TODO",
      }, {
        name: "with-expressions",
        value: "TODO",
      }, {
        name: "string substitution",
        value: "TODO",
      }],
    },
  }, {
    /* https://nixos.org/manual/nix/stable/language/operators.html */
    name: "Operators",
    value: "TODO",
  }],
};

export default function Explainix() {
  return (
    <TooltipCtx.Provider value={signal(null)}>
      <div class="flex gap-4">
        <CodeSnippet />
        <Tooltip />
      </div>
    </TooltipCtx.Provider>
  );
}

function CodeSnippet() {
  const ctx = useContext(TooltipCtx);

  function onClick() {
    // Reset tooltip when clicked outside of the code.
    ctx.value = null;
  }

  return (
    <div
      onClick={onClick}
      class="font-mono text-sm bg-orange-100 p-4"
    >
      <ExprView expr={showcase} />
    </div>
  );
}

function Tooltip() {
  const ctx = useContext(TooltipCtx);
  return (
    <div>
      Currently clicked on: {ctx.value?.el.nodeName}
    </div>
  );
}
