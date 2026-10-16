/**
 * One formatter for numbers, money, units and dates, per locale.
 *
 * WHY NOT toLocaleString(). It answers with whatever ICU the runtime
 * happens to carry, and ICU versions disagree. Measured on Node 22
 * (ICU 77): de-CH groups with U+2019 (’), where older data and other
 * runtimes give U+0027 ('), so a server render and a client hydrate can
 * print the same price two ways. de-AT is worse — the same ICU groups a
 * plain number with a no-break space (10 410,00) and a currency amount
 * with a dot (CHF 10.410,00).
 *
 * So the SEPARATORS are pinned where it matters, by market, and every
 * number goes through formatToParts with those substituted. The rest —
 * digit grouping positions, currency placement, percent spacing — is
 * Intl's, because Intl gets those right and identical everywhere.
 *
 * Every function here can be replaced through LcfProvider's `format`
 * prop. An app with its own rule for a market supplies it there, once,
 * and every component that prints a number follows.
 */

export interface Separators {
  group: string
  decimal: string
}

/**
 * Pinned where runtimes disagree, and only there. Every other locale
 * gets what Intl says. The two that were asked for: `10'410.00` in
 * Switzerland, `10.410,00` in Austria.
 */
export const MARKET_SEPARATORS: Record<string, Separators> = {
  'de-CH': { group: "'", decimal: '.' },
  'it-CH': { group: "'", decimal: '.' },
  'fr-CH': { group: "'", decimal: '.' },
  'de-AT': { group: '.', decimal: ',' }
}

/** Units the app domain needs. Intl has no square metre, so these are
 *  printed as number + no-break space + symbol, except where Intl has a
 *  real unit or a currency, which then speaks for itself. */
export type Unit = 'm2' | 'm3' | 'm' | 'mm' | 'cm' | 'km' | 'kg' | 'h' | 'percent' | 'CHF' | 'EUR'

const SYMBOL: Partial<Record<Unit, string>> = {
  m2: 'm²', m3: 'm³', m: 'm', mm: 'mm', cm: 'cm', km: 'km', kg: 'kg', h: 'h'
}
const CURRENCY: Partial<Record<Unit, string>> = { CHF: 'CHF', EUR: 'EUR' }

export interface Format {
  locale: string
  separators: Separators
  number(value: number, options?: Intl.NumberFormatOptions): string
  money(value: number, currency: string, options?: Intl.NumberFormatOptions): string
  percent(ratio: number, options?: Intl.NumberFormatOptions): string
  unit(value: number, unit: Unit, options?: Intl.NumberFormatOptions): string
  /** ISO `yyyy-mm-dd` in, the locale's date out. Never a Date in: a Date
   *  carries a time zone, and a date in a form has none. */
  date(iso: string, style?: 'short' | 'medium' | 'long'): string
  /** The locale's text back to a number; null when it is not one. */
  parseNumber(text: string): number | null
  /** The symbol a field shows beside its value. */
  unitSymbol(unit: Unit): string
}

/** What Intl itself uses for this locale, read once from a sample. */
export function intlSeparators(locale: string): Separators {
  const parts = new Intl.NumberFormat(locale).formatToParts(11111.1)
  return {
    group: parts.find(p => p.type === 'group')?.value ?? ',',
    decimal: parts.find(p => p.type === 'decimal')?.value ?? '.'
  }
}

/* Full-width forms (U+FF01–U+FF5E) to ASCII, and the ideographic space
   to a space: what a Japanese or Chinese IME types, "１２．５". Only
   these — NFKC, used before, also folds "²" to "2", and measured, "5²"
   was read as 52. */
const halfWidth = (text: string) =>
  text.replace(/[\uff01-\uff5e]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/\u3000/g, ' ')

/* The groups of an integer part: the first 1–3 digits and not a lone 0
   (nobody writes "0'125"), every later one exactly three. */
const wellGrouped = (runs: string[]) =>
  /^[1-9]\d{0,2}$/.test(runs[0]!) && runs.slice(1).every(r => /^\d{3}$/.test(r))

/* The digits of an integer part, or null. Spaces of every width (`\s`
   is every Unicode space) and both apostrophes group it whatever the
   locale says, since a person pasting a number from a PDF does not know
   which one it was; `group` adds `.` or `,` where that is grouping too. */
function integerDigits(int: string, group = ''): string | null {
  const runs = int.split(new RegExp(`[\\s'’${group}]`))
  if (runs.length === 1) return /^\d*$/.test(int) ? int : null
  return wellGrouped(runs) ? runs.join('') : null
}

export function createFormat(locale: string, overrides: Partial<Separators> = {}): Format {
  const separators: Separators = {
    ...intlSeparators(locale),
    ...MARKET_SEPARATORS[locale],
    ...overrides
  }

  const swap = (nf: Intl.NumberFormat, value: number) =>
    nf.formatToParts(value).map(p =>
      p.type === 'group' ? separators.group : p.type === 'decimal' ? separators.decimal : p.value
    ).join('')

  const number: Format['number'] = (value, options) => swap(new Intl.NumberFormat(locale, options), value)

  const money: Format['money'] = (value, currency, options) =>
    swap(new Intl.NumberFormat(locale, { style: 'currency', currency, ...options }), value)

  const percent: Format['percent'] = (ratio, options) =>
    swap(new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1, ...options }), ratio)

  const unitSymbol: Format['unitSymbol'] = unit => {
    if (unit === 'percent') return '%'
    return SYMBOL[unit] ?? CURRENCY[unit] ?? unit
  }

  const unit: Format['unit'] = (value, u, options) => {
    if (u === 'percent') return percent(value / 100, options)
    if (CURRENCY[u]) return money(value, CURRENCY[u]!, options)
    return `${number(value, options)} ${unitSymbol(u)}`
  }

  const date: Format['date'] = (iso, style = 'medium') => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
    if (!m) return iso
    // Noon UTC, formatted in UTC: no zone can push it across midnight.
    const d = new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, 12))
    return new Intl.DateTimeFormat(locale, { dateStyle: style, timeZone: 'UTC' }).format(d)
  }

  /**
   * What a person typed, back to a number — or null, which a field shows
   * as "Bitte eine Zahl eingeben." and keeps the text. A reading that
   * could be 1000 times off is refused, never guessed.
   *
   * 1. Both `.` and `,` appear: the rightmost is the decimal, once; the
   *    other is grouping, in groups of three, before it. "12.500,00" is
   *    12500 in de-CH as in de-AT — a German supplier's price pasted into
   *    a Swiss offer. Measured before: 12.5, silently.
   * 2. Only one of them appears, and it is the locale's decimal: the
   *    decimal, once.
   * 3. Only the OTHER one appears. Grouping when it is this locale's own
   *    group separator and the groups are well formed — "12.500" in de-AT
   *    is twelve thousand five hundred, "1,000" in en-GB is a thousand.
   *    Otherwise, if it occurs once, a decimal: "12.5" typed into a
   *    German form is twelve and a half, and in de-CH, whose group
   *    separator is the apostrophe, "2,450" is the decimal comma Swiss
   *    usage writes on quantities — two metres forty-five, not 2450.
   *    "0,125" is never grouping anywhere.
   * 4. Neither: an integer.
   *
   * Spaces of every width and both apostrophes are grouping whatever the
   * locale says — a number pasted from a PDF carries whichever one its
   * author's software chose — but only in well-formed groups before the
   * decimal: "12 5" is not 125.
   */
  const parseNumber: Format['parseNumber'] = text => {
    let s = halfWidth(text).trim().replace(/^\+/, '').replace(/[\u2212\u2013]/g, '-')
    const sign = s.startsWith('-') ? '-' : ''
    s = s.slice(sign.length).trim()
    const dec = separators.decimal === ',' ? ',' : '.'
    const other = dec === ',' ? '.' : ','

    let point = ''
    let group = ''
    if (s.includes('.') && s.includes(',')) {
      point = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ','
      group = point === '.' ? ',' : '.'
    } else if (s.includes(dec)) {
      point = dec
    } else if (s.includes(other)) {
      if (separators.group === other && integerDigits(s, other) !== null) group = other
      else point = other
    }

    const parts = point ? s.split(point) : [s]
    if (parts.length > 2) return null
    const int = integerDigits(parts[0]!, group)
    const frac = parts[1] ?? ''
    if (int === null || !/^\d*$/.test(frac) || int + frac === '') return null
    const n = Number(`${sign}${int || '0'}.${frac || '0'}`)
    return Number.isFinite(n) ? n : null
  }

  return { locale, separators, number, money, percent, unit, date, parseNumber, unitSymbol }
}

