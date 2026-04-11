export function classNames(
  names: string,
  optional: Record<string, boolean>,
): string {
  const res = names;
  const extra = Object.entries(optional)
    .filter(([_key, value]) => value)
    .map(([key, _v]) => key)
    .join(" ");
  return res + " " + extra;
}
