import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Slider from '../ui/atoms/Slider.vue'

const open = (props: Record<string, unknown> = {}) =>
  mount(Slider, { props: { label: 'Volume', ...props } })

describe('Slider', () => {
  it('is a real range input, so the keyboard is the browser‘s', () => {
    const w = open({ modelValue: 40, min: 0, max: 100, step: 5 })
    const i = w.find('input')
    expect(i.attributes('type')).toBe('range')
    expect(i.attributes('min')).toBe('0')
    expect(i.attributes('max')).toBe('100')
    expect(i.attributes('step')).toBe('5')
  })

  it('gives the number a unit, because a bare 40 says nothing', () => {
    expect(open({ modelValue: 40 }).find('input').attributes('aria-valuetext'))
      .toBe('40 percent')

    const db = open({
      modelValue: 3, min: -12, max: 12, format: (n: number) => `${n} dB`
    })
    expect(db.find('input').attributes('aria-valuetext')).toBe('3 dB')
  })

  it('leaves the value alone when the range is not a percentage', () => {
    // "3 percent" of a −12…12 scale would be a lie.
    expect(open({ modelValue: 3, min: -12, max: 12 }).find('input').attributes('aria-valuetext'))
      .toBe('3')
  })

  it('marks the rail without moving the thumb', () => {
    // Ticks are reference points. Snapping is what `step` is for, and a
    // slider that pulls toward marks cannot be set to 51.
    const w = open({ modelValue: 51, ticks: [12.5, 25, 50] })
    expect(w.findAll('.u-sl-tick')).toHaveLength(3)
    expect(w.find('input').element.value).toBe('51')
  })

  it('hides the marks from anything that reads it aloud', () => {
    // The value is already announced; three dots add nothing to it.
    const w = open({ modelValue: 40, ticks: [25, 50] })
    expect(w.find('.u-sl-ticks').attributes('aria-hidden')).toBe('true')
  })

  it('drops a mark that is outside the range', () => {
    const w = open({ modelValue: 5, min: 0, max: 10, ticks: [-3, 5, 99] })
    expect(w.findAll('.u-sl-tick')).toHaveLength(1)
  })

  it('reserves no room under the rail when there is nothing to put there', () => {
    expect(open({ modelValue: 40 }).find('.u-sl-wrap').classes()).not.toContain('u-sl-ticked')
    expect(open({ modelValue: 40, ticks: [50] }).find('.u-sl-wrap').classes()).toContain('u-sl-ticked')
  })

  it('measures the fill and the marks the same way', () => {
    // The thumb travels INSIDE the track, so half is not half the width.
    // Both use at(), so the fill and a mark at the same value land
    // together — they did not before, and a thick rail made it visible.
    const w = open({ modelValue: 50, ticks: [50] })
    const stop = w.find('input').attributes('style')!
    const tick = w.find('.u-sl-tick').attributes('style')!
    const geometry = /calc\(var\(--sl-tw\) \/ 2 \+ 0\.5 \* \(100% - var\(--sl-tw\)\)\)/
    expect(stop).toMatch(geometry)
    expect(tick).toMatch(geometry)
  })

  it('leaves the value where it is put, unless asked to snap', async () => {
    const w = open({ modelValue: 20, ticks: [25, 50, 75] })
    const i = w.find('input')
    i.element.value = '24'
    await i.trigger('pointerdown')
    await i.trigger('input')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([24])
  })

  it('catches a dragged handle near a mark', async () => {
    const w = open({ modelValue: 20, ticks: [25, 50, 75], snap: true })
    const i = w.find('input')
    await i.trigger('pointerdown')
    i.element.value = '24'
    await i.trigger('input')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([25])
  })

  it('lets go once the drag is far enough away', async () => {
    // 4% of 0–100 is four units, so 30 is outside the pull of 25.
    const w = open({ modelValue: 20, ticks: [25, 50, 75], snap: true })
    const i = w.find('input')
    await i.trigger('pointerdown')
    i.element.value = '30'
    await i.trigger('input')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([30])
  })

  it('never magnetises the keyboard', async () => {
    // An arrow key is exact. Landing on 25 because a mark was nearby is
    // the control reporting something the user did not do.
    const w = open({ modelValue: 20, ticks: [25, 50, 75], snap: true })
    const i = w.find('input')
    await i.trigger('keydown', { key: 'ArrowRight' })
    i.element.value = '24'
    await i.trigger('input')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([24])
  })

  it('takes a pull distance in its own units', async () => {
    const w = open({ modelValue: 0, min: -12, max: 12, ticks: [0], snap: 1 })
    const i = w.find('input')
    await i.trigger('pointerdown')
    i.element.value = '2'
    await i.trigger('input')
    // Two away from the mark, with a pull of one: it stays put.
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([2])
  })

  it('keeps the handle on the value while the magnet holds it', async () => {
    // The thumb is painted by the input from its own value and the fill
    // from the model. Without this the input walks on under the pointer
    // while the fill stays at the mark, and the handle visibly slides
    // off the edge it is meant to cap.
    const w = open({ modelValue: 25, ticks: [25, 50, 75], snap: true })
    const i = w.find('input')
    await i.trigger('pointerdown')
    i.element.value = '27'
    await i.trigger('input')
    expect(i.element.value).toBe('25')
  })

  it('leaves the grid alone when no finer one is asked for', async () => {
    const w = open({ modelValue: 40, step: 1 })
    const i = w.find('input')
    expect(i.attributes('step')).toBe('1')
    await i.trigger('pointerdown')
    expect(i.element.step).toBe('1')
  })

  it('hands the pointer a finer grid than the keyboard', async () => {
    // Three pixels a step is a staircase you can see. An arrow key wants
    // none of that fineness, and neither does the number you read.
    const w = open({ modelValue: 40, step: 1, precision: 0.1 })
    const i = w.find('input')
    await i.trigger('pointerdown')
    expect(i.element.step).toBe('0.1')
    await i.trigger('keydown', { key: 'ArrowRight' })
    expect(i.element.step).toBe('1')
  })

  it('sets the element‘s step before the browser acts on the event', async () => {
    // Vue patches a microtask too late: by then the drag has already
    // been quantised on the old grid.
    const w = open({ modelValue: 40, step: 1, precision: 0.1 })
    const i = w.find('input')
    i.element.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    expect(i.element.step).toBe('0.1') // no await
  })

  it('reads the value at the step, not at the precision', () => {
    const w = open({ modelValue: 63.4, step: 1, precision: 0.1 })
    expect(w.find('input').attributes('aria-valuetext')).toBe('63 percent')
  })

  it('keeps the float dust out of the number', () => {
    const w = open({ modelValue: 0.30000000000000004, min: 0, max: 1, step: 0.1, precision: 0.01 })
    expect(w.find('input').attributes('aria-valuetext')).toBe('0.3')
  })

  it('puts the value back on the coarse grid when a moving key arrives', async () => {
    // Otherwise the browser sanitises the element to the nearest step
    // without an event, and the thumb and the fill disagree until the
    // next keystroke.
    const w = open({ modelValue: 63.4, step: 1, precision: 0.1 })
    const i = w.find('input')
    await i.trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([63])
  })

  it('does not round the value on a key that was only leaving', async () => {
    const w = open({ modelValue: 63.4, step: 1, precision: 0.1 })
    await w.find('input').trigger('keydown', { key: 'Tab' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('turns the marks with the slider', () => {
    const w = open({ modelValue: 40, orientation: 'vertical', ticks: [50] })
    const style = w.find('.u-sl-tick').attributes('style')!
    expect(style).toContain('inset-block-end')
    expect(style).not.toContain('inset-inline-start')
  })
})
