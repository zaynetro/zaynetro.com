import { AttrEntry, AttrSet, Expr } from "@/components/nix/datatypes.tsx";
import { Signal, signal } from "@preact/signals";
import { classNames } from "@/components/util.ts";
import {
  ExprView,
  resolveView,
  TooltipCtx,
  ViewDef,
} from "@/components/nix/views.tsx";
import { useContext, useRef } from "preact/hooks";

const strSeparator = (hover: Signal<boolean>) => () => (
  <span
    onMouseOver={() => hover.value = true}
    onMouseOut={() => hover.value = false}
    class={classNames("text-emerald-700 ring-emerald-300 cursor-pointer", {
      "ring-2": hover.value,
    })}
  >
    ''
  </span>
);

export function resolveStringView(str: string): ViewDef {
  if (str.includes("\n")) {
    const hover = signal(false);
    const separator = strSeparator(hover);
    return {
      size: "block",
      Left: separator,
      Right: separator,
      View: () => (
        <pre
          onMouseOver={() => hover.value = true}
          onMouseOut={() => hover.value = false}
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
      <span class="text-emerald-700 ring-emerald-300 hover:ring-2 cursor-pointer">
        "{str}"
      </span>
    ),
  };
}

export const resolveNumberView = (num: number): ViewDef => ({
  View: () => {
    const ref = useRef<HTMLSpanElement>(null);
    const ctx = useContext(TooltipCtx);

    function onClick(e: Event) {
      e.stopPropagation();
      ctx.value = {
        description: "Number",
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

export const resolveBooleanView = (value: boolean): ViewDef => ({
  View: () => (
    <span class="text-pink-700 ring-ping-300 cursor-pointer hover:ring-2">
      {value.toString()}
    </span>
  ),
});

export const resolveNullView = (): ViewDef => ({
  View: () => (
    <span class="text-pink-700 ring-ping-300 cursor-pointer hover:ring-2">
      null
    </span>
  ),
});

export const resolvePathView = (path: string): ViewDef => ({
  View: () => (
    <span class="text-violet-700 ring-violet-300 cursor-pointer hover:ring-2">
      {path}
    </span>
  ),
});

// For URIs quotes can be omited
export const resolveUriView = (uri: string): ViewDef => ({
  View: () => (
    <span class="text-violet-700 ring-violet-300 cursor-pointer hover:ring-2">
      {uri}
    </span>
  ),
});

export const resolveIdentView = (value: string): ViewDef => ({
  View: () => (
    <span class="text-black ring-black/25 cursor-pointer hover:ring-2">
      {value}
    </span>
  ),
});

const blockSeparator =
  (symbol: string, hover: Signal<boolean>, token?: string) => () => (
    <span
      onMouseOver={() => hover.value = true}
      onMouseOut={() => hover.value = false}
      class={classNames("text-black ring-black/25 cursor-pointer", {
        "ring-2": hover.value,
      })}
    >
      {!!token && <span class="text-lime-700 font-bold mr-2">{token}</span>}
      {symbol}
    </span>
  );

export function resolveListView(list: Expr[]): ViewDef {
  let isBlock = list.length > 5;
  if (!isBlock) {
    isBlock = list.some((item) => resolveView(item).size == "block");
  }

  if (isBlock) {
    const hover = signal(false);
    return {
      size: "block",
      View: () => <ListRows list={list} />,
      Left: blockSeparator("[", hover),
      Right: blockSeparator("]", hover),
    };
  }

  return {
    View: () => (
      <div class="inline-flex gap-2 cursor-pointer ring-black/25 hover:ring-2">
        <span class="text-black">{"["}</span>
        <ListRows list={list} />
        <span class="text-black">{"]"}</span>
      </div>
    ),
  };
}

export function resolveAttrSetView(set: AttrSet): ViewDef {
  let isBlock = set.recursive || Object.entries(set.entries).length > 2;
  if (!isBlock) {
    isBlock = Object.values(set.entries).some((entry) =>
      resolveView(entry.value).size == "block"
    );
  }

  if (isBlock) {
    const hover = signal(false);
    return {
      size: "block",
      View: () => <AttrSetRows set={set} />,
      Left: blockSeparator("{", hover, set.recursive ? "rec" : undefined),
      Right: blockSeparator("}", hover),
    };
  }

  return {
    View: () => (
      <div class="inline-flex gap-2 cursor-pointer ring-black/25 hover:ring-2">
        <span class="text-black">{"{"}</span>
        <AttrSetRows set={set} />
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

function AttrSetRows({ set }: { set: AttrSet }) {
  return (
    <>
      {set.entries.map((e) => <AttrSetEntry entry={e} />)}
    </>
  );
}

export function AttrSetEntry({ entry }: { entry: AttrEntry }) {
  const Name = typeof entry.name == "string"
    ? resolveStringView(entry.name).View
    : resolveIdentView(entry.name.value).View;
  const viewDef = resolveView(entry.value);

  // TODO: allow clicking on `=`

  if (viewDef.size != "block") {
    // Inline view
    return (
      <div>
        <Name />
        <span class="text-black mx-2">=</span>
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
        <span class="text-black mx-2">=</span>
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
