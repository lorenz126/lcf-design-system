/**
 * Ids for aria-describedby and aria-labelledby, joined: each part may be
 * undefined, empty, or itself a list; the result has every id once, in
 * the order given, or is undefined when there is none — so an attribute
 * with nothing to say is not rendered at all.
 *
 * Ids are joined, never turned into selectors: a React 19 useId id is
 * not a valid CSS selector. Look them up with getElementById.
 */
export function joinIds(...parts: (string | undefined | null | false)[]): string | undefined {
  const ids = parts.flatMap(p => (p ? p.split(/\s+/) : [])).filter(Boolean)
  return ids.length ? [...new Set(ids)].join(' ') : undefined
}
