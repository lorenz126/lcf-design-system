/* Made once: a Segmenter is not free to build, and the count runs on
   every keystroke. Grapheme rules do not depend on the locale. */
let segmenter: Intl.Segmenter | null | undefined

/**
 * The characters in `text` as a person counts them: "é" typed as e and
 * a combining accent is one, a flag is one, a line break is one.
 * `text.length` counts UTF-16 units instead — a flag is four, and a
 * count beside the box would disagree with the person reading it.
 *
 * Exported for the app that enforces a limit Textarea only reports:
 * counting with this, the app's verdict and the count on the screen
 * cannot disagree.
 */
export function countCharacters(text: string): number {
  if (segmenter === undefined) {
    segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null
  }
  if (!segmenter) return Array.from(text).length
  let n = 0
  for (const _ of segmenter.segment(text)) n++
  return n
}
