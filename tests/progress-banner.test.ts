import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Progress from '../ui/atoms/Progress.vue'
import Banner from '../ui/molecules/Banner.vue'

describe('Progress', () => {
  it('is a real progress element, so the value needs no aria of ours', () => {
    const w = mount(Progress, { props: { value: 40, label: 'Restoring' } })
    const bar = w.find('progress')
    expect(bar.exists()).toBe(true)
    expect(bar.attributes('value')).toBe('40')
    expect(bar.attributes('max')).toBe('100')
    expect(bar.attributes('aria-label')).toBe('Restoring')
  })

  it('treats the absence of a value as indeterminate, not a flag', () => {
    // Omitting `value` is the state the browser already understands, so
    // there is no second one to keep in step.
    const w = mount(Progress, { props: { label: 'Working' } })
    expect(w.find('progress').attributes('value')).toBeUndefined()
    expect(w.classes()).toContain('u-pr-busy')
  })

  it('stops being indeterminate the moment a value arrives', async () => {
    const w = mount(Progress, { props: { label: 'Working' } })
    expect(w.classes()).toContain('u-pr-busy')
    await w.setProps({ value: 0 })
    // Zero is a value. Anything treating it as absent reports "working"
    // for the whole first percent.
    expect(w.classes()).not.toContain('u-pr-busy')
    expect(w.find('progress').attributes('value')).toBe('0')
  })

  it('gives the number a unit, and takes one when offered', () => {
    const plain = mount(Progress, { props: { value: 40, showValue: true } })
    expect(plain.find('.u-pr-value').text()).toBe('40%')

    const bytes = mount(Progress, {
      props: {
        value: 3,
        max: 12,
        showValue: true,
        format: (v: number, m: number) => `${v} of ${m} files`
      }
    })
    expect(bytes.find('.u-pr-value').text()).toBe('3 of 12 files')
    expect(bytes.find('progress').attributes('aria-valuetext')).toBe('3 of 12 files')
  })

  it('scales against a max that is not a hundred', () => {
    const w = mount(Progress, { props: { value: 3, max: 12, showValue: true } })
    expect(w.find('.u-pr-value').text()).toBe('25%')
  })

  it('says nothing about a value while it has none', () => {
    const w = mount(Progress, { props: { showValue: true, label: 'Working' } })
    expect(w.find('.u-pr-value').exists()).toBe(false)
    expect(w.find('progress').attributes('aria-valuetext')).toBeUndefined()
  })
})

describe('Banner', () => {
  it('is not a live region by default', () => {
    // One that is on the page when the page loads has nothing to
    // announce: it is read in order, like the rest of the page.
    const w = mount(Banner, { props: { title: 'Read-only' } })
    expect(w.attributes('role')).toBeUndefined()
  })

  it('takes the urgency from the tone when asked to announce', () => {
    const waits = mount(Banner, { props: { title: 'Saved', announce: true } })
    expect(waits.attributes('role')).toBe('status')

    const interrupts = mount(Banner, { props: { title: 'Failed', tone: 'red', announce: true } })
    expect(interrupts.attributes('role')).toBe('alert')
  })

  it('says the tone with its ground and its mark, not with its words', () => {
    // The ground already says it; colouring the text as well is the same
    // thing twice, and it fell under AA in dark mode when it was tried.
    const w = mount(Banner, { props: { title: 'Archived', tone: 'orange' } })
    expect(w.attributes('data-tone')).toBe('orange')
    expect(w.find('.u-bn-mark').exists()).toBe(true)
    expect(w.find('.u-bn-title').classes()).not.toContain('u-bn-mark')
  })

  it('offers no way out unless one is asked for, and names it when it is', async () => {
    const plain = mount(Banner, { props: { title: 'Read-only' } })
    expect(plain.find('.u-bn-x').exists()).toBe(false)

    const w = mount(Banner, { props: { title: 'Sync failed', dismissible: true } })
    const x = w.find('.u-bn-x')
    expect(x.attributes('aria-label')).toBe('Dismiss: Sync failed')
    await x.trigger('click')
    // It reports; the page decides. A banner that hid itself would come
    // back on the next render with nothing to show for it.
    expect(w.emitted('dismiss')).toHaveLength(1)
    expect(w.find('.u-bn').exists() || w.classes().includes('u-bn')).toBe(true)
  })

  it('prefers the slot to the prop when both are given', () => {
    const w = mount(Banner, {
      props: { title: 'Archived', description: 'from the prop' },
      slots: { default: 'from the slot' }
    })
    expect(w.find('.u-bn-body').text()).toBe('from the slot')
  })
})
