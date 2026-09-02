import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import SearchField from '../ui/molecules/SearchField.vue'
import type { SearchSuggestion } from '../ui/molecules/SearchField.vue'

const ALL: SearchSuggestion[] = [
  { id: 1, label: 'Table', note: 'Organisms' },
  { id: 2, label: 'Tabs', note: 'Molecules' },
  { id: 3, label: 'Avatar', note: 'Atoms' }
]
const RECENT: SearchSuggestion[] = [{ id: 9, label: 'Kanban', note: 'Organisms' }]

/**
 * A real parent again. The list refuses to open if the field reads its
 * own model back in the same tick, and only a bound v-model puts it in
 * that position.
 */
const Host = defineComponent({
  props: { shortcut: { type: String, default: undefined } },
  setup() {
    const q = ref('')
    const picked = ref<SearchSuggestion[]>([])
    const submitted = ref<string[]>([])
    return { q, picked, submitted }
  },
  computed: {
    matches(): SearchSuggestion[] {
      const n = this.q.trim().toLowerCase()
      return n ? ALL.filter(s => s.label.toLowerCase().includes(n)) : []
    }
  },
  render() {
    return h(SearchField, {
      modelValue: this.q,
      'onUpdate:modelValue': (v: string) => { this.q = v },
      suggestions: this.matches,
      recent: RECENT,
      shortcut: this.shortcut,
      onSelect: (s: SearchSuggestion) => this.picked.push(s),
      onSubmit: (s: string) => this.submitted.push(s)
    })
  }
})

const open = (shortcut?: string) =>
  mount(Host, { props: { shortcut }, attachTo: document.body })
afterEach(() => { document.body.innerHTML = '' })

const field = (w: ReturnType<typeof open>) => w.find('input')
const options = (w: ReturnType<typeof open>) => w.findAll('[role="option"]')
const flush = () => new Promise(r => setTimeout(r, 0))

async function type(w: ReturnType<typeof open>, value: string) {
  field(w).element.value = value
  await field(w).trigger('input')
  await flush()
}
async function key(w: ReturnType<typeof open>, k: string) {
  await field(w).trigger('keydown', { key: k })
  await flush()
}

describe('SearchField', () => {
  it('is a combobox only once it has a list to control', () => {
    const bare = mount(SearchField)
    expect(bare.find('input').attributes('role')).toBeUndefined()
    expect(field(open()).attributes('role')).toBe('combobox')
  })

  it('offers what you looked at last when it is empty', async () => {
    const w = open()
    await field(w).trigger('focus')
    await flush()
    expect(field(w).attributes('aria-expanded')).toBe('true')
    expect(options(w).map(o => o.text())).toEqual(['KanbanOrganisms'])
  })

  it('opens on a query typed in the same tick the model changes', async () => {
    // defineModel does not apply the write locally when a parent binds
    // v-model: asked immediately, the field still holds the previous
    // query and the list judges itself empty.
    const w = open()
    await field(w).trigger('focus')
    await type(w, 'tab')
    expect(field(w).attributes('aria-expanded')).toBe('true')
    expect(options(w).map(o => o.text())).toEqual(['TableOrganisms', 'TabsMolecules'])
  })

  it('says so when nothing matched, rather than shutting', async () => {
    const w = open()
    await field(w).trigger('focus')
    await type(w, 'zzz')
    expect(field(w).attributes('aria-expanded')).toBe('true')
    expect(options(w)).toHaveLength(0)
    expect(w.find('.u-sf-none').exists()).toBe(true)
  })

  it('moves a highlight and never the focus', async () => {
    // Focus is where the next keystroke goes. Moving it into the list
    // means every letter after the first arrow lands somewhere else.
    const w = open()
    field(w).element.focus()
    await field(w).trigger('focus')
    await type(w, 'tab')
    await key(w, 'ArrowDown')
    expect(document.activeElement).toBe(field(w).element)
    expect(field(w).attributes('aria-activedescendant')).toBe(options(w)[0]!.attributes('id'))
    expect(options(w)[0]!.attributes('aria-selected')).toBe('true')
    await key(w, 'ArrowDown')
    expect(options(w)[1]!.attributes('aria-selected')).toBe('true')
    await key(w, 'ArrowDown')
    expect(options(w)[0]!.attributes('aria-selected')).toBe('true')
  })

  it('takes the highlighted row on Enter', async () => {
    const w = open()
    await field(w).trigger('focus')
    await type(w, 'tab')
    await key(w, 'ArrowDown')
    await key(w, 'Enter')
    expect(w.vm.picked).toEqual([ALL[0]])
    expect(field(w).attributes('aria-expanded')).toBe('false')
  })

  it('submits the query when nothing is highlighted', async () => {
    const w = open()
    await field(w).trigger('focus')
    await type(w, 'tab')
    await key(w, 'Enter')
    expect(w.vm.picked).toHaveLength(0)
    expect(w.vm.submitted).toEqual(['tab'])
  })

  it('closes on the first Escape and clears on the second', async () => {
    const w = open()
    await field(w).trigger('focus')
    await type(w, 'tab')
    await key(w, 'Escape')
    expect(field(w).attributes('aria-expanded')).toBe('false')
    expect(w.vm.q).toBe('tab')
    await key(w, 'Escape')
    expect(w.vm.q).toBe('')
  })

  it('keeps Escape to itself', async () => {
    // Clearing a field must not also close the dialog it is sitting in.
    const w = open()
    await type(w, 'tab')
    const e = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    let escapedUpward = false
    document.addEventListener('keydown', () => { escapedUpward = true }, { once: true })
    field(w).element.dispatchEvent(e)
    expect(escapedUpward).toBe(false)
    expect(e.defaultPrevented).toBe(true)
  })

  it('swaps the glyph for a way out, and back', async () => {
    const w = open()
    expect(w.find('.u-sf-glyph').exists()).toBe(true)
    expect(w.find('.u-sf-clear').exists()).toBe(false)
    await type(w, 'tab')
    expect(w.find('.u-sf-glyph').exists()).toBe(false)
    expect(w.find('.u-sf-clear').exists()).toBe(true)
  })

  it('leaves focus in the field after clearing it', async () => {
    // Clearing and then losing the box is how you end up typing into the
    // page.
    const w = open()
    await type(w, 'tab')
    await w.find('.u-sf-clear').trigger('click')
    await flush()
    expect(w.vm.q).toBe('')
    expect(document.activeElement).toBe(field(w).element)
  })

  it('shows a shortcut only while the field is idle, and takes it', async () => {
    const w = open('k')
    await flush()
    const hint = w.find('.u-sf-key')
    expect(hint.exists()).toBe(true)
    // The modifier the component decided on, whichever platform this is.
    const mac = hint.text().startsWith('⌘')
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k', metaKey: mac, ctrlKey: !mac, bubbles: true, cancelable: true
      })
    )
    await flush()
    expect(document.activeElement).toBe(field(w).element)
    await field(w).trigger('focus')
    await flush()
    expect(w.find('.u-sf-key').exists()).toBe(false)
  })

  it('claims no shortcut unless asked', async () => {
    const w = open()
    await flush()
    expect(w.find('.u-sf-key').exists()).toBe(false)
    const e = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true, cancelable: true })
    window.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(false)
  })
})
