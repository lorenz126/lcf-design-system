/**
 * NumberField's arithmetic, pure: reading what was typed, the grid a
 * value sits on, one arrow press, and what to show. No React here, so
 * every rule is tested on its own (number.test.ts).
 */
import type { Format, Unit } from '../../i18n/format'
import type { MessageKey } from '../../i18n/messages'

/** The spoken word for each unit — part of the field's name. */
export const UNIT_WORD: Record<Unit, MessageKey> = {
  m2: 'unitM2',
  m3: 'unitM3',
  m: 'unitM',
  mm: 'unitMm',
  cm: 'unitCm',
  km: 'unitKm',
  kg: 'unitKg',
  h: 'unitH',
  percent: 'unitPercent',
  CHF: 'unitChf',
  EUR: 'unitEur'
}

/* What a person types beside the number and means as the unit the field
   already shows. Longest first, so "SFr." is not read as "Fr." and a
   stray "S". */
const ALIASES: Record<Unit, string[]> = {
  m2: ['m²', 'm2'],
  m3: ['m³', 'm3'],
  m: ['m'],
  mm: ['mm'],
  cm: ['cm'],
  km: ['km'],
  kg: ['kg'],
  h: ['h'],
  percent: ['%'],
  CHF: ['SFr.', 'CHF', 'Fr.'],
  EUR: ['EUR', '€']
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * The text, ready for parseNumber: trimmed; the field's own unit taken
 * off the start or the end ("CHF 1'200", "12 %", "118 m2"); and a
 * trailing zero-cents dash dropped ("1'200.–"). Done on the raw text,
 * before parseNumber's NFKC — NFKC turns "²" into "2", and "118 m²"
 * would become "118 m2" and then 1182.
 *
 * Another unit is not taken off: "12 kg" in a square-metre field is not
 * a number, and saying so is better than guessing.
 */
export function preParse(text: string, unit?: Unit): string {
  let s = text.trim()
  if (unit) {
    for (const alias of ALIASES[unit]) {
      const a = escape(alias)
      const start = new RegExp(`^${a}\\s*`, 'i')
      const end = new RegExp(`\\s*${a}$`, 'i')
      if (start.test(s)) { s = s.replace(start, ''); break }
      if (end.test(s)) { s = s.replace(end, ''); break }
    }
  }
  return s.trim().replace(/[.,]\s*[-–—]$/, '').trim()
}

/** Fraction digits of a double as written: 0.05 → 2, 1e-7 → 7, 1.5e-7 → 8. */
export function decimals(x: number): number {
  const s = String(x)
  const exp = /e-(\d+)$/.exec(s)
  const mantissa = exp ? s.slice(0, s.indexOf('e')) : s
  const frac = mantissa.split('.')[1]?.length ?? 0
  return exp ? Number(exp[1]) + frac : frac
}

/* Scaled-integer arithmetic stays exact up to 15 significant digits;
   past that (a third, typed to sixteen places) a tolerance decides. */
const MAX_SCALE = 15

/** Whether `n` sits on the grid `base + k × step`. Exact, in scaled integers: 0.3 is on a 0.1 grid. */
export function onGrid(n: number, step: number, base = 0): boolean {
  const d = Math.max(decimals(n), decimals(step), decimals(base))
  if (d > MAX_SCALE) {
    const k = (n - base) / step
    return Math.abs(k - Math.round(k)) < 1e-9
  }
  const S = 10 ** d
  const si = Math.round(step * S)
  if (si === 0) return true
  return (Math.round(n * S) - Math.round(base * S)) % si === 0
}

export interface Bounds {
  min?: number
  max?: number
  step?: number
}

export interface Problem {
  key: 'notANumber' | 'belowMin' | 'aboveMax' | 'offStep'
  /** The number each placeholder stands for; formatted by the field. */
  value?: number
}

/** What is wrong with a committed number, if anything: below, above, then off the grid. */
export function rangeProblem(n: number | null, { min, max, step }: Bounds): Problem | null {
  if (n === null) return null
  if (min !== undefined && n < min) return { key: 'belowMin', value: min }
  if (max !== undefined && n > max) return { key: 'aboveMax', value: max }
  if (step !== undefined && step > 0 && !onGrid(n, step, min ?? 0)) return { key: 'offStep', value: step }
  return null
}

/**
 * One arrow press (or ten, with Shift or Page keys) from `cur`.
 *
 * - Off the grid, the first move lands on the next grid point in the
 *   direction pressed (12.3 → 12.5 on a 0.5 grid), the rest add steps.
 * - From empty, the first press SETS a value and adds nothing: 0, or the
 *   nearest bound, snapped up onto the grid.
 * - The result is clamped to min and max, and with a step to the highest
 *   grid value at or below max. Arrows are gestures, not data, so they
 *   may clamp; what was typed never is.
 * - Scaled integers throughout: 0.1 + 0.2 by arrows is 0.3, not
 *   0.30000000000000004.
 */
export function stepFrom(cur: number | null, dir: 1 | -1, mult: number, { min, max, step }: Bounds): number {
  const s = step !== undefined && step > 0 ? step : 1
  const g = min ?? 0
  const d = Math.min(MAX_SCALE, Math.max(decimals(s), decimals(g), cur === null ? 0 : decimals(cur), max === undefined ? 0 : decimals(max)))
  const S = 10 ** d
  const gi = Math.round(g * S)
  const si = Math.round(s * S)
  const gridded = step !== undefined && step > 0
  const off = (x: number) => (((x - gi) % si) + si) % si

  let next: number
  if (cur === null) {
    let v = Math.round(Math.min(Math.max(0, min ?? -Infinity), max ?? Infinity) * S)
    if (gridded && off(v) !== 0) v += si - off(v)
    next = v
  } else {
    const ci = Math.round(cur * S)
    if (gridded && off(ci) !== 0) {
      next = (dir > 0 ? ci + si - off(ci) : ci - off(ci)) + dir * si * (mult - 1)
    } else {
      next = ci + dir * si * mult
    }
  }

  if (min !== undefined && next < Math.round(min * S)) next = Math.round(min * S)
  if (max !== undefined) {
    const mi = Math.round(max * S)
    if (next > mi) next = gridded ? mi - off(mi) : mi
  }
  // -0 is 0: a field that shows "0" must not post "-0".
  return next / S + 0
}

/**
 * The number as the field shows it: the reader's own separators, at
 * least `minFractionDigits`, and never rounded — `toPrecision(15)` is a
 * double's honest precision, so 0.1 + 0.2 shows as 0.3 rather than
 * 0.30000000000000004, and 10.555 CHF stays 10.555.
 */
export function displayText(n: number, format: Format, minFractionDigits: number): string {
  return format.number(Number(n.toPrecision(15)), { minimumFractionDigits: minFractionDigits, maximumFractionDigits: 20 })
}

/**
 * The phone keyboard. iOS's decimal pad has no minus key, so it is only
 * offered where a minus can never be needed: with `min` at 0 or above.
 */
export function inputModeFor(min: number | undefined): 'decimal' | 'text' {
  return min !== undefined && min >= 0 ? 'decimal' : 'text'
}

/** What committing `text` would give: a number or null (empty), or unreadable. */
export function readText(text: string, unit: Unit | undefined, format: Format): { ok: true; value: number | null } | { ok: false } {
  const pre = preParse(text, unit)
  if (pre === '') return { ok: true, value: null }
  const n = format.parseNumber(pre)
  if (n === null) return { ok: false }
  return { ok: true, value: n + 0 }
}
