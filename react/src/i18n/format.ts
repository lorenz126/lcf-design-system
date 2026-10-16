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

/* Spaces of every width a locale might group with, and both
   apostrophes. Read as grouping on input whatever the locale says, since
   a person pasting a number from a PDF does not know which one it was. */
const GROUP_LIKE = /[\s   '’]/g

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
   * Three cases, decided by which of `.` and `,` appear.
   *
   * 1. The locale's decimal separator is there: it is the decimal, and
   *    the other character, wherever it is, was grouping.
   * 2. Only the OTHER one is there. Grouping if every run after it is
   *    exactly three digits — "12.500" in de-AT is twelve thousand five
   *    hundred — and otherwise, if it occurs once, a decimal: "12.5"
   *    typed on an English keyboard into a German form means twelve and
   *    a half, and refusing it helps nobody.
   * 3. Neither: an integer.
   *
   * Spaces of every width and both apostrophes are dropped first, as
   * grouping, whatever the locale says — a number pasted from a PDF
   * carries whichever one its author's software chose.
   *
   * Before any of it, NFKC: a Japanese or Chinese IME types full-width
   * digits and stops, "１２．５", and those are digits a person meant.
   * Measured: null before this line, 12.5 after it.
   */
  const parseNumber: Format['parseNumber'] = text => {
    let s = text.normalize('NFKC').trim().replace(/^\+/, '').replace(/[\u2212\u2013]/g, '-').replace(GROUP_LIKE, '')
    if (!s) return null
    const dec = separators.decimal === ',' ? ',' : '.'
    const other = dec === ',' ? '.' : ','
    if (s.includes(dec)) {
      s = s.split(other).join('')
    } else if (s.includes(other)) {
      const runs = s.split(other)
      const grouped = runs.slice(1).every(r => /^\d{3}$/.test(r))
      if (grouped) s = runs.join('')
      else if (runs.length === 2) s = runs.join(dec)
      else return null
    }
    if (dec === ',') s = s.replace(',', '.')
    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null
    const n = Number(s)
    return Number.isFinite(n) ? n : null
  }

  return { locale, separators, number, money, percent, unit, date, parseNumber, unitSymbol }
}

