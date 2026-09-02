/**
 * Turning typed text into a date, and a date back into text.
 *
 * THIS IS THE WHOLE REASON DatePicker IS NOT `<input type="date">`. That
 * element is genuinely good — free parsing, free locale, free keyboard,
 * a real picker on a phone — and giving it up is a cost, not a win. It
 * is given up for two things it cannot do: its popup is unstyleable, so
 * it cannot show the events, the range and the month grid the Calendar
 * organism already draws; and its segmented display cannot be typed or
 * pasted into freely, so "3 Apr 2025" off a clipboard is refused.
 *
 * The price of that choice is this file. Owning the parsing is the debt,
 * and it is paid here rather than spread through a component.
 *
 * INTL KNOWS THE ORDER, SO NOBODY HAS TO GUESS IT. There is no parse API
 * in Intl, but `formatToParts` says which of day, month and year comes
 * first in a locale — en-GB day first, en-US month first, ja-JP year
 * first — so the field order is *asked for* rather than kept in a table
 * that goes stale. Everything ambiguous below is decided by that order.
 *
 * The rules, in the order they are applied, most certain first:
 *
 *   1. ISO WINS EVERYWHERE. `2025-04-03` means the third of April in
 *      every locale, because it is the one written form that is not
 *      ambiguous and someone who types it means it.
 *   2. A NAMED MONTH REMOVES THE AMBIGUITY, so it is checked before any
 *      number is assigned a meaning. An ambiguous name is not a date:
 *      "ma" is March and May, and guessing between them is worse than
 *      refusing.
 *   3. FOUR DIGITS ARE A YEAR, wherever they sit. Someone typing
 *      `2025-04-03` into a US-locale field is not saying month 2025.
 *   4. Everything else goes by the locale's own order.
 *
 * AND 31 FEBRUARY IS NOT A DATE. `new Date(2025, 1, 31)` is the third of
 * March and says nothing about it, so every result is built and then
 * read back; anything that moved is refused.
 */
export type DateField = 'day' | 'month' | 'year'

const ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})$/
/** A reference date whose day and month cannot be confused: 2 January. */
const SAMPLE = new Date(2024, 0, 2)

const pad = (n: number) => String(n).padStart(2, '0')

/** Lowercased and stripped of accents, so "März" answers to "marz".
 *  \p{Diacritic} rather than a literal range: invisible combining
 *  characters in a source file are a hazard nobody needs. */
const flat = (s: string, locale: string) =>
  s.toLocaleLowerCase(locale).normalize('NFD').replace(/\p{Diacritic}/gu, '')

/**
 * Which of day, month and year comes first in this locale — asked of
 * Intl rather than kept in a table. Falls back to day-first, which is
 * what most of the world writes, if a runtime has no answer.
 */
export function fieldOrder(locale = 'en-GB'): DateField[] {
  try {
    const order = new Intl.DateTimeFormat(locale, {
      year: 'numeric', month: '2-digit', day: '2-digit'
    })
      .formatToParts(SAMPLE)
      .map(p => p.type)
      .filter((t): t is DateField => t === 'day' || t === 'month' || t === 'year')
    return order.length === 3 ? order : ['day', 'month', 'year']
  } catch {
    return ['day', 'month', 'year']
  }
}

/**
 * The placeholder, in this locale's own shape — "dd/mm/yyyy",
 * "mm/dd/yyyy", "yyyy/mm/dd" — separators and all, taken from the same
 * formatter rather than written out per locale.
 */
export function dateHint(locale = 'en-GB'): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric', month: '2-digit', day: '2-digit'
    })
      .formatToParts(SAMPLE)
      .map(p =>
        p.type === 'day' ? 'dd' : p.type === 'month' ? 'mm' : p.type === 'year' ? 'yyyy' : p.value
      )
      .join('')
  } catch {
    return 'dd/mm/yyyy'
  }
}

export function formatDate(
  iso: string | null | undefined,
  locale = 'en-GB',
  style: 'numeric' | 'medium' = 'numeric'
): string {
  const m = iso ? ISO.exec(iso) : null
  if (!m) return ''
  const d = new Date(+m[1]!, +m[2]! - 1, +m[3]!)
  if (+m[1]! < 100) d.setFullYear(+m[1]!)
  return new Intl.DateTimeFormat(
    locale,
    style === 'medium'
      ? { day: 'numeric', month: 'short', year: 'numeric' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' }
  ).format(d)
}

/**
 * Two digits are a century short, and there is no right answer — only a
 * convention. This is the POSIX one: 00–68 is this century, 69–99 the
 * last. IT IS WRONG FOR A BIRTH DATE, which is the field that should ask
 * for four digits rather than the rule that should bend.
 */
const century = (y: number) => (y >= 100 ? y : y <= 68 ? 2000 + y : 1900 + y)

/** Built, then read back — see the note about 31 February. */
function build(y: number, m: number, d: number): string | null {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  const dt = new Date(y, m - 1, d)
  if (y >= 0 && y < 100) dt.setFullYear(y)
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null
  return `${String(y).padStart(4, '0')}-${pad(m)}-${pad(d)}`
}

/** Long and short names for each month, flattened, in month order. */
function monthNames(locale: string): string[][] {
  const long = new Intl.DateTimeFormat(locale, { month: 'long' })
  const short = new Intl.DateTimeFormat(locale, { month: 'short' })
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2024, i, 1)
    return [flat(long.format(d), locale), flat(short.format(d), locale)]
  })
}

/**
 * A month typed as a word. Returns its 1-based number, 0 for a word that
 * is not one, and -1 for an ambiguous one.
 *
 * THE LENGTH RULE AND THE AMBIGUITY RULE ARE NOT THE SAME RULE, and
 * collapsing them was a real bug: with a length test first, "3 ma" fell
 * through to the numbers and became the third of this month, when "ma"
 * is March and May and the whole point was to refuse it.
 *
 * So ambiguity is decided FIRST and at any length, and length only
 * decides whether a single hit is believed. Two letters that happen to
 * prefix exactly one month are usually a word: Portuguese writes "3 de
 * abril de 2025", and "de" prefixes dezembro.
 */
function monthByName(word: string, locale: string): number {
  const w = flat(word, locale).replace(/\.$/, '')
  if (!w) return 0
  const hits = new Set<number>()
  monthNames(locale).forEach((names, i) => {
    if (names.some(n => n.startsWith(w))) hits.add(i + 1)
  })
  if (hits.size > 1) return -1
  if (hits.size === 1 && w.length >= 3) return [...hits][0]!
  return 0
}

/**
 * Text to ISO `yyyy-mm-dd`, or null when it is not a date.
 *
 * `now` is a parameter rather than a call to `new Date()` inside, so the
 * behaviour that depends on today — a bare day, a missing year — is
 * testable without moving the clock.
 */
export function parseDate(text: string, locale = 'en-GB', now = new Date()): string | null {
  const s = text.trim()
  if (!s) return null

  // 1. ISO wins everywhere.
  const iso = ISO.exec(s)
  if (iso) return build(+iso[1]!, +iso[2]!, +iso[3]!)

  const nums = s.match(/\d+/g) ?? []
  /* \p{L}, not [^\W\d_]: \w is ASCII-only, so \W CONTAINS "ä" — and
     "März" came back as "M" and "rz", which is no month at all. */
  const words = s.match(/\p{L}+/gu) ?? []

  // 2. A named month, before any number is given a meaning.
  let stray = false
  for (const w of words) {
    const m = monthByName(w, locale)
    if (m === -1) return null // ambiguous: refuse rather than guess
    if (m === 0) {
      /* ONE OR TWO LETTERS IS A SEPARATOR, NOT A FAILED MONTH. Japanese
         writes 2025年4月3日 and Portuguese "3 de abril de 2025" — both
         put letters between the numbers, and treating those as a month
         that did not match rejects a date the formatter itself produced.
         Anything longer that is not a month is a real refusal: "next
         tuesday" is not a date. An ambiguous short word never reaches
         here — monthByName has already refused it. */
      if (flat(w, locale).length >= 3) stray = true
      continue
    }

    const four = nums.find(n => n.length === 4)
    const rest = four ? nums.filter(n => n !== four) : nums
    const day = rest[0]
    if (!day) return null
    const year = four ? +four : rest[1] ? century(+rest[1]) : now.getFullYear()
    return build(year, m, +day)
  }
  if (stray) return null

  const order = fieldOrder(locale)
  const at = (f: DateField) => order.indexOf(f)

  if (nums.length === 1) {
    const g = nums[0]!
    // 3. Four digits are a year — on their own, they are not a date.
    if (g.length <= 2) return build(now.getFullYear(), now.getMonth() + 1, +g)
    if (g.length === 6 || g.length === 8) {
      const big = g.length === 8
      const wide = order.map(f => (f === 'year' ? (big ? 4 : 2) : 2))
      let cut = 0
      const parts: Record<string, number> = {}
      order.forEach((f, i) => {
        parts[f] = +g.slice(cut, cut + wide[i]!)
        cut += wide[i]!
      })
      return build(century(parts.year!), parts.month!, parts.day!)
    }
    return null
  }

  if (nums.length === 2) {
    // Two numbers are a day and a month; the year is this one. A month
    // and a year is a MONTH, not a date, and inventing the first of it
    // would be inventing data.
    if (nums.some(n => n.length === 4)) return null
    const first = at('day') < at('month')
    const day = first ? +nums[0]! : +nums[1]!
    const month = first ? +nums[1]! : +nums[0]!
    return build(now.getFullYear(), month, day)
  }

  if (nums.length === 3) {
    const four = nums.findIndex(n => n.length === 4)
    if (four >= 0 && order[four] !== 'year') {
      // 3. A four-digit year where the locale does not expect one.
      // Believe the digits: leading means big-endian (year, month,
      // day), trailing means the other two keep their own order.
      const rest = nums.filter((_, i) => i !== four)
      const [a, b] = four === 0
        ? [+rest[0]!, +rest[1]!]
        : at('day') < at('month') ? [+rest[1]!, +rest[0]!] : [+rest[0]!, +rest[1]!]
      return build(+nums[four]!, a, b)
    }
    const g: Record<string, number> = {}
    order.forEach((f, i) => { g[f] = +nums[i]! })
    return build(century(g.year!), g.month!, g.day!)
  }

  return null
}
