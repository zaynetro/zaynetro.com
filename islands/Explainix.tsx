import { ExprView, TooltipCtx } from "@/components/nix/views.tsx";
import {
  binOp,
  Expr,
  fnCall,
  grouped,
  ident,
} from "@/components/nix/datatypes.tsx";
import { signal, useSignal } from "@preact/signals";
import { useContext, useEffect, useRef } from "preact/hooks";
import IconExternalLink from "@tabler/icons-preact/dist/esm/icons/IconExternalLink.js";
import { BrowserRenderer } from "@/utils/browser_renderer.ts";
import { marked } from "marked";
import { classNames } from "@/components/util.ts";

type Section = {
  description: string;
  expr: Expr;
};

const sections: Section[] = [{
  /* https://nixos.org/manual/nix/stable/language/values */
  description: "Data types",
  expr: {
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
  description: "Language constructs",
  expr: {
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
        condition: binOp(ident("x"), "<", ident("y")),
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
        body: binOp(ident("a"), "+", ident("b")),
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
      value: {
        type: "LetIn",
        defs: [{
          name: ident("concat"),
          value: {
            type: "Fn",
            arg: ident("x"),
            body: {
              type: "Fn",
              arg: ident("y"),
              body: binOp(ident("x"), "+", ident("y")),
            },
          },
        }],
        body: fnCall("concat", [ident("x"), ident("y")]),
      },
    }, {
      name: "assertions",
      value: {
        type: "Assert",
        cond: binOp(ident("x"), "!=", 0),
        body: "x is not zero",
      },
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
          body: binOp(ident("x"), "+", ident("y")),
        },
      },
    }],
  },
}, {
  /* https://nixos.org/manual/nix/stable/language/operators.html */
  description: "Operators",
  expr: [
    grouped(binOp(2, "+", 3)),
    grouped(binOp("foo", "+", "bar")),
    grouped(binOp([1, 2], "++", [3, 4])),
    grouped(binOp(
      {
        type: "AttrSet",
        entries: [
          { name: ident("x"), value: 1 },
        ],
      },
      "//",
      { type: "AttrSet", entries: [{ name: ident("y"), value: 2 }] },
    )),
    grouped(binOp(ident("x"), "->", ident("y"))),
    grouped(
      binOp(
        { type: "AttrSet", entries: [{ name: ident("y"), value: 2 }] },
        "?",
        "x",
      ),
    ),
    grouped(
      {
        type: "AttrSel",
        attrset: {
          type: "AttrSet",
          entries: [{
            name: ident("y"),
            value: 1,
          }],
        },
        path: "x",
        or: 0,
      },
    ),
  ],
}];

export default function Explainix() {
  return (
    <TooltipCtx.Provider value={signal(null)}>
      <div class="flex lg:gap-4 pb-16">
        <section class="grow">
          <CodeSnippet />
        </section>
        <section class="lg:w-2/5">
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
    <div onClick={onClick} class="flex flex-col gap-4">
      {sections.map((s) => (
        <>
          <p class="font-bold">{s.description}</p>
          <div class="font-mono text-sm bg-orange-100 p-4 overflow-x-auto">
            <ExprView expr={s.expr} />
          </div>
        </>
      ))}
    </div>
  );
}

function Tooltip() {
  const ctx = useContext(TooltipCtx);
  const ref = useRef<HTMLDivElement>(null);
  // Add padding so that tooltip is on the same level as clicked element
  // (on mobile use top)
  const paddingTop = useSignal<number | null>(null);

  const val = ctx.value;
  if (!val) {
    return null;
  }

  let property = "paddingTop";
  if (ref.current && getComputedStyle(ref.current).position == "absolute") {
    property = "top";
  }

  useEffect(() => {
    function listener(e: KeyboardEvent) {
      if (e.code == "Escape") {
        // Close tooltip on escape
        ctx.value = null;
      }
    }

    document.addEventListener("keyup", listener);

    return () => {
      document.removeEventListener("keyup", listener);
    };
  }, []);

  useEffect(() => {
    // We calculate this in the effect because otherwise we won't have it
    // on the first render.
    const headerHeight = 36;
    if (ref.current) {
      let value = val.el.offsetTop - ref.current.offsetTop;
      if (property == "top") {
        value += ref.current.offsetTop + 2 * headerHeight;
      } else if (value > headerHeight) {
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
      class={classNames(
        "absolute left-0 right-0 mx-4 rounded-md p-4 shadow-lg" +
          " lg:p-0 lg:mx-0 lg:static lg:shadow-none",
        {
          "transition-[padding]": property == "paddingTop",
          "transition-[top]": property == "top",
        },
      )}
      style={{
        [property]: `${paddingTop.value}px`,
        backgroundColor: "var(--bg-color)",
      }}
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
