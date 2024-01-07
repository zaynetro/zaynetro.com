import { AttrEntry, AttrSet, Expr } from "@/components/nix/datatypes.tsx";
import { Signal, signal } from "@preact/signals";
import { classNames } from "@/components/util.ts";
import {
  ExprView,
  resolveView,
  TooltipCtx,
  TooltipState,
  ViewDef,
} from "@/components/nix/views.tsx";
import { useContext, useRef } from "preact/hooks";

const strSeparator = (
  {
    hover,
    onClick,
  }: {
    hover: Signal<boolean>;
    onClick?: (e: Event) => void;
  },
) =>
() => (
  <span
    onMouseOver={() => hover.value = true}
    onMouseOut={() => hover.value = false}
    onClick={onClick}
    class={classNames("text-emerald-700 ring-emerald-300 cursor-pointer", {
      "ring-2": hover.value,
    })}
  >
    ''
  </span>
);

export function resolveStringView(ctx: TooltipState, str: string): ViewDef {
  function onClick(e: Event) {
    // Prevent reseting the tooltip
    e.stopPropagation();

    ctx.value = {
      docHref:
        "https://nixos.org/manual/nix/stable/language/values#type-string",
      title: "String",
      description: `
1.
    \`\`\`nix
    "Hello world!"
    \`\`\`
2. Indented string. Can span multiple lines
    \`\`\`nix
    ''
      Hello
      world!
    ''
    \`\`\`
`,
      el: e.target as HTMLElement,
    };
  }

  if (str.includes("\n")) {
    const hover = signal(false);
    const separator = strSeparator({ hover, onClick });
    return {
      size: "block",
      Left: separator,
      Right: separator,
      View: () => (
        <pre
          onMouseOver={() => hover.value = true}
          onMouseOut={() => hover.value = false}
          onClick={onClick}
          class={classNames(
            "ml-2 text-emerald-700 ring-emerald-300 cursor-pointer",
            {
              "ring-2": hover.value,
            },
          )}
        >
        {str}
        </pre>
      ),
    };
  }

  return {
    View: () => (
      <span
        onClick={onClick}
        class="text-emerald-700 ring-emerald-300 hover:ring-2 cursor-pointer"
      >
        "{str}"
      </span>
    ),
  };
}

export const resolveNumberView = (ctx: TooltipState, num: number): ViewDef => ({
  View: () => {
    const ref = useRef<HTMLSpanElement>(null);

    function onClick(e: Event) {
      // Prevent reseting the tooltip
      e.stopPropagation();

      ctx.value = {
        docHref:
          "https://nixos.org/manual/nix/stable/language/values#type-number",
        title: "Number",
        description: `
Numbers, which can be integers (like \`123\`) or floating point (like \`123.43\` or \`.27e13\`).
`,
        el: ref.current as HTMLElement,
      };
    }

    return (
      <span
        ref={ref}
        onClick={onClick}
        class="text-violet-700 ring-violet-300 cursor-pointer hover:ring-2"
      >
        {num}
      </span>
    );
  },
});

export const resolveBooleanView = (
  ctx: TooltipState,
  value: boolean,
): ViewDef => ({
  View: () => {
    function onClick(e: Event) {
      // Prevent reseting the tooltip
      e.stopPropagation();

      ctx.value = {
        docHref:
          "https://nixos.org/manual/nix/stable/language/values#type-boolean",
        title: "Boolean",
        description: "Booleans with values `true` and `false`.",
        el: e.target as HTMLElement,
      };
    }

    return (
      <span
        onClick={onClick}
        class="text-pink-700 ring-ping-300 cursor-pointer hover:ring-2"
      >
        {value.toString()}
      </span>
    );
  },
});

export const resolveNullView = (ctx: TooltipState): ViewDef => ({
  View: () => {
    function onClick(e: Event) {
      // Prevent reseting the tooltip
      e.stopPropagation();

      ctx.value = {
        docHref:
          "https://nixos.org/manual/nix/stable/language/values#type-null",
        title: "Null",
        description: "The null value, denoted as `null`.",
        el: e.target as HTMLElement,
      };
    }

    return (
      <span
        onClick={onClick}
        class="text-pink-700 ring-ping-300 cursor-pointer hover:ring-2"
      >
        null
      </span>
    );
  },
});

export const resolvePathView = (ctx: TooltipState, path: string): ViewDef => ({
  View: () => {
    function onClick(e: Event) {
      // Prevent reseting the tooltip
      e.stopPropagation();

      ctx.value = {
        docHref:
          "https://nixos.org/manual/nix/stable/language/values#type-path",
        title: "Path",
        description: `
A path must contain at least one slash to be recognised as such.

\`\`\`nix
./config/hello.txt # Relative path
/var/lib/nginx.log # Absolute path
~/Downloads        # Relative to home directory
\`\`\`

<a href="https://nixos.org/manual/nix/stable/language/constructs/lookup-path" target="_blank">Lookup paths</a> such as \`<nixpkgs>\` resolve to path values.

\`\`\`nix
<nixpkgs>
# Resolves to
/nix/var/nix/profiles/per-user/root/channels/nixpkgs
\`\`\`
        `,
        el: e.target as HTMLElement,
      };
    }

    return (
      <span
        onClick={onClick}
        class="text-violet-700 ring-violet-300 cursor-pointer hover:ring-2"
      >
        {path}
      </span>
    );
  },
});

// For URIs quotes can be omited
export const resolveUriView = (ctx: TooltipState, uri: string): ViewDef => ({
  View: () => {
    function onClick(e: Event) {
      // Prevent reseting the tooltip
      e.stopPropagation();

      ctx.value = {
        docHref:
          "https://nixos.org/manual/nix/stable/language/values#type-string",
        title: "String",
        description: `
URI is a third type of String.

URIs as defined in appendix B of RFC 2396 can be written as is, without quotes.

For instance, the string \`"http://example.org/foo.tar.bz2"\` can also be written as \`http://example.org/foo.tar.bz2\`.`,
        el: e.target as HTMLElement,
      };
    }

    return (
      <span
        onClick={onClick}
        class="text-violet-700 ring-violet-300 cursor-pointer hover:ring-2"
      >
        {uri}
      </span>
    );
  },
});

export const resolveIdentView = (
  ctx: TooltipState,
  value: string,
): ViewDef => ({
  View: () => {
    function onClick(e: Event) {
      // Prevent reseting the tooltip
      e.stopPropagation();

      ctx.value = {
        title: "Identifier",
        description: `
*identifier ~* \`[a-zA-Z_][a-zA-Z0-9_'-]*\`

In Attribute Sets identifiers could be used as attribute names.

Elsewhere identifiers are variable or function references.
`,
        el: e.target as HTMLElement,
      };
    }

    return (
      <span
        onClick={onClick}
        class="text-black ring-black/25 cursor-pointer hover:ring-2"
      >
        {value}
      </span>
    );
  },
});

const blockSeparator = (
  symbol: string,
  { hover, onClick, onTokenClick }: {
    hover: Signal<boolean>;
    onClick?: (e: Event) => void;
    onTokenClick?: (e: Event) => void;
  },
  token?: string,
) =>
() => (
  <span>
    {!!token && (
      <span
        onClick={onTokenClick}
        class="text-lime-700 font-bold mr-2 hover:ring-2"
      >
        {token}
      </span>
    )}
    <span
      onMouseOver={() => hover.value = true}
      onMouseOut={() => hover.value = false}
      onClick={onClick}
      class={classNames("text-black ring-black/25 cursor-pointer", {
        "ring-2": hover.value,
      })}
    >
      {symbol}
    </span>
  </span>
);

export function resolveListView(ctx: TooltipState, list: Expr[]): ViewDef {
  let isBlock = list.length > 5;
  if (!isBlock) {
    isBlock = list.some((item) => resolveView(ctx, item).size == "block");
  }

  function onClick(e: Event) {
    // Prevent reseting the tooltip
    e.stopPropagation();

    ctx.value = {
      docHref: "https://nixos.org/manual/nix/stable/language/values#list",
      title: "List",
      description: `
Lists are formed by enclosing a whitespace-separated list of values between square brackets. For example,

\`\`\`nix
[ 123 ./foo.nix "abc" ]
\`\`\`

defines a list of three elements.
`,
      el: e.target as HTMLElement,
    };
  }

  if (isBlock) {
    const hover = signal(false);
    return {
      size: "block",
      View: () => <ListRows list={list} />,
      Left: blockSeparator("[", { hover, onClick }),
      Right: blockSeparator("]", { hover, onClick }),
    };
  }

  return {
    View: () => (
      <div
        onClick={onClick}
        class="inline-flex gap-2 cursor-pointer ring-black/25 hover:ring-2"
      >
        <span class="text-black">{"["}</span>
        <ListRows list={list} />
        <span class="text-black">{"]"}</span>
      </div>
    ),
  };
}

export function resolveAttrSetView(ctx: TooltipState, set: AttrSet): ViewDef {
  let isBlock = set.recursive || set.size == "block" ||
    Object.entries(set.entries).length > 2;

  if (!isBlock) {
    isBlock = Object.values(set.entries).some((entry) =>
      "value" in entry && resolveView(ctx, entry.value).size == "block"
    );
  }

  function onClick(e: Event) {
    // Prevent reseting the tooltip
    e.stopPropagation();

    ctx.value = {
      docHref:
        "https://nixos.org/manual/nix/stable/language/values#attribute-set",
      title: "Attribute Set",
      description: `
An attribute set is a collection of name-value-pairs (called attributes) enclosed in curly brackets (\`{ }\`).

An attribute name can be an identifier or a string.

Names and values are separated by an equal sign (\`=\`).
Each value is an arbitrary expression terminated by a semicolon (\`;\`).

Example:

\`\`\`nix
{
  x = 123;
  text = "Hello";
  y = f { bla = 456; };
}
\`\`\`

This defines a set with attributes named x, text, y.
`,
      el: e.target as HTMLElement,
    };
  }

  function onRecClick(e: Event) {
    // Prevent reseting the tooltip
    e.stopPropagation();

    ctx.value = {
      docHref:
        "https://nixos.org/manual/nix/stable/language/constructs.html#recursive-sets",
      title: "Recursive sets",
      description: `
Recursive sets are like normal attribute sets, but the attributes can refer to each other.

Example:

\`\`\`nix
rec {
  y = 123;
  x = y;
}
\`\`\`

evaluates to

\`\`\`nix
{
  y = 123;
  x = 123;
}
\`\`\`
`,
      el: e.target as HTMLElement,
    };
  }

  if (isBlock) {
    const hover = signal(false);
    return {
      size: "block",
      View: () => <AttrSetRows set={set} onClick={onClick} hover={hover} />,
      Left: blockSeparator(
        "{",
        { hover, onClick, onTokenClick: onRecClick },
        set.recursive ? "rec" : undefined,
      ),
      Right: blockSeparator("}", { hover, onClick }),
    };
  }

  return {
    View: () => (
      <div
        onClick={onClick}
        class="inline-flex gap-2 cursor-pointer ring-black/25 hover:ring-2"
      >
        <span class="text-black">{"{"}</span>
        <AttrSetRows set={set} onClick={onClick} />
        <span class="text-black">{"}"}</span>
      </div>
    ),
  };
}

function ListRows({ list }: { list: Expr[] }) {
  return (
    <>
      {list.map((item) => <ExprView expr={item} />)}
    </>
  );
}

function AttrSetRows({
  set,
  onClick,
  hover,
}: {
  set: AttrSet;
  onClick: (e: Event) => void;
  hover?: Signal<boolean>;
}) {
  return (
    <>
      {set.entries.map((e) => (
        <AttrSetEntry entry={e} onClick={onClick} hover={hover} />
      ))}
    </>
  );
}

export function AttrSetEntry({
  entry,
  onClick,
  hover,
}: {
  entry: AttrEntry;
  onClick: (e: Event) => void;
  hover?: Signal<boolean>;
}) {
  const ctx = useContext(TooltipCtx);

  function setHover(v: boolean) {
    if (hover) {
      hover.value = v;
    }
  }

  function onInheritClick(e: Event) {
    // Prevent reseting the tooltip
    e.stopPropagation();

    ctx.value = {
      docHref:
        "https://nixos.org/manual/nix/stable/language/constructs.html#inheriting-attributes",
      title: "Inheriting attributes",
      description: `
When defining an attribute set or in a let-expression it is often convenient to copy variables
from the surrounding lexical scope (e.g., when you want to propagate attributes).
This can be shortened using the inherit keyword.

Example:

\`\`\`nix
let x = 123; in
{
  inherit x;
  y = 456;
}
\`\`\`

is equivalent to

\`\`\`nix
let x = 123; in
{
  x = x;
  y = 456;
}
\`\`\`

and both evaluate to \`{ x = 123; y = 456; }\`.

It is possible to inherit multiple attributes:

\`\`\`nix
inherit x y z;
\`\`\`
`,
      el: e.target as HTMLElement,
    };
  }

  if ("inherit" in entry) {
    return (
      <div>
        <span
          onClick={onInheritClick}
          onMouseOver={() => setHover(true)}
          onMouseOut={() => setHover(false)}
          class={classNames("text-lime-700 font-bold cursor-pointer", {
            "ring-2": hover?.value ?? false,
          })}
        >
          inherit
        </span>
        <div class="inline-flex gap-2 ml-2">
          {entry.inherit.map((e) => {
            const View = resolveIdentView(ctx, e.value).View;
            return <View />;
          })}
        </div>
        <span class="text-black">;</span>
      </div>
    );
  }

  const Name = typeof entry.name == "string"
    ? resolveStringView(ctx, entry.name).View
    : resolveIdentView(ctx, entry.name.value).View;
  const viewDef = resolveView(ctx, entry.value);

  // TODO: clicking on the keys should display docs about them (not strings)

  if (viewDef.size != "block") {
    // Inline view
    return (
      <div>
        <Name />
        <span
          onClick={onClick}
          onMouseOver={() => setHover(true)}
          onMouseOut={() => setHover(false)}
          class={classNames("text-black mx-2 ring-black/25 cursor-pointer", {
            "ring-2": hover?.value ?? false,
          })}
        >
          =
        </span>
        <viewDef.View />
        <span class="text-black">;</span>
      </div>
    );
  }

  // Block view
  return (
    <>
      <div>
        <Name />
        <span
          onClick={onClick}
          onMouseOver={() => setHover(true)}
          onMouseOut={() => setHover(false)}
          class={classNames("text-black mx-2 ring-black/25 cursor-pointer", {
            "ring-2": hover?.value ?? false,
          })}
        >
          =
        </span>
        <span class="text-black">
          {!!viewDef.Left && <viewDef.Left />}
        </span>
      </div>
      <div class="ml-2 flex flex-col items-start">
        <viewDef.View />
      </div>
      <div class="flex">
        {!!viewDef.Right && <viewDef.Right />}
        <span class="text-black">;</span>
      </div>
    </>
  );
}
