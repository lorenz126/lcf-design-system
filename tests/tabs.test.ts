import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Tabs from '../ui/molecules/Tabs.vue'

const ITEMS = [
  { value: 'a', label: 'Overview' },
  { value: 'b', label: 'Issues', badge: 12 },
  { value: 'c', label: 'Locked', disabled: true },
  { value: 'd', label: 'Settings' }
]

const open = (props: Record<string, unknown> = {}, slots?: Record<string, string>) =>
  mount(Tabs, {
    props: { items: ITEMS, label: 'Project', modelValue: 'a', ...props },
    slots,
    attachTo: document.body
  })

const tabs = (w: ReturnType<typeof open>) => w.findAll('[role="tab"]')

describe('Tabs', () => {
  it('is a tablist with one tab stop, not one per tab', () => {
    // Ten tabs must not be ten stops on the way past.
    const w = open()
    expect(w.find('[role="tablist"]').attributes('aria-label')).toBe('Project')
    expect(tabs(w).map(t => t.attributes('tabindex'))).toEqual(['0', '-1', '-1', '-1'])
  })

  it('puts the tab stop on what is open', () => {
    const w = open({ modelValue: 'd' })
    expect(tabs(w).map(t => t.attributes('tabindex'))).toEqual(['-1', '-1', '-1', '0'])
  })

  it('wires each tab to the panel it fills, and the panel back', () => {
    const w = open({}, { default: 'anything' })
    const panel = w.find('[role="tabpanel"]')
    expect(tabs(w)[0]!.attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(panel.attributes('aria-labelledby')).toBe(tabs(w)[0]!.attributes('id'))
  })

  it('renders no panel at all when nothing was put in it', () => {
    // An empty tabpanel is a promise of content that never arrives.
    const w = mount(Tabs, { props: { items: ITEMS, modelValue: 'a' } })
    expect(w.find('[role="tabpanel"]').exists()).toBe(false)
  })

  it('renders one panel, and hands it the value', () => {
    const w = mount(Tabs, {
      props: { items: ITEMS, modelValue: 'b' },
      slots: { default: '<p>panel for {{ params.active }}</p>' }
    })
    expect(w.findAll('[role="tabpanel"]')).toHaveLength(1)
    expect(w.find('[role="tabpanel"]').text()).toBe('panel for b')
  })

  it('keeps the panel reachable even when it holds nothing focusable', () => {
    // Counting focusable descendants is a measurement that goes stale
    // the moment the panel renders something else.
    const w = open({}, { default: 'just words' })
    expect(w.find('[role="tabpanel"]').attributes('tabindex')).toBe('0')
  })

  it('selects as the arrows move, by default', async () => {
    const w = open()
    await tabs(w)[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['b'])
  })

  it('moves without selecting when the panel has to fetch', async () => {
    // Automatic activation fires a request per keypress.
    const w = open({ activation: 'manual' })
    await tabs(w)[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(document.activeElement).toBe(tabs(w)[1]!.element)
  })

  it('leaves Enter and Space to the browser', async () => {
    // Every tab is a real <button>, so a click arrives on its own.
    const w = open({ activation: 'manual' })
    await tabs(w)[1]!.trigger('click')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['b'])
  })

  it('wraps at both ends, and Home and End go straight there', async () => {
    const w = open()
    await tabs(w)[0]!.trigger('keydown', { key: 'ArrowLeft' })
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['d'])
    await tabs(w)[0]!.trigger('keydown', { key: 'End' })
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['d'])
    await tabs(w)[3]!.trigger('keydown', { key: 'Home' })
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['a'])
  })

  it('turns with the orientation, and says so', async () => {
    const w = open({ orientation: 'vertical' })
    expect(w.find('[role="tablist"]').attributes('aria-orientation')).toBe('vertical')
    await tabs(w)[0]!.trigger('keydown', { key: 'ArrowDown' })
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['b'])
    // The other axis is not this widget's to take.
    await tabs(w)[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue')).toHaveLength(1)
  })

  it('lets focus land on a disabled tab, and refuses to open it', async () => {
    // The Calendar lesson: a real `disabled` leaves the focus order, the
    // roving tabindex cannot reach it, and the cursor drifts off focus.
    const w = open()
    const locked = tabs(w)[2]!
    expect(locked.attributes('disabled')).toBeUndefined()
    expect(locked.attributes('aria-disabled')).toBe('true')
    await locked.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('arrows onto a disabled tab without selecting it', async () => {
    const w = open({ modelValue: 'b' })
    await tabs(w)[1]!.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(tabs(w)[2]!.element)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('says which one is open, and only that one', () => {
    const w = open({ modelValue: 'b' })
    expect(tabs(w).map(t => t.attributes('aria-selected')))
      .toEqual(['false', 'true', 'false', 'false'])
  })

  it('does not fade a list that fits', () => {
    // A fade over a row with nothing past the end says there is more
    // when there is not.
    expect(open().find('[role="tablist"]').attributes('data-over')).toBe('none')
  })

  it('fades the end when there is one to reach', async () => {
    const w = open()
    const el = w.find('[role="tablist"]').element as HTMLElement
    Object.defineProperty(el, 'clientWidth', { value: 200, configurable: true })
    Object.defineProperty(el, 'scrollWidth', { value: 600, configurable: true })
    await w.find('[role="tablist"]').trigger('scroll')
    expect(w.find('[role="tablist"]').attributes('data-over')).toBe('end')

    Object.defineProperty(el, 'scrollLeft', { value: 200, configurable: true })
    await w.find('[role="tablist"]').trigger('scroll')
    expect(w.find('[role="tablist"]').attributes('data-over')).toBe('both')

    Object.defineProperty(el, 'scrollLeft', { value: 400, configurable: true })
    await w.find('[role="tablist"]').trigger('scroll')
    expect(w.find('[role="tablist"]').attributes('data-over')).toBe('start')
  })

  it('counts a right-to-left scroller backwards without panicking', async () => {
    const w = open()
    const el = w.find('[role="tablist"]').element as HTMLElement
    Object.defineProperty(el, 'clientWidth', { value: 200, configurable: true })
    Object.defineProperty(el, 'scrollWidth', { value: 600, configurable: true })
    Object.defineProperty(el, 'scrollLeft', { value: -400, configurable: true })
    await w.find('[role="tablist"]').trigger('scroll')
    expect(w.find('[role="tablist"]').attributes('data-over')).toBe('start')
  })
})
