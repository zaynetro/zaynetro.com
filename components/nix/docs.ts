export const DOCS = {
  "String": {
    docHref: "https://nixos.org/manual/nix/stable/language/values#type-string",
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
  },

  "Number": {
    docHref: "https://nixos.org/manual/nix/stable/language/values#type-number",
    title: "Number",
    description: `
Numbers, which can be integers (like \`123\`) or floating point
(like \`123.43\` or \`.27e13\`).
`,
  },

  "Boolean": {
    docHref: "https://nixos.org/manual/nix/stable/language/values#type-boolean",
    title: "Boolean",
    description: "Booleans with values `true` and `false`.",
  },

  "Null": {
    docHref: "https://nixos.org/manual/nix/stable/language/values#type-null",
    title: "Null",
    description: "The null value, denoted as `null`.",
  },

  "Path": {
    docHref: "https://nixos.org/manual/nix/stable/language/values#type-path",
    title: "Path",
    description: `
A path must contain at least one slash to be recognised as such.

\`\`\`nix
./config/hello.txt # Relative path
/var/lib/nginx.log # Absolute path
~/Downloads        # Relative to home directory
\`\`\`

<a href="https://nixos.org/manual/nix/stable/language/constructs/lookup-path" target="_blank">Lookup paths</a>
such as \`<nixpkgs>\` resolve to path values.

\`\`\`nix
<nixpkgs>
# Resolves to
/nix/var/nix/profiles/per-user/root/channels/nixpkgs
\`\`\`
        `,
  },

  "Uri": {
    docHref: "https://nixos.org/manual/nix/stable/language/values#type-string",
    title: "String",
    description: `
URI is a third type of String.

URIs as defined in appendix B of RFC 2396 can be written as is, without quotes.

For instance, the string \`"http://example.org/foo.tar.bz2"\` can also be written
as \`http://example.org/foo.tar.bz2\`.`,
  },

  "Ident": {
    title: "Identifier",
    description: `
*identifier ~* \`[a-zA-Z_][a-zA-Z0-9_'-]*\`

In Attribute Sets identifiers could be used as attribute names.

Elsewhere identifiers are variable or function references.
`,
  },

  "List": {
    docHref: "https://nixos.org/manual/nix/stable/language/values#list",
    title: "List",
    description: `
Lists are formed by enclosing a whitespace-separated list of values
between square brackets. For example,

\`\`\`nix
[ 123 ./foo.nix "abc" ]
\`\`\`

defines a list of three elements.
`,
  },

  "AttributeSet": {
    docHref:
      "https://nixos.org/manual/nix/stable/language/values#attribute-set",
    title: "Attribute Set",
    description: `
An attribute set is a collection of name-value-pairs (called attributes) enclosed
in curly brackets (\`{ }\`).

An attribute name can be an identifier or a string.

Names and values are separated by an equal sign (\`=\`).
Each value is an arbitrary expression terminated by a semicolon (\`;\`).

Example:

\`\`\`nix
{
  x = 123;
  text = "Hello";
  y = f { bla = 456; };
  "two words" = false;
}
\`\`\`

This defines a set with attributes named x, text, y.
`,
  },

  "RecursiveSet": {
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
  },

  "Inherit": {
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
  },

  "IfElse": {
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
  },

  "Let": {
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
  },

  "With": {
    docHref:
      "https://nixos.org/manual/nix/stable/language/constructs.html#with-expressions",
    title: "With-expressions",
    description: `
A with-expression,

\`\`\`nix
with e1; e2
\`\`\`

introduces the set \`e1\` into the lexical scope of the expression \`e2\`. For instance,

\`\`\`nix
let as = { x = "foo"; y = "bar"; };
in with as; x + y
\`\`\`

evaluates to \`"foobar"\` since the with adds the \`x\` and \`y\` attributes of \`as\`
to the lexical scope in the expression \`x + y\`.
`,
  },

  "Fn": {
    docHref:
      "https://nixos.org/manual/nix/stable/language/constructs.html#functions",
    title: "Functions",
    description: `
Functions have the following form:

\`\`\`
pattern: body
\`\`\`

The pattern specifies what the argument of the function must look like, and binds variables
in the body to (parts of) the argument. There are three kinds of patterns:

* A single identifier
    \`\`\`nix
    let square = x: x * x;
    in square 2
    \`\`\`

* *A set pattern*
    \`\`\`nix
    { x, y ? "foo" }: x + y
    \`\`\`

    specifies a function that only requires an attribute named \`x\`, but optionally accepts \`y\`.

* An \`@\`-pattern provides a means of referring to the whole value being matched
    \`\`\`nix
    args@{ x, ... }: x + args.a
    # Or
    { x, ... } @ args: x + args.a
    \`\`\`
`,
  },

  "BinOpAdd": {
    docHref:
      "https://nixos.org/manual/nix/stable/language/operators#arithmetic",
    title: "Operators",
    description: `
| Operator name                 | Syntax              |
| ----------------------------- | ------------------- |
| Addition                      | \`number + number\` |
| String concatenation          | \`string + string\` |
| Path concatenation            | \`path + path\`     |
| Path and string concatenation | \`path + string\`   |
| String and path concatenation | \`string + path\`   |
`,
  },

  "BinOpCompare": {
    docHref:
      "https://nixos.org/manual/nix/stable/language/operators#comparison",
    title: "Comparison operators",
    description: `
Comparison is

- arithmetic for numbers
- lexicographic for strings and paths
- item-wise lexicographic for lists: elements at the same index in both lists are compared according to their type and skipped if they are equal.

| Operator name            | Syntax           |
| ------------------------ | ---------------- |
| Less than                | \`expr < expr\`  |
| Less than or equal to    | \`expr <= expr\` |
| Greater than             | \`expr > expr\`  |
| Greater than or equal to | \`expr >= expr\` |
`,
  },

  "BinOpConcat": {
    docHref: "https://nixos.org/manual/nix/stable/language/operators",
    title: "List concatenation",
    description: `
\`\`\`nix
[ 1 2 ] ++ [ 2 3 ]
# Result: [ 1 2 3 4 ]
\`\`\`
`,
  },

  "BinOpUpdate": {
    docHref: "https://nixos.org/manual/nix/stable/language/operators#update",
    title: "Update operator",
    description: `
Example:

\`\`\`nix
let
  a = { x = 1; };
  b = { y = 2; };
in a // b
# Result: { x = 1; y = 2 }
\`\`\`

Update attribute set \`a\` with names and values from \`b\`.

The returned attribute set will have of all the attributes in \`a\` and \`b\`.
If an attribute name is present in both, the attribute value from the latter is taken.

\`\`\`nix
let
  a = { x = 1; };
  b = { x = 2; };
in a // b
# Result: { x = 2; }
\`\`\`
`,
  },

  "BinOpImplication": {
    docHref:
      "https://nixos.org/manual/nix/stable/language/operators#logical-implication",
    title: "Logical implication",
    description: `
Equivalent to \`!x || y\`.
`,
  },

  "BinOpHas": {
    docHref:
      "https://nixos.org/manual/nix/stable/language/operators#has-attribute",
    title: "Has attribute",
    description: `
\`\`\`nix
attrset ? attrpath
\`\`\`

Test whether attribute set *attrset* contains the attribute denoted by *attrpath*. The result is a Boolean value.
`,
  },

  "FnCall": {
    docHref: "https://nixos.org/manual/nix/stable/language/operators",
    title: "Function application",
    description: `
If you want to use a function and apply it to a value like \`f(3)\`,
you leave out the parentheses and add a space. So, \`f(3)\` in math, is \`f 3\` in Nix.

If you want multiple arguments, you can add arguments like this:
\`arg1: arg2: nixExpression\`, e.g. \`f = x: y: x*y\`.
Applying that function to multiple values is easy: \`f(3,4)\` in math,
is \`f 3 4\` in Nix. If you apply one argument \`f 3\` only,
a partial function \`y: 3*y\` is returned.
`,
  },

  "Group": {
    title: "Group",
    description: `
Parentheses group expression into a single unit.

Example:

\`\`\`nix
[ "foo" (f 1 2) ]
\`\`\`

defines a list of two elements, the last being the result of a call to the function \`f\`.
Note that function calls have to be enclosed in parentheses. If they had been omitted, e.g.,

\`\`\`nix
[ "foo" f 1 2 ]
\`\`\`

the result would be a list of four elements, the second one being a function,
fourth and fifth being a number.
`,
  },

  "AttrSel": {
    docHref:
      "https://nixos.org/manual/nix/stable/language/operators#attribute-selection",
    title: "Attribute selection",
    description: `
    attrset . attrpath [ or expr ]

Select the attribute denoted by attribute path attrpath from attribute set attrset. If the attribute doesn’t exist, return the expr after or if provided, otherwise abort evaluation.

An attribute path is a dot-separated list of attribute names.

    Syntax

    attrpath = name [ . name ]...
`,
  },
};
