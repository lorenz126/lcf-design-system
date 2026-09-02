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

  it('turns the marks with the slider', () => {
    const w = open({ modelValue: 40, orientation: 'vertical', ticks: [50] })
    const style = w.find('.u-sl-tick').attributes('style')!
    expect(style).toContain('inset-block-end')
    expect(style).not.toContain('inset-inline-start')
  })
})
