import { IfElse, LetIn, WithExpr } from "@/components/nix/datatypes.tsx";
import { resolveView, TooltipState, ViewDef } from "@/components/nix/views.tsx";
import {
  AttrSetEntry,
  resolveIdentView,
} from "@/components/nix/primitive_views.tsx";

export const resolveIfElseView = (
  ctx: TooltipState,
  ifElse: IfElse,
): ViewDef => ({
  View: () => {
    const Cond = resolveView(ctx, ifElse.condition).View;
    const Body = resolveView(ctx, ifElse.body).View;
    const Else = resolveView(ctx, ifElse.else).View;

    function onClick(e: Event) {
      // Prevent reseting the tooltip
      e.stopPropagation();

      ctx.value = {
        docHref:
          "https://nixos.org/manual/nix/stable/language/constructs.html#conditionals",
        title: "Conditionals",
        description: `
Conditionals look like this:

\`\`\`nix
if e1 then e2 else e3
\`\`\`

where e1 is an expression that should evaluate to a Boolean value (\`true\` or \`false\`).
`,
        el: e.target as HTMLElement,
      };
    }

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

    function onClick(e: Event) {
      // Prevent reseting the tooltip
      e.stopPropagation();

      ctx.value = {
        docHref:
          "https://nixos.org/manual/nix/stable/language/constructs.html#let-expressions",
        title: "Let-expressions",
        description: `
A let-expression allows you to define local variables for an expression.

Example:

\`\`\`nix
let
  x = "foo";
  y = "bar";
in x + y
\`\`\`

This evaluates to \`"foobar"\`.
`,
        el: e.target as HTMLElement,
      };
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

  function onClick(e: Event) {
    // Prevent reseting the tooltip
    e.stopPropagation();

    ctx.value = {
      docHref:
        "https://nixos.org/manual/nix/stable/language/constructs.html#with-expressions",
      title: "With-expressions",
      description: `
A with-expression,

\`\`\`nix
with e1; e2
\`\`\`

introduces the set e1 into the lexical scope of the expression e2. For instance,

\`\`\`nix
let as = { x = "foo"; y = "bar"; };
in with as; x + y
\`\`\`

evaluates to \`"foobar"\` since the with adds the \`x\` and \`y\` attributes of as to the lexical scope in the expression \`x + y\`.
`,
      el: e.target as HTMLElement,
    };
  }

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
