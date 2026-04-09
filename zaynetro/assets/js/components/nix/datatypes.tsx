/**
 * Data types
 * Ref: https://nixos.org/manual/nix/stable/language/values
 */

export type Path = {
  type: "Path";
  path: string;
};

export type Uri = {
  type: "Uri";
  uri: string;
};

export type AttrSet = {
  type: "AttrSet";
  recursive?: boolean;
  size?: "block" | "inline";
  entries: AttrEntry[];
};

export type Ident = {
  type: "Ident";
  value: string;
};

export const ident = (value: string): Ident => ({ type: "Ident", value });

export type AttrEntry = {
  name: Ident | string;
  value: Expr;
} | {
  inherit: Ident[];
};

export type WithExpr = {
  type: "With";
  ident: Ident;
  body: Expr;
};

export type Assert = {
  type: "Assert";
  cond: Expr;
  body: Expr;
};

export type FnDef = {
  type: "Fn";
  arg: Ident;
  body: Expr;
};

/** Primitive types */
export type DataType =
  | string
  | number
  | boolean
  | null
  | Path
  | Uri
  | Ident
  | Array<Expr>
  | AttrSet
  | WithExpr
  | Assert
  | FnDef;

export type IfElse = {
  type: "IfElse";
  condition: Expr;
  body: Expr;
  else: Expr;
};

export type LetIn = {
  type: "LetIn";
  defs: { name: Ident; value: Expr }[];
  body: Expr;
};

export type BinaryOp = {
  type: "BinaryOp";
  left: Expr;
  op: BinOperator;
  right: Expr;
};

export type BinOperator =
  | "+"
  | "<"
  | ">"
  | "<="
  | ">="
  | "++"
  | "//"
  | "->"
  | "?"
  | "=="
  | "!=";

export const binOp = (left: Expr, op: BinOperator, right: Expr): BinaryOp => ({
  type: "BinaryOp",
  left,
  op,
  right,
});

export type FnCall = {
  type: "FnCall";
  name: Ident;
  args: Expr[];
};

export const fnCall = (name: string, args: Expr[]): FnCall => ({
  type: "FnCall",
  name: ident(name),
  args,
});

// Grouped inside parentheses
export type Grouped = {
  type: "Grouped";
  e: Expr;
};

export const grouped = (e: Expr): Grouped => ({ type: "Grouped", e });

// Attribute selection: `x.y or 1`
export type AttrSel = {
  type: "AttrSel";
  attrset: Expr;
  path: string;
  or?: Expr;
};

export type Expr =
  | DataType
  | IfElse
  | LetIn
  | BinaryOp
  | FnCall
  | Grouped
  | AttrSel;
