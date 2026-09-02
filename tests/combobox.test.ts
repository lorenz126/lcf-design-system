import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Combobox from '../ui/molecules/Combobox.vue'

const OPTIONS = [
  { value: 'de', label: 'Germany', note: 'DE', keywords: ['deutschland'] },
  { value: 'at', label: 'Austria', note: 'AT' },
  { value: 'ch', label: 'Switzerland', note: 'CH' },
  { value: 'li', label: 'Liechtenstein', note: 'LI', disabled: true }
]

const open = (props: Record<string, unknown> = {}) =>
  mount(Combobox, { props: { options: OPTIONS, label: 'Country', ...props }, attachTo: document.body })

const box = (w: ReturnType<typeof open>) => w.find('input')
const rows = (w: ReturnType<typeof open>) => w.findAll('[role="option"]')
const type = async (w: ReturnType<typeof open>, v: string) => {
  await box(w).setValue(v)
  await nextTick()
}

describe('the value is an id, not the text', () => {
  it('emits the option‘s value rather than its label', async () => {
    // A form submits a country, not the letters someone typed.
    const w = open()
    await box(w).trigger('focus')
    await rows(w)[0]!.trigger('click')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['de'])
  })

  it('shows the label for the value it was given', () => {
    expect((box(open({ modelValue: 'ch' })).element as HTMLInputElement).value).toBe('Switzerland')
  })

  it('keeps the label visible when the field takes focus', async () => {
    // Clearing on focus was a control lying about itself: tab in, see an
    // empty box, conclude nothing is chosen, tab out — and the value was
    // there the whole time. It is selected instead, so one keystroke
    // replaces it.
    const w = open({ modelValue: 'ch' })
    await box(w).trigger('focus')
    expect((box(w).element as HTMLInputElement).value).toBe('Switzerland')
  })

  it('puts the label back when a half-typed query is abandoned', async () => {
    const w = open({ modelValue: 'ch' })
    await box(w).trigger('focus')
    await type(w, 'ger')
    await box(w).trigger('blur')
    expect((box(w).element as HTMLInputElement).value).toBe('Switzerland')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('does not wipe what was typed when Escape only closes the list', async () => {
    // One key closing the list and clearing the box is two undos in one
    // press.
    const w = open()
    await box(w).trigger('focus')
    await type(w, 'ger')
    await box(w).trigger('keydown', { key: 'Escape' })
    expect((box(w).element as HTMLInputElement).value).toBe('ger')
  })

  it('follows a label that changed without moving the value', async () => {
    const w = open({ modelValue: 'de' })
    await w.setProps({ options: [{ value: 'de', label: 'Deutschland' }, ...OPTIONS.slice(1)] })
    expect((box(w).element as HTMLInputElement).value).toBe('Deutschland')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('it looks up rather than searching', () => {
  it('matches a substring, and prefers a prefix', async () => {
    const w = open()
    await box(w).trigger('focus')
    await type(w, 'a')
    // Austria starts with it; Germany and Switzerland only contain it.
    expect(rows(w)[0]!.text()).toContain('Austria')
  })

  it('refuses a fuzzy match, which in a form is an offer of the wrong country', async () => {
    const w = open()
    await box(w).trigger('focus')
    await type(w, 'gmy')
    expect(rows(w)).toHaveLength(0)
    expect(w.find('.u-cb-empty').text()).toBe('No matches.')
  })

  it('takes a keyword for a name it is also known by', async () => {
    const w = open()
    await box(w).trigger('focus')
    await type(w, 'deutsch')
    expect(rows(w)).toHaveLength(1)
    expect(rows(w)[0]!.text()).toContain('Germany')
  })
})

describe('several at once', () => {
  it('collects ids in an array', async () => {
    const w = open({ multiple: true, modelValue: ['de'] })
    await box(w).trigger('focus')
    await rows(w)[0]!.trigger('click')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([['de', 'at']])
  })

  it('takes what is already chosen out of the list', async () => {
    const w = open({ multiple: true, modelValue: ['de', 'at'] })
    await box(w).trigger('focus')
    expect(rows(w).map(r => r.text())).not.toContain(expect.stringContaining('Germany'))
    expect(rows(w)).toHaveLength(2)
  })

  it('lets Backspace take the last chip, so the field can be emptied by keyboard', async () => {
    const w = open({ multiple: true, modelValue: ['de', 'at'] })
    await box(w).trigger('keydown', { key: 'Backspace' })
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([['de']])
  })

  it('does not take a chip while there is text to delete instead', async () => {
    const w = open({ multiple: true, modelValue: ['de'] })
    await box(w).trigger('focus')
    await type(w, 'aus')
    await box(w).trigger('keydown', { key: 'Backspace' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('clears the filter after a pick, or the rest stays hidden', async () => {
    const w = open({ multiple: true, modelValue: [] })
    await box(w).trigger('focus')
    await type(w, 'aus')
    await rows(w)[0]!.trigger('click')
    expect((box(w).element as HTMLInputElement).value).toBe('')
  })
})

describe('creating an option', () => {
  it('offers nothing unless asked', async () => {
    const w = open()
    await box(w).trigger('focus')
    await type(w, 'Narnia')
    expect(w.find('.u-cb-new').exists()).toBe(false)
  })

  it('reports the text and writes nothing itself', async () => {
    // A component that pushed the option into its own list would make
    // one that exists until the page reloads.
    const w = open({ creatable: true })
    await box(w).trigger('focus')
    await type(w, 'Narnia')
    const create = w.find('.u-cb-new')
    expect(create.text()).toBe('Add “Narnia”')
    await create.trigger('click')
    expect(w.emitted('create')).toEqual([['Narnia']])
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('will not offer to add something that is already there', async () => {
    // "Add Germany" under a list containing Germany is a duplicate.
    const w = open({ creatable: true })
    await box(w).trigger('focus')
    await type(w, 'germany')
    expect(w.find('.u-cb-new').exists()).toBe(false)
  })
})

describe('the keyboard', () => {
  it('keeps focus in the input and moves a highlight', async () => {
    // Focused for real, not with a synthetic event: the assertion is
    // about where focus IS after the arrows, so a trigger('focus') that
    // fires the handler without moving focus would prove nothing.
    const w = open()
    box(w).element.focus()
    await box(w).trigger('focus')
    const first = box(w).attributes('aria-activedescendant')
    await box(w).trigger('keydown', { key: 'ArrowDown' })
    expect(box(w).attributes('aria-activedescendant')).not.toBe(first)
    expect(document.activeElement).toBe(box(w).element)
  })

  it('wraps at both ends', async () => {
    const w = open()
    await box(w).trigger('focus')
    await box(w).trigger('keydown', { key: 'ArrowUp' })
    expect(rows(w).at(-1)!.attributes('aria-selected')).toBe('true')
  })

  it('takes the highlighted row on Enter', async () => {
    const w = open()
    await box(w).trigger('focus')
    await box(w).trigger('keydown', { key: 'ArrowDown' })
    await box(w).trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['at'])
  })

  it('closes on Escape and stops there', async () => {
    // Clearing a field must not also close the dialog it is in.
    const w = open()
    await box(w).trigger('focus')
    expect(box(w).attributes('aria-expanded')).toBe('true')
    const e = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    box(w).element.dispatchEvent(e)
    await nextTick()
    expect(box(w).attributes('aria-expanded')).toBe('false')
    expect(e.cancelBubble).toBe(true)
  })

  it('refuses a disabled option however it is reached', async () => {
    const w = open()
    await box(w).trigger('focus')
    const locked = rows(w).at(-1)!
    expect(locked.attributes('aria-disabled')).toBe('true')
    await locked.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})
