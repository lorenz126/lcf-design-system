import { describe, expect, it } from 'vitest'
import { createFormat } from './format'
import { resolveMessages, interpolate } from './messages'

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
    [ch, '1,500', 1500],
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
