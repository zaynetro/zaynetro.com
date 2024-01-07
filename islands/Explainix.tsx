import { ExprView, TooltipCtx } from "@/components/nix/views.tsx";
import { Expr, ident } from "@/components/nix/datatypes.tsx";
import { signal, useSignal } from "@preact/signals";
import { useContext, useEffect, useRef } from "preact/hooks";
import IconExternalLink from "@tabler/icons-preact/dist/esm/icons/IconExternalLink.js";
import { BrowserRenderer } from "@/utils/browser_renderer.ts";
import { marked } from "marked";
import { classNames } from "@/components/util.ts";

// TODO:
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
        value: {
          type: "LetIn",
          defs: [{
            name: ident("x"),
            value: 123,
          }],
          body: {
            type: "AttrSet",
            size: "block",
            entries: [{
              inherit: [ident("x")],
            }, {
              name: "y",
              value: 456,
            }],
          },
        },
      }, {
        name: "functions",
        value: "TODO",
      }, {
        name: "assertions",
        value: "TODO",
      }, {
        name: "with-expressions",
        value: {
          type: "LetIn",
          defs: [{
            name: ident("as"),
            value: {
              type: "AttrSet",
              entries: [{
                name: ident("x"),
                value: "foo",
              }, {
                name: ident("y"),
                value: "bar",
              }],
            },
          }],
          body: {
            type: "With",
            ident: ident("as"),
            // TODO: this needs to be x + y
            body: ident("x"),
          },
        },
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
      <div class="flex gap-4 pb-16">
        <section class="grow">
          <CodeSnippet />
        </section>
        <section class="w-2/5">
          <Tooltip />
        </section>
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
  const ref = useRef<HTMLDivElement>(null);
  // Add padding so that tooltip is on the same level as clicked element
  const paddingTop = useSignal<number | null>(null);

  const val = ctx.value;
  if (!val) {
    return null;
  }

  useEffect(() => {
    // We calculate this in the effect because otherwise we won't have it
    // on the first render.
    const headerHeight = 36;
    if (ref.current) {
      let value = val.el.offsetTop - ref.current.offsetTop;
      if (value > headerHeight) {
        value -= headerHeight;
      }
      paddingTop.value = value;
    }
  }, [val, ref.current]);

  const mdRenderer = new BrowserRenderer();
  const html = marked.parse(val.description, {
    gfm: true,
    renderer: mdRenderer,
  }) as string;

  return (
    <div
      ref={ref}
      style={{
        paddingTop: `${paddingTop.value}px`
      }}
      class="transition-[padding]"
    >
      <div class="flex justify-between items-center">
        <b>{val.title}</b>
        {!!val.docHref && (
          <a
            href={val.docHref}
            target="_blank"
            class="text-gray-500 hover:text-gray-700"
          >
            <IconExternalLink size={20} />
          </a>
        )}
      </div>
      <div
        class="mt-2 markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
