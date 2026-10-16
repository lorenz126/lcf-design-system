import { describe, expect, it } from 'vitest'
import { createFormat } from '../../i18n/format'
import { decimals, displayText, inputModeFor, onGrid, preParse, rangeProblem, readText, stepFrom } from './number'

describe('preParse: the field\'s own unit and a zero-cents dash come off', () => {
  it.each([
    ["CHF 1'200.–", 'CHF', "1'200"],
    ["Fr. 1'200.50", 'CHF', "1'200.50"],
    ["SFr. 80", 'CHF', '80'],
    ['chf 12', 'CHF', '12'],
    ['€ 12,50', 'EUR', '12,50'],
    ['12 %', 'percent', '12'],
    ['12%', 'percent', '12'],
    ['118 m2', 'm2', '118'],
    ['118 m²', 'm2', '118'],
    ['  4 km ', 'km', '4'],
    ['12 kg', 'm2', '12 kg'],
    ['1.200,—', 'EUR', '1.200']
  ] as const)('%j in %s → %j', (text, unit, out) => {
    expect(preParse(text, unit)).toBe(out)
  })
})

describe('decimals and the grid, in scaled integers', () => {
  it('counts fraction digits, exponent forms included', () => {
    expect(decimals(12)).toBe(0)
    expect(decimals(0.05)).toBe(2)
    expect(decimals(1e-7)).toBe(7)
    expect(decimals(1.5e-7)).toBe(8)
  })
  it('0.3 is on a 0.1 grid, though 0.3 % 0.1 is not 0 in floating point', () => {
    expect(0.3 % 0.1).not.toBe(0)
    expect(onGrid(0.3, 0.1)).toBe(true)
    expect(onGrid(0.3, 0.5)).toBe(false)
    expect(onGrid(10.05, 0.05)).toBe(true)
    expect(onGrid(1.3, 0.5, 0.3)).toBe(true)
  })
})

describe('rangeProblem: below, above, then off the grid', () => {
  it('names the bound it broke', () => {
    expect(rangeProblem(null, { min: 1 })).toBeNull()
    expect(rangeProblem(0, { min: 1 })).toEqual({ key: 'belowMin', value: 1 })
    expect(rangeProblem(150, { max: 100 })).toEqual({ key: 'aboveMax', value: 100 })
    expect(rangeProblem(0.3, { step: 0.5 })).toEqual({ key: 'offStep', value: 0.5 })
    expect(rangeProblem(12.5, { min: 0, max: 100, step: 0.5 })).toBeNull()
  })
})

describe('stepFrom: one arrow press', () => {
  it('adds a step, or ten', () => {
    expect(stepFrom(12, 1, 1, {})).toBe(13)
    expect(stepFrom(12, -1, 10, {})).toBe(2)
  })
  it('snaps onto the grid first, in the direction pressed', () => {
    expect(stepFrom(12.3, 1, 1, { step: 0.5 })).toBe(12.5)
    expect(stepFrom(12.3, -1, 1, { step: 0.5 })).toBe(12)
    expect(stepFrom(12.3, 1, 10, { step: 0.5 })).toBe(17)
  })
  it('is exact: 0.1 then 0.2 then 0.3', () => {
    expect(stepFrom(0.1, 1, 1, { step: 0.1 })).toBe(0.2)
    expect(stepFrom(0.2, 1, 1, { step: 0.1 })).toBe(0.3)
  })
  it('clamps, and with a step to the highest grid value under max', () => {
    expect(stepFrom(99, 1, 10, { max: 100 })).toBe(100)
    expect(stepFrom(1, -1, 10, { min: 0 })).toBe(0)
    expect(stepFrom(9, 1, 1, { step: 2, max: 10 })).toBe(10)
    expect(stepFrom(9, 1, 1, { min: 1, step: 2, max: 10 })).toBe(9)
  })
  it('from empty, sets 0 (or the nearest bound) and adds nothing', () => {
    expect(stepFrom(null, 1, 1, {})).toBe(0)
    expect(stepFrom(null, -1, 1, {})).toBe(0)
    expect(stepFrom(null, 1, 1, { min: 5 })).toBe(5)
    expect(stepFrom(null, 1, 1, { max: -0.3, step: 0.5 })).toBe(-0.5)
  })
  it('never gives -0', () => {
    expect(Object.is(stepFrom(1, -1, 1, {}), 0)).toBe(true)
  })
})

describe('display and keyboard', () => {
  const ch = createFormat('de-CH')
  it('never rounds, and shows a double honestly', () => {
    expect(displayText(10.555, ch, 2)).toBe('10.555')
    expect(displayText(0.1 + 0.2, ch, 0)).toBe('0.3')
    expect(displayText(1234.5, ch, 0)).toBe("1'234.5")
    expect(displayText(12, ch, 2)).toBe('12.00')
  })
  it('offers the decimal pad only where no minus is ever needed', () => {
    expect(inputModeFor(0)).toBe('decimal')
    expect(inputModeFor(-20)).toBe('text')
    expect(inputModeFor(undefined)).toBe('text')
  })
  it('reads text to a number, null, or unreadable', () => {
    expect(readText('  ', 'm2', ch)).toEqual({ ok: true, value: null })
    expect(readText('12,', undefined, ch)).toEqual({ ok: true, value: 12 })
    expect(readText('abc', undefined, ch)).toEqual({ ok: false })
    expect(readText('-0', undefined, ch)).toEqual({ ok: true, value: 0 })
  })
})
