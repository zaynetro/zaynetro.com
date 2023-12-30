import { Expr } from "@/components/nix/datatypes.tsx";
import { createContext, FunctionComponent } from "preact";
import {
  resolveAttrSetView,
  resolveBooleanView,
  resolveIdentView,
  resolveListView,
  resolveNullView,
  resolveNumberView,
  resolvePathView,
  resolveStringView,
  resolveUriView,
} from "@/components/nix/primitive_views.tsx";
import {
  resolveIfElseView,
  resolveLetInView,
} from "@/components/nix/constructs.tsx";
import { Signal, signal } from "@preact/signals";

// Either a block or inline view
// Block view has separators on either side of the view.
export type ViewDef = {
  /** Inline by default */
  size?: "inline" | "block";
  Left?: FunctionComponent;
  Right?: FunctionComponent;
  View: FunctionComponent;
};

export function ExprView({ expr }: { expr: Expr }) {
  const viewDef = resolveView(expr);
  if (viewDef.size != "block") {
    // Inline
    return <viewDef.View />;
  }

  // Block
  return (
    <>
      {!!viewDef.Left && <viewDef.Left />}
      <div class="ml-2 flex flex-col items-start">
        <viewDef.View />
      </div>
      {!!viewDef.Right && <viewDef.Right />}
    </>
  );
}

export function resolveView(data: Expr): ViewDef {
  if (typeof data == "string") {
    return resolveStringView(data);
  } else if (typeof data == "number") {
    return resolveNumberView(data);
  } else if (typeof data == "boolean") {
    return resolveBooleanView(data);
  } else if (data === null) {
    return resolveNullView();
  } else if (Array.isArray(data)) {
    return resolveListView(data);
  } else if (data.type == "Path") {
    return resolvePathView(data.path);
  } else if (data.type == "Uri") {
    return resolveUriView(data.uri);
  } else if (data.type == "Ident") {
    return resolveIdentView(data.value);
  } else if (data.type == "AttrSet") {
    return resolveAttrSetView(data);
  } else if (data.type == "IfElse") {
    return resolveIfElseView(data);
  } else if (data.type == "LetIn") {
    return resolveLetInView(data);
  } else {
    throw new Error("Unknown data type: " + data);
  }
}

export type Tooltip = {
  description: string;
  el: HTMLElement;
};

export const TooltipCtx = createContext(
  signal(null) as Signal<Tooltip | null>,
);
