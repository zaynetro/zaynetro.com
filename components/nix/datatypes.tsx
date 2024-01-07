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

// TODO:
// - assert
// - with
// - inherit
// - import
// - let in
// - unary op
// - binary op
// - lambda def
// - lambda call (apply)
// - field access
// - string substitution

export type Expr = DataType | IfElse | LetIn;
