import {
  BinaryOp,
  FnDef,
  IfElse,
  LetIn,
  WithExpr,
} from "@/components/nix/datatypes.tsx";
import {
  buildTooltipClick,
  resolveView,
  TooltipState,
  ViewDef,
} from "@/components/nix/views.tsx";
import {
  AttrSetEntry,
  resolveIdentView,
} from "@/components/nix/primitive_views.tsx";
import { DOCS } from "@/components/nix/docs.ts";

export const resolveIfElseView = (
  ctx: TooltipState,
  ifElse: IfElse,
): ViewDef => ({
  View: () => {
    const Cond = resolveView(ctx, ifElse.condition).View;
    const Body = resolveView(ctx, ifElse.body).View;
    const Else = resolveView(ctx, ifElse.else).View;
    const onClick = buildTooltipClick(ctx, DOCS.IfElse);

    return (
      <div
        onClick={onClick}
        class="inline-flex gap-2 ring-lime-300 cursor-pointer hover:ring-2"
      >
        <span class="text-lime-700 font-bold">if</span>
        <Cond />
        <span class="text-lime-700 font-bold">then</span>
        <Body />
        <span class="text-lime-700 font-bold">else</span>
        <Else />
      </div>
    );
  },
});

export const resolveLetInView = (ctx: TooltipState, letIn: LetIn): ViewDef => ({
  size: "block",
  View: () => {
    const bodyDef = resolveView(ctx, letIn.body);
    const inToken = <span class="text-lime-700 font-bold">in</span>;
    const onClick = buildTooltipClick(ctx, DOCS.Let);

    let inBlock;
    if (bodyDef.size != "block") {
      // Inline view
      inBlock = (
        <div class="flex gap-2">
          {inToken}
          <bodyDef.View />
        </div>
      );
    } else {
      inBlock = (
        <>
          <div class="flex gap-2">
            {inToken}
            {!!bodyDef.Left && <bodyDef.Left />}
          </div>
          <div class="ml-2">
            <bodyDef.View />
          </div>
          {!!bodyDef.Right && <bodyDef.Right />}
        </>
      );
    }

    return (
      <div
        onClick={onClick}
        class="flex flex-col items-start ring-lime-300 cursor-pointer hover:ring-2"
      >
        <span class="text-lime-700 font-bold">let</span>
        <div class="ml-2 flex flex-col">
          {letIn.defs.map((def) => (
            <AttrSetEntry entry={def} onClick={onClick} />
          ))}
        </div>
        {inBlock}
      </div>
    );
  },
});

export function resolveWithView(
  ctx: TooltipState,
  withExpr: WithExpr,
): ViewDef {
  const bodyDef = resolveView(ctx, withExpr.body);
  const Ident = resolveIdentView(ctx, withExpr.ident.value).View;
  const onClick = buildTooltipClick(ctx, DOCS.With);

  if (bodyDef.size != "block") {
    // Inline view
    return {
      View: () => (
        <div class="inline-flex gap-2">
          <span
            onClick={onClick}
            class="text-lime-700 font-bold cursor-pointer hover:ring-2"
          >
            with
          </span>
          <span>
            <Ident />
            <span class="text-black">;</span>
          </span>
          <bodyDef.View />
        </div>
      ),
    };
  }

  // Block view
  return {
    View: () => <b>TODO</b>,
  };
}

export function resolveFnView(
  ctx: TooltipState,
  fn: FnDef,
): ViewDef {
  const bodyDef = resolveView(ctx, fn.body);
  const Ident = resolveIdentView(ctx, fn.arg.value).View;
  const onClick = buildTooltipClick(ctx, DOCS.Fn);

  if (bodyDef.size != "block") {
    // Inline view
    return {
      View: () => (
        <div class="inline-flex hover:ring-2">
          <span onClick={onClick}>
            <Ident />
            <span
              onClick={onClick}
              class="text-black mr-2"
            >
              :
            </span>
          </span>
          <bodyDef.View />
        </div>
      ),
    };
  }

  // Block view
  return {
    View: () => <b>TODO</b>,
  };
}

export function resolveBinOpView(
  ctx: TooltipState,
  e: BinaryOp,
): ViewDef {
  const leftDef = resolveView(ctx, e.left);
  const rightDef = resolveView(ctx, e.right);
  let onClick: (e: Event) => void | undefined;

  switch (e.op) {
    case "+":
      onClick = buildTooltipClick(ctx, DOCS.BinOpAdd);
      break;

    case "<":
    case ">":
    case "<=":
    case ">=":
      onClick = buildTooltipClick(ctx, DOCS.BinOpCompare);
      break;
  }

  // Support only inline view
  return {
    View: () => (
      <div class="inline-flex gap-2 hover:ring-2">
        <leftDef.View />
        <span
          onClick={onClick}
          class="text-black"
        >
          {e.op}
        </span>
        <rightDef.View />
      </div>
    ),
  };
}
