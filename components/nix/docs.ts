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

pattern: body

The pattern specifies what the argument of the function must look like, and binds variables
in the body to (parts of) the argument. There are three kinds of patterns:

* A single identifier
    \`\`\`nix
    let concat = x: y: x + y;
    in concat "foo" "bar"
    \`\`\`

* *A set pattern*
    \`\`\`nix
    { x, y ? "foo" }: x + y
    \`\`\`

    specifies a function that only requires an attribute named \`x\`, but optionally accepts y.

* An \`@\`-pattern provides a means of referring to the whole value being matched
    \`\`\`nix
    args@{ x, ... }: x + args.a
    # Or
    { x, ... } @ args: x + args.a
    \`\`\`
`,
  },
};
