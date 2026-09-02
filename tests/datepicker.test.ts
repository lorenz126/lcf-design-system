import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import DatePicker from '../ui/organisms/DatePicker.vue'

const open = (props: Record<string, unknown> = {}) =>
  mount(DatePicker, {
    props: { label: 'Due', locale: 'en-GB', ...props },
    attachTo: document.body
  })

const box = (w: ReturnType<typeof open>) => w.find('input')
const type = async (w: ReturnType<typeof open>, v: string) => {
  await box(w).setValue(v)
  await box(w).trigger('blur')
}

describe('DatePicker', () => {
  it('writes the value as ISO whatever the locale reads', () => {
    // What a consumer stores must not depend on where its user lives.
    const gb = open({ modelValue: '2025-04-03' })
    expect((box(gb).element as HTMLInputElement).value).toBe('03/04/2025')
    const us = open({ modelValue: '2025-04-03', locale: 'en-US' })
    expect((box(us).element as HTMLInputElement).value).toBe('04/03/2025')
  })

  it('reads the same keystrokes differently, and says so in ISO', async () => {
    const gb = open()
    await type(gb, '03/04/2025')
    expect(gb.emitted('update:modelValue')!.at(-1)).toEqual(['2025-04-03'])

    const us = open({ locale: 'en-US' })
    await type(us, '03/04/2025')
    expect(us.emitted('update:modelValue')!.at(-1)).toEqual(['2025-03-04'])
  })

  it('reformats on blur, which is how the order gets taught', async () => {
    // Type "3/4" and leave: the box says 03/04/<this year>. Nobody has
    // to be told the order, and the reformat is also the confirmation
    // of what was understood.
    const w = open()
    await type(w, '3/4')
    expect((box(w).element as HTMLInputElement).value)
      .toBe(`03/04/${new Date().getFullYear()}`)
  })

  it('takes a placeholder from the locale rather than a hardcoded one', () => {
    expect(box(open()).attributes('placeholder')).toBe('dd/mm/yyyy')
    expect(box(open({ locale: 'en-US' })).attributes('placeholder')).toBe('mm/dd/yyyy')
  })

  it('does not clear the value when the text stops making sense', async () => {
    // Emptying a field because someone mistyped destroys data to punish
    // a typo. The error is what says the two disagree.
    const w = open({ modelValue: '2025-04-03' })
    await type(w, 'not a date')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.text()).toContain('Not a date we can read.')
    expect(box(w).attributes('aria-invalid')).toBe('true')
  })

  it('clears on an empty box, because that is what emptying one means', async () => {
    const w = open({ modelValue: '2025-04-03' })
    await type(w, '')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([null])
  })

  it('refuses a date outside the range it was given', async () => {
    const w = open({ min: '2025-01-01', max: '2025-12-31' })
    await type(w, '03/04/2024')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.text()).toContain('outside the allowed range')
  })

  it('keeps the caller‘s own error rather than replacing it', async () => {
    const w = open({ error: 'Required.' })
    expect(w.text()).toContain('Required.')
  })

  it('does not rewrite the box under someone mid-correction', async () => {
    // The value is still the old one while the text is wrong; putting
    // the old text back would take away what they were fixing.
    const w = open({ modelValue: '2025-04-03' })
    await type(w, '99/99/9999')
    expect((box(w).element as HTMLInputElement).value).toBe('99/99/9999')
  })

  it('commits on Enter without waiting for the field to be left', async () => {
    const w = open()
    await box(w).setValue('2025-04-03')
    await box(w).trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['2025-04-03'])
  })

  it('opens the grid on ArrowDown, which is the gesture people try', async () => {
    // Through the browser, not by setting a ref. Setting the ref left
    // aria-expanded saying true over a popover that never opened —
    // found in the browser, where the two routes in disagreed.
    const w = open()
    const pop = w.find('[popover]').element as HTMLElement & { showPopover?: () => void }
    pop.showPopover = vi.fn()
    await box(w).trigger('keydown', { key: 'ArrowDown' })
    expect(pop.showPopover).toHaveBeenCalled()
  })

  it('names the button, because a glyph is not a name', () => {
    expect(open().find('.u-dp-open').attributes('aria-label'))
      .toBe('Choose date from a calendar')
  })

  it('will not open the grid on a field nobody may edit', async () => {
    const ro = open({ readonly: true })
    const pop = ro.find('[popover]').element as HTMLElement & { showPopover?: () => void }
    pop.showPopover = vi.fn()
    await box(ro).trigger('keydown', { key: 'ArrowDown' })
    expect(pop.showPopover).not.toHaveBeenCalled()
    expect(ro.find('.u-dp-open').attributes('disabled')).toBeDefined()
  })

  it('gives every instance its own anchor name', async () => {
    // A name in a stylesheet is a name every copy shares: three pickers
    // in a row all called --dp meant the first field's calendar opened
    // under the third field. Found in a screenshot of the workshop,
    // which is why it has three of them.
    // Both in ONE app, because useId counts per app and two separate
    // mounts would each start over and pass for the wrong reason.
    const Two = defineComponent({
      setup: () => () => [h(DatePicker, { label: 'A' }), h(DatePicker, { label: 'B' })]
    })
    const w = mount(Two, { attachTo: document.body })
    const [a, b] = w.findAll('.u-dp').map(el => (el.element as HTMLElement).style.anchorName)
    expect(a).toMatch(/^--dp-/)
    expect(a).not.toBe(b)
    const pops = w.findAll('[popover]').map(el => (el.element as HTMLElement).style.positionAnchor)
    expect(pops[0]).toBe(a)
    expect(pops[1]).toBe(b)
  })

  it('reports a pick once, and closes behind it', async () => {
    const w = open()
    const pop = w.find('[popover]').element as HTMLElement & { hidePopover?: () => void }
    pop.hidePopover = vi.fn()
    const cell = w.findAll('.u-cal-day')[10]
    expect(cell).toBeTruthy()
    await cell!.trigger('click')
    expect(w.emitted('select')).toHaveLength(1)
    expect(pop.hidePopover).toHaveBeenCalled()
  })
})
