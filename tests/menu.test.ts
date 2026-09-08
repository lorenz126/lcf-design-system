import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import Menu from '../ui/molecules/Menu.vue'
import type { MenuItem } from '../ui/molecules/Menu.vue'

const items: MenuItem[] = [
  { id: 'rename', label: 'Rename' },
  { id: 'duplicate', label: 'Duplicate' },
  { id: 'share', label: 'Share' },
  { id: 'archive', label: 'Archive', disabled: true },
  { id: 'delete', label: 'Delete', danger: true, divider: true }
]

const open = (props: Record<string, unknown> = {}) =>
  mount(Menu, {
    props: { items, ...props },
    slots: {
      trigger: (s: { props: Record<string, unknown> }) => h('button', s.props, 'Open')
    },
    attachTo: document.body
  })

afterEach(() => { document.body.innerHTML = '' })

const trigger = (w: ReturnType<typeof open>) => w.find('[aria-haspopup="menu"]')
const list = (w: ReturnType<typeof open>) => w.find('[role="menu"]')
const here = () => (document.activeElement as HTMLElement)?.textContent?.trim()

async function key(el: ReturnType<typeof trigger>, k: string) {
  await el.trigger('keydown', { key: k })
  await new Promise(r => setTimeout(r, 0))
}

describe('Menu', () => {
  it('opens onto the first row, or the last one', async () => {
    const down = open()
    await key(trigger(down), 'ArrowDown')
    expect(here()).toBe('Rename')
    down.unmount()

    const up = open()
    await key(trigger(up), 'ArrowUp')
    expect(here()).toBe('Delete')
  })

  it('wraps, and steps over what cannot be chosen', async () => {
    const w = open()
    await key(trigger(w), 'ArrowDown')
    for (const label of ['Duplicate', 'Share', 'Delete', 'Rename']) {
      await key(list(w), 'ArrowDown')
      expect(here()).toBe(label)
    }
    // Archive is disabled and never receives the highlight in either
    // direction.
    await key(list(w), 'ArrowUp')
    expect(here()).toBe('Delete')
  })

  it('goes to the ends with Home and End', async () => {
    const w = open()
    await key(trigger(w), 'ArrowDown')
    await key(list(w), 'End')
    expect(here()).toBe('Delete')
    await key(list(w), 'Home')
    expect(here()).toBe('Rename')
  })

  it('jumps by name', async () => {
    const w = open()
    await key(trigger(w), 'ArrowDown')
    await key(list(w), 's')
    expect(here()).toBe('Share')
  })

  it('cycles when the same letter is pressed again', async () => {
    // "dd" means "the next thing starting with d", not "a row called dd"
    // — which is how anyone typing an initial repeatedly expects it to
    // behave.
    const w = open()
    await key(trigger(w), 'ArrowDown')
    await key(list(w), 'd')
    expect(here()).toBe('Duplicate')
    await key(list(w), 'd')
    expect(here()).toBe('Delete')
    await key(list(w), 'd')
    expect(here()).toBe('Duplicate')
  })

  it('leaves Enter and Space to the browser', async () => {
    // Every row is a real <button>, so the browser already activates it.
    // Handling them here would fire twice; swallowing Space into the
    // typeahead would stop it firing at all.
    const w = open()
    await key(trigger(w), 'ArrowDown')
    for (const k of ['Enter', ' ']) {
      const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
      list(w).element.dispatchEvent(e)
      expect(e.defaultPrevented).toBe(false)
    }
  })

  it('reports the row that was chosen, and shuts', async () => {
    const w = open()
    await key(trigger(w), 'ArrowDown')
    await w.findAll('[role="menuitem"]')[1]!.trigger('click')
    await new Promise(r => setTimeout(r, 0))
    expect(w.emitted('select')![0]![0]).toMatchObject({ id: 'duplicate' })
    expect(trigger(w).attributes('aria-expanded')).toBe('false')
  })

  it('refuses a row that is disabled', async () => {
    const w = open()
    await key(trigger(w), 'ArrowDown')
    const archive = w.findAll('[role="menuitem"]').find(b => b.text() === 'Archive')!
    expect(archive.attributes('disabled')).toBeDefined()
    await archive.trigger('click')
    expect(w.emitted('select')).toBeUndefined()
  })

  it('closes on Tab and hands focus back, without eating the Tab', async () => {
    const w = open()
    await key(trigger(w), 'ArrowDown')
    const e = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    list(w).element.dispatchEvent(e)
    await new Promise(r => setTimeout(r, 0))
    expect(e.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(trigger(w).element)
    expect(trigger(w).attributes('aria-expanded')).toBe('false')
  })

  it('gives a checkable row the role that says so', () => {
    const w = mount(Menu, {
      props: { items: [{ id: 'x', label: 'Completed', checked: true }] },
      slots: { trigger: (s: { props: Record<string, unknown> }) => h('button', s.props, 'Open') }
    })
    const row = w.find('[role="menuitemcheckbox"]')
    expect(row.exists()).toBe(true)
    expect(row.attributes('aria-checked')).toBe('true')
  })

  it('draws a separator that is one, and only where asked', () => {
    const w = open()
    // Exactly one item carries `divider`.
    expect(w.findAll('[role="separator"], hr')).toHaveLength(1)
  })

  /* ---------- a row that is a level ---------- */

  const nested: MenuItem[] = [
    { id: 'text', label: 'Text' },
    {
      id: 'systems',
      label: 'Integrations',
      children: [{ id: 'gmail', label: 'Gmail' }, { id: 'slack', label: 'Slack' }]
    },
    { id: 'details', label: 'Details' }
  ]
  const nest = () =>
    mount(Menu, {
      props: { items: nested },
      slots: { trigger: (s: { props: Record<string, unknown> }) => h('button', s.props, 'Open') },
      attachTo: document.body
    })

  it('walks into a group instead of choosing it', async () => {
    const w = nest()
    await key(trigger(w), 'ArrowDown')
    await list(w).findAll('[role="menuitem"]')[1]!.trigger('click')
    await new Promise(r => setTimeout(r, 0))

    // The gate emits nothing and the menu stays open — it is a way in,
    // not a command.
    expect(w.emitted('select')).toBeUndefined()
    expect(list(w).exists()).toBe(true)

    // The way back is named after the gate, and focus is on the first child.
    const labels = list(w).findAll('[role="menuitem"]').map(r => r.text())
    expect(labels).toEqual(['Integrations', 'Gmail', 'Slack'])
    expect(here()).toBe('Gmail')
  })

  it('emits for the leaf, not for the level it came from', async () => {
    const w = nest()
    await key(trigger(w), 'ArrowDown')
    await list(w).findAll('[role="menuitem"]')[1]!.trigger('click')
    await new Promise(r => setTimeout(r, 0))
    await list(w).findAll('[role="menuitem"]')[2]!.trigger('click')

    expect(w.emitted('select')).toHaveLength(1)
    expect((w.emitted('select')![0]![0] as MenuItem).id).toBe('slack')
  })

  it('ArrowRight walks in, ArrowLeft walks back onto the gate', async () => {
    const w = nest()
    await key(trigger(w), 'ArrowDown')
    await key(list(w), 'ArrowDown')
    expect(here()).toBe('Integrations')
    await key(list(w), 'ArrowRight')
    expect(here()).toBe('Gmail')
    await key(list(w), 'ArrowLeft')
    // Back where the walk started, not at the top of the list.
    expect(here()).toBe('Integrations')
  })

  it('the first Escape is the way out of the group, not out of the menu', async () => {
    const w = nest()
    await key(trigger(w), 'ArrowDown')
    await key(list(w), 'ArrowDown')
    await key(list(w), 'ArrowRight')

    const e = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    list(w).element.dispatchEvent(e)
    await new Promise(r => setTimeout(r, 0))
    // Stopped, so the popover's own dismissal never sees it.
    expect(e.defaultPrevented).toBe(true)
    expect(list(w).exists()).toBe(true)
    expect(list(w).findAll('[role="menuitem"]').map(r => r.text()))
      .toEqual(['Text', 'Integrations', 'Details'])
  })

  it('reopens at the top, and never remembers where it stood', async () => {
    const w = nest()
    await key(trigger(w), 'ArrowDown')
    await list(w).findAll('[role="menuitem"]')[1]!.trigger('click')
    await new Promise(r => setTimeout(r, 0))
    await list(w).findAll('[role="menuitem"]')[1]!.trigger('click')   // Gmail: closes

    await key(trigger(w), 'ArrowDown')
    expect(list(w).findAll('[role="menuitem"]').map(r => r.text()))
      .toEqual(['Text', 'Integrations', 'Details'])
  })

  it('an empty children array is a plain command', async () => {
    const w = mount(Menu, {
      props: { items: [{ id: 'x', label: 'Nothing under it', children: [] }] },
      slots: { trigger: (s: { props: Record<string, unknown> }) => h('button', s.props, 'Open') },
      attachTo: document.body
    })
    await key(w.find('[aria-haspopup="menu"]'), 'ArrowDown')
    await w.find('[role="menu"]').find('[role="menuitem"]').trigger('click')
    expect(w.emitted('select')).toHaveLength(1)
  })
})
