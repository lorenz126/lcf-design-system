import { describe, expect, it } from 'vitest'
import { dateHint, fieldOrder, formatDate, parseDate } from '../composables/useDateText'

const TODAY = new Date(2025, 5, 15) // 15 June 2025
const gb = (s: string) => parseDate(s, 'en-GB', TODAY)
const us = (s: string) => parseDate(s, 'en-US', TODAY)

describe('fieldOrder', () => {
  it('asks Intl instead of keeping a table', () => {
    expect(fieldOrder('en-GB')).toEqual(['day', 'month', 'year'])
    expect(fieldOrder('en-US')).toEqual(['month', 'day', 'year'])
    expect(fieldOrder('ja-JP')).toEqual(['year', 'month', 'day'])
  })

  it('falls back to day-first rather than throwing on nonsense', () => {
    expect(fieldOrder('!!')).toEqual(['day', 'month', 'year'])
  })
})

describe('dateHint', () => {
  it('takes the placeholder from the same formatter, separators and all', () => {
    expect(dateHint('en-GB')).toBe('dd/mm/yyyy')
    expect(dateHint('en-US')).toBe('mm/dd/yyyy')
  })
})

describe('parseDate — the ambiguous one', () => {
  it('reads 03/04/2025 as each locale writes it', () => {
    // The entire problem, in one line.
    expect(gb('03/04/2025')).toBe('2025-04-03')
    expect(us('03/04/2025')).toBe('2025-03-04')
  })

  it('lets ISO win in every locale', () => {
    // The one written form that is not ambiguous.
    expect(gb('2025-04-03')).toBe('2025-04-03')
    expect(us('2025-04-03')).toBe('2025-04-03')
    expect(parseDate('2025-04-03', 'ja-JP', TODAY)).toBe('2025-04-03')
  })

  it('believes four digits are a year wherever they sit', () => {
    // Someone typing this into a US field is not saying month 2025.
    expect(us('2025/04/03')).toBe('2025-04-03')
    expect(gb('03.04.2025')).toBe('2025-04-03')
  })

  it('keeps day and month in the locale order when the year is last', () => {
    expect(gb('3 4 2025')).toBe('2025-04-03')
    expect(us('3 4 2025')).toBe('2025-03-04')
  })
})

describe('parseDate — named months', () => {
  it('takes a name over any question of order', () => {
    expect(gb('3 Apr 2025')).toBe('2025-04-03')
    expect(us('Apr 3 2025')).toBe('2025-04-03')
    expect(gb('3 April 2025')).toBe('2025-04-03')
  })

  it('refuses an ambiguous name instead of guessing', () => {
    // "ma" is March and May. Picking one is worse than saying no — and
    // it must be refused BEFORE the length test, or it falls through to
    // the numbers and "3 ma" quietly becomes the third of this month.
    // Found in the browser; the first version of this test passed for
    // the wrong reason, because "3 ma 2025" is also a day and a year.
    expect(gb('3 ma')).toBeNull()
    expect(gb('3 ma 2025')).toBeNull()
    expect(gb('3 mar 2025')).toBe('2025-03-03')
  })

  it('believes a two-letter word only when it is not a month at all', () => {
    // Portuguese writes "3 de abril de 2025", and "de" prefixes
    // dezembro — one hit, two letters, and it is a preposition.
    expect(parseDate('3 de abril de 2025', 'pt-BR', TODAY)).toBe('2025-04-03')
  })

  it('speaks the locale it was given', () => {
    expect(parseDate('3. März 2025', 'de-DE', TODAY)).toBe('2025-03-03')
    expect(parseDate('3. Marz 2025', 'de-DE', TODAY)).toBe('2025-03-03')
  })

  it('fills in this year when the name carried no year', () => {
    expect(gb('3 Apr')).toBe('2025-04-03')
  })

  it('is not fooled by a word that is not a month', () => {
    expect(gb('next tuesday')).toBeNull()
    expect(gb('3 Aprl 2025')).toBeNull()
  })

  it('treats one or two letters as a separator, not a failed month', () => {
    // Japanese writes 2025年4月3日 and Spanish "3 de abril de 2025".
    // Both put letters between the numbers, and rejecting those would
    // reject a date the formatter itself produced.
    expect(parseDate('2025年4月3日', 'ja-JP', TODAY)).toBe('2025-04-03')
    expect(parseDate('3 de abril de 2025', 'es-ES', TODAY)).toBe('2025-04-03')
  })
})

describe('parseDate — the short forms', () => {
  it('takes a bare number as a day of this month', () => {
    expect(gb('3')).toBe('2025-06-03')
    expect(gb('03')).toBe('2025-06-03')
  })

  it('takes two numbers as a day and a month in this year', () => {
    expect(gb('3/4')).toBe('2025-04-03')
    expect(us('3/4')).toBe('2025-03-04')
  })

  it('refuses a month and a year, because that is a month', () => {
    // Filling in the first of it would be inventing data.
    expect(gb('04/2025')).toBeNull()
  })

  it('reads a run of digits by the same order', () => {
    expect(gb('03042025')).toBe('2025-04-03')
    expect(us('04032025')).toBe('2025-04-03')
    expect(gb('030425')).toBe('2025-04-03')
    expect(parseDate('20250403', 'ja-JP', TODAY)).toBe('2025-04-03')
  })

  it('will not make a date out of a lone year', () => {
    expect(gb('2025')).toBeNull()
  })
})

describe('parseDate — two-digit years', () => {
  it('uses the POSIX window, and says so in the file', () => {
    expect(gb('3/4/25')).toBe('2025-04-03')
    expect(gb('3/4/68')).toBe('2068-04-03')
    expect(gb('3/4/69')).toBe('1969-04-03')
    expect(gb('3/4/99')).toBe('1999-04-03')
  })
})

describe('parseDate — what is not a date', () => {
  it('refuses 31 February instead of quietly returning 3 March', () => {
    // new Date(2025, 1, 31) is the third of March and says nothing.
    expect(gb('31/02/2025')).toBeNull()
    expect(gb('29/02/2024')).toBe('2024-02-29') // and a leap year is
    expect(gb('29/02/2025')).toBeNull()
  })

  it('refuses an impossible month or day', () => {
    expect(gb('03/13/2025')).toBeNull()
    expect(gb('00/04/2025')).toBeNull()
    expect(gb('32/04/2025')).toBeNull()
  })

  it('has nothing to say about nothing', () => {
    expect(gb('')).toBeNull()
    expect(gb('   ')).toBeNull()
    expect(gb('----')).toBeNull()
  })
})

describe('formatDate', () => {
  it('writes the date the way the locale does', () => {
    expect(formatDate('2025-04-03', 'en-GB')).toBe('03/04/2025')
    expect(formatDate('2025-04-03', 'en-US')).toBe('04/03/2025')
  })

  it('offers the readable one for a field that is mostly read', () => {
    expect(formatDate('2025-04-03', 'en-GB', 'medium')).toBe('3 Apr 2025')
  })

  it('says nothing when there is no date', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate('not a date')).toBe('')
  })

  it('round-trips whatever it produced', () => {
    for (const loc of ['en-GB', 'en-US', 'de-DE', 'ja-JP']) {
      for (const iso of ['2025-04-03', '2024-02-29', '1999-12-31']) {
        expect(parseDate(formatDate(iso, loc), loc, TODAY)).toBe(iso)
        expect(parseDate(formatDate(iso, loc, 'medium'), loc, TODAY)).toBe(iso)
      }
    }
  })
})
