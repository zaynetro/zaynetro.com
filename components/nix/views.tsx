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
  resolveFnView,
  resolveIfElseView,
  resolveLetInView,
  resolveWithView,
} from "@/components/nix/constructs.tsx";
import { Signal, signal } from "@preact/signals";
import { useContext } from "preact/hooks";

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
  const ctx = useContext(TooltipCtx);
  const viewDef = resolveView(ctx, expr);
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

export function resolveView(ctx: TooltipState, data: Expr): ViewDef {
  if (typeof data == "string") {
    return resolveStringView(ctx, data);
  } else if (typeof data == "number") {
    return resolveNumberView(ctx, data);
  } else if (typeof data == "boolean") {
    return resolveBooleanView(ctx, data);
  } else if (data === null) {
    return resolveNullView(ctx);
  } else if (Array.isArray(data)) {
    return resolveListView(ctx, data);
  } else if (data.type == "Path") {
    return resolvePathView(ctx, data.path);
  } else if (data.type == "Uri") {
    return resolveUriView(ctx, data.uri);
  } else if (data.type == "Ident") {
    return resolveIdentView(ctx, data.value);
  } else if (data.type == "AttrSet") {
    return resolveAttrSetView(ctx, data);
  } else if (data.type == "IfElse") {
    return resolveIfElseView(ctx, data);
  } else if (data.type == "LetIn") {
    return resolveLetInView(ctx, data);
  } else if (data.type == "With") {
    return resolveWithView(ctx, data);
  } else if (data.type == "Fn") {
    return resolveFnView(ctx, data);
  } else {
    throw new Error("Unknown data type: " + data);
  }
}

export type Tooltip = {
  docHref?: string;
  title: string;
  description: string;
  el: HTMLElement;
};

export type TooltipState = Signal<Tooltip | null>;
export const TooltipCtx = createContext(signal(null) as TooltipState);

export function buildTooltipClick(
  ctx: TooltipState,
  doc: Omit<Tooltip, "el">,
): (e: Event) => void {
  return (e: Event) => {
    // Prevent reseting the tooltip
    e.stopPropagation();

    ctx.value = {
      ...doc,
      el: e.target as HTMLElement,
    };
  };
}
