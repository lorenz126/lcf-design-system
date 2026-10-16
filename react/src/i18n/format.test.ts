import { renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { LcfProvider, useMessages } from './context'
import { createFormat } from './format'
import { en, resolveMessageLangs, resolveMessages, interpolate, type MessageKey } from './messages'

describe('separators are pinned where runtimes disagree', () => {
  it('de-CH prints an ASCII apostrophe, whatever ICU says', () => {
    expect(createFormat('de-CH').number(10410, { minimumFractionDigits: 2 })).toBe("10'410.00")
  })
  it('de-AT groups with a dot for plain numbers and money alike', () => {
    const f = createFormat('de-AT')
    expect(f.number(10410, { minimumFractionDigits: 2 })).toBe('10.410,00')
    expect(f.money(10410, 'EUR')).toMatch(/10\.410,00/)
  })
  it('an app may override a pinned separator', () => {
    expect(createFormat('de-CH', { group: '’' }).number(10410)).toBe('10’410')
  })
  it('other locales get what Intl says', () => {
    expect(createFormat('en-GB').number(10410.5)).toBe('10,410.5')
  })
})

describe('units', () => {
  const f = createFormat('de-CH')
  it('square metres have no Intl unit and are printed with a no-break space', () => {
    expect(f.unit(12.5, 'm2')).toBe('12.5 m²')
  })
  it('percent goes through Intl, so spacing follows the locale', () => {
    expect(createFormat('de-DE').unit(12.5, 'percent')).toBe('12,5 %')
  })
  it('a currency unit is money', () => {
    expect(f.unit(10410, 'CHF')).toBe("CHF\u00a010'410.00")
  })
})

describe('dates', () => {
  it('ISO in, the locale out, never shifted by a time zone', () => {
    expect(createFormat('de-CH').date('2026-10-13')).toBe('13.10.2026')
    expect(createFormat('en-GB').date('2026-01-01')).toBe('1 Jan 2026')
  })
  it('a malformed date is returned as typed rather than guessed', () => {
    expect(createFormat('de-CH').date('13.10.2026')).toBe('13.10.2026')
  })
})

describe('parseNumber', () => {
  const ch = createFormat('de-CH')
  const at = createFormat('de-AT')
  const en = createFormat('en-GB')
  it.each([
    [ch, "10'410.50", 10410.5],
    [ch, '10’410.50', 10410.5],
    [ch, '10 410.50', 10410.5],
    [ch, '1,5', 1.5],
    // de-CH groups with an apostrophe, so a lone comma is the decimal
    // comma Swiss usage writes on quantities (was 1500; ROADMAP asks).
    [ch, '1,500', 1.5],
    [ch, '2,450', 2.45],
    [ch, '12,500', 12.5],
    [ch, '0,125', 0.125],
    [ch, '-0,125', -0.125],
    // Both separators: the rightmost is the decimal, the other groups.
    [ch, '1.234,5', 1234.5],
    [ch, '12.500,00', 12500],
    [ch, '1,234.5', 1234.5],
    [at, '1,234.5', 1234.5],
    [at, '12,500.00', 12500],
    [at, '0.125', 0.125],
    [en, '1.234,5', 1234.5],
    [en, '12.500,00', 12500],
    [en, '0,125', 0.125],
    [en, '1,234.5', 1234.5],
    [at, '10.410,50', 10410.5],
    [at, '12.500', 12500],
    [at, '12.5', 12.5],
    [at, '1.234.567', 1234567],
    [at, '-3,25', -3.25],
    [at, '−3,25', -3.25],
    [en, '1,000', 1000],
    [en, '0.5', 0.5],
    [en, '.5', 0.5],
    [en, '5.', 5]
  ] as const)('%#: %s → %s', (f, text, n) => {
    expect(f.parseNumber(text)).toBe(n)
  })
  it.each(['', 'abc', '1.5.3', '12a', '--3'])('refuses %j', text => {
    expect(at.parseNumber(text)).toBeNull()
  })
  it.each([
    // A reading that could be 1000 times off is refused, never guessed.
    [ch, '1.234,5,6'],
    [ch, '1,234,567'],
    [en, '1,23.5'],
    [ch, '0.123,5'],
    // Space and apostrophe groups are three digits, and only before the decimal.
    [ch, "10'41.50"],
    [ch, "1'2'3"],
    [ch, '12 5'],
    [ch, "0'125"],
    [ch, "1.234'5"],
    // Superscripts are not digits (NFKC read "5²" as 52).
    [ch, '5²'],
    [ch, '25³']
  ] as const)('%#: refuses %j', (f, text) => {
    expect(f.parseNumber(text)).toBeNull()
  })
  it('reads full-width digits from an IME (null before they were folded)', () => {
    expect(ch.parseNumber('１２．５')).toBe(12.5)
    expect(at.parseNumber('１２，５')).toBe(12.5)
    expect(ch.parseNumber('１\u3000２３４．５')).toBe(1234.5)
  })
})

describe('messages', () => {
  it('a region inherits its language and overrides only what differs', () => {
    expect(resolveMessages('de-CH').close).toBe('Schliessen')
    expect(resolveMessages('de-AT').close).toBe('Schließen')
    expect(resolveMessages('de-AT').loading).toBe('Wird geladen')
  })
  it('an unshipped language falls back to English, never to a blank', () => {
    expect(resolveMessages('fr-CH').loading).toBe('Loading')
  })
  it('app overrides win', () => {
    expect(resolveMessages('fr-CH', { loading: 'Chargement' }).loading).toBe('Chargement')
  })
  it('plurals ask the locale', () => {
    const m = resolveMessages('de-CH')
    expect(interpolate(m.fixTheFollowing, { count: 1 }, 'de-CH')).toBe('Bitte korrigieren:')
    expect(interpolate(m.fixTheFollowing, { count: 3 }, 'de-CH')).toBe('Bitte 3 Punkte korrigieren:')
  })
  it('placeholders fill, and an unknown one stays visible rather than vanishing', () => {
    expect(interpolate('At least {min}.', { min: 3 }, 'en')).toBe('At least 3.')
    expect(interpolate('At least {min}.', {}, 'en')).toBe('At least {min}.')
  })
})

describe('the language each message is written in', () => {
  const keys = Object.keys(en) as MessageKey[]
  const all = (langs: Record<MessageKey, string>) => [...new Set(keys.map(k => langs[k]))]

  it('is the provider locale where the table has the words, not a bare language', () => {
    expect(all(resolveMessageLangs('de-CH'))).toEqual(['de-CH'])
    expect(all(resolveMessageLangs('de-AT'))).toEqual(['de-AT'])
    expect(all(resolveMessageLangs('en-GB'))).toEqual(['en-GB'])
  })
  it('is English where an unshipped language fell back to it', () => {
    expect(all(resolveMessageLangs('fr-CH'))).toEqual(['en'])
  })
  it('is the locale for each entry the app supplied, and English for the rest', () => {
    const langs = resolveMessageLangs('fr-CH', { loading: 'Chargement' })
    expect(langs.loading).toBe('fr-CH')
    expect(langs.dismiss).toBe('en')
  })
  it('reaches components as t.lang, and t(key) is unchanged', () => {
    const wrap = (locale: string) => ({ children }: { children: ReactNode }) =>
      createElement(LcfProvider, { locale }, children)
    const ch = renderHook(() => useMessages(), { wrapper: wrap('de-CH') }).result.current
    expect(ch('belowMin', { min: 3 })).toBe('Mindestens 3.')
    expect(ch.lang('belowMin')).toBe('de-CH')
    const fr = renderHook(() => useMessages(), { wrapper: wrap('fr-CH') }).result.current
    expect(fr('loading')).toBe('Loading')
    expect(fr.lang('loading')).toBe('en')
    // No provider at all: the fallback config, en-GB.
    expect(renderHook(() => useMessages()).result.current.lang('loading')).toBe('en-GB')
  })
  it('Swiss francs need their country outside Switzerland', () => {
    expect(resolveMessages('de-CH').unitChf).toBe('Franken')
    expect(resolveMessages('de-DE').unitChf).toBe('Schweizer Franken')
    expect(resolveMessages('de-AT').unitChf).toBe('Schweizer Franken')
  })
})
