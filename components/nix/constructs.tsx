import { IfElse, LetIn } from "@/components/nix/datatypes.tsx";
import { resolveView, TooltipState, ViewDef } from "@/components/nix/views.tsx";
import { AttrSetEntry } from "@/components/nix/primitive_views.tsx";

export const resolveIfElseView = (
  ctx: TooltipState,
  ifElse: IfElse,
): ViewDef => ({
  View: () => {
    const Cond = resolveView(ctx, ifElse.condition).View;
    const Body = resolveView(ctx, ifElse.body).View;
    const Else = resolveView(ctx, ifElse.else).View;

    return (
      <div class="inline-flex gap-2 ring-lime-300 cursor-pointer hover:ring-2">
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

    function onClick(e: Event) {
    }

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
      <div class="flex flex-col items-start ring-lime-300 cursor-pointer hover:ring-2">
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
