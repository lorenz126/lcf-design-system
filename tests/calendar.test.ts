import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Calendar from '../ui/organisms/Calendar.vue'

/* Focus is the whole point here, so these mount into the document. */
const open = (props: Record<string, unknown> = {}) =>
  mount(Calendar, { props: { locale: 'en-GB', ...props }, attachTo: document.body })

afterEach(() => { document.body.innerHTML = '' })

const grid = (w: ReturnType<typeof open>) => w.find('[role="grid"]')
const month = (w: ReturnType<typeof open>) => w.find('.u-cal-month').text()
const here = () => (document.activeElement as HTMLElement)?.textContent?.trim()

async function press(w: ReturnType<typeof open>, key: string) {
  await grid(w).trigger('keydown', { key })
  await new Promise(r => setTimeout(r, 0))
}

describe('Calendar', () => {
  it('offers exactly one tab stop, before and after moving', async () => {
    // Thirty-one tab stops per month is not navigation, it is an
    // obstacle course. This is the assertion that keeps it that way.
    const w = open({ modelValue: '2026-01-15' })
    expect(w.findAll('[tabindex="0"]')).toHaveLength(1)
    await press(w, 'ArrowRight')
    await press(w, 'ArrowDown')
    expect(w.findAll('[tabindex="0"]')).toHaveLength(1)
  })

  it('moves by a day and by a week', async () => {
    const w = open({ modelValue: '2026-01-15' })
    ;(w.find('[tabindex="0"]').element as HTMLElement).focus()
    await press(w, 'ArrowRight')
    expect(here()).toBe('16')
    await press(w, 'ArrowDown')
    expect(here()).toBe('23')
    await press(w, 'ArrowUp')
    await press(w, 'ArrowLeft')
    expect(here()).toBe('15')
  })

  it('goes to the edges of the week, not of the month', async () => {
    // 15 January 2026 is a Thursday; the week starts on Monday.
    const w = open({ modelValue: '2026-01-15' })
    ;(w.find('[tabindex="0"]').element as HTMLElement).focus()
    await press(w, 'Home')
    expect(here()).toBe('12')
    await press(w, 'End')
    expect(here()).toBe('18')
  })

  it('clamps the day when a month is shorter', async () => {
    // The reason addMonths exists: 31 January plus one month is the end
    // of February, not the third of March.
    const w = open({ modelValue: '2026-01-31' })
    ;(w.find('[tabindex="0"]').element as HTMLElement).focus()
    await press(w, 'PageDown')
    expect(month(w)).toBe('February 2026')
    expect(here()).toBe('28')
    await press(w, 'PageUp')
    expect(month(w)).toBe('January 2026')
    expect(here()).toBe('28')
  })

  it('follows an arrow across a month boundary', async () => {
    const w = open({ modelValue: '2026-01-31' })
    ;(w.find('[tabindex="0"]').element as HTMLElement).focus()
    await press(w, 'ArrowRight')
    expect(month(w)).toBe('February 2026')
  })

  it('moves without choosing', async () => {
    // Arriving somewhere is not the same as wanting it.
    const w = open({ modelValue: '2026-01-15' })
    ;(w.find('[tabindex="0"]').element as HTMLElement).focus()
    await press(w, 'ArrowRight')
    await press(w, 'ArrowRight')
    expect(w.props('modelValue')).toBe('2026-01-15')
    expect(w.emitted('select')).toBeUndefined()
  })

  it('chooses on Enter and on Space', async () => {
    for (const key of ['Enter', ' ']) {
      const w = open({ modelValue: '2026-01-15' })
      ;(w.find('[tabindex="0"]').element as HTMLElement).focus()
      await press(w, 'ArrowRight')
      await press(w, key)
      expect(w.emitted('select')).toEqual([['2026-01-16']])
      expect(w.emitted('update:modelValue')).toEqual([['2026-01-16']])
      w.unmount()
    }
  })

  it('refuses a day outside the range but still travels over it', async () => {
    const w = open({ modelValue: '2026-01-15', min: '2026-01-10', max: '2026-01-16' })
    ;(w.find('[tabindex="0"]').element as HTMLElement).focus()
    await press(w, 'ArrowRight')
    await press(w, 'ArrowRight')
    // 17 January is past `max`: the cursor is on it, and it is inert.
    expect(here()).toBe('17')
    await press(w, 'Enter')
    expect(w.emitted('select')).toBeUndefined()
    // …and the arrows keep going, because removing the day would tear a
    // hole in the week.
    await press(w, 'ArrowRight')
    expect(here()).toBe('18')
  })

  it('marks today, and marks it once', () => {
    const w = open()
    expect(w.findAll('[aria-current="date"]')).toHaveLength(1)
  })

  it('renders six whole weeks, always', () => {
    // A grid that changes height as you page through it makes everything
    // under it jump.
    for (const m of ['2026-01-01', '2026-02-01', '2026-08-01']) {
      const w = open({ modelValue: m })
      expect(w.findAll('.u-cal-day')).toHaveLength(42)
      w.unmount()
    }
  })

  it('announces the events of a day rather than the dots', () => {
    const w = open({
      modelValue: '2026-01-15',
      events: [
        { date: '2026-01-20', label: 'Design review' },
        { date: '2026-01-20', label: 'Retro' }
      ]
    })
    expect(w.find('.u-cal-sr').text()).toContain('2 events')
    expect(w.find('.u-cal-sr').text()).toContain('Design review, Retro')
  })
})
