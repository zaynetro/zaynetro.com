import { AttrEntry, AttrSet, Expr } from "@/components/nix/datatypes.tsx";
import { Signal, signal } from "@preact/signals";
import { classNames } from "@/components/util.ts";
import {
  buildTooltipClick,
  ExprView,
  resolveView,
  TooltipCtx,
  TooltipState,
  ViewDef,
} from "@/components/nix/views.tsx";
import { useContext, useRef } from "preact/hooks";
import { DOCS } from "@/components/nix/docs.ts";

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
  const onClick = buildTooltipClick(ctx, DOCS.String);

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
    const onClick = buildTooltipClick(ctx, DOCS.Number);

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
    const onClick = buildTooltipClick(ctx, DOCS.Boolean);

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
    const onClick = buildTooltipClick(ctx, DOCS.Null);

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
    const onClick = buildTooltipClick(ctx, DOCS.Path);

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
    const onClick = buildTooltipClick(ctx, DOCS.Uri);

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
    const onClick = buildTooltipClick(ctx, DOCS.Ident);

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

export const blockSeparator = (
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
        class={classNames("text-lime-700 font-bold mr-2 hover:ring-2", {
          "cursor-pointer": !!onTokenClick,
        })}
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

  const onClick = buildTooltipClick(ctx, DOCS.List);

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

  const onClick = buildTooltipClick(ctx, DOCS.AttributeSet);
  const onRecClick = buildTooltipClick(ctx, DOCS.RecursiveSet);

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

  const onInheritClick = buildTooltipClick(ctx, DOCS.Inherit);

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
