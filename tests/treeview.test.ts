import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TreeView from '../ui/organisms/TreeView.vue'

const TREE = [
  {
    id: 'src',
    label: 'src',
    children: [
      { id: 'ui', label: 'ui', children: [
        { id: 'atoms', label: 'atoms' },
        { id: 'molecules', label: 'molecules' }
      ] },
      { id: 'composables', label: 'composables' }
    ]
  },
  { id: 'tests', label: 'tests', children: [{ id: 'setup', label: 'setup.ts' }] },
  { id: 'readme', label: 'README.md' }
]

const open = (props: Record<string, unknown> = {}) =>
  mount(TreeView, { props: { items: TREE, label: 'Files', ...props }, attachTo: document.body })

const rows = (w: ReturnType<typeof open>) => w.findAll('[role="treeitem"]')
const labels = (w: ReturnType<typeof open>) => rows(w).map(r => r.find('.u-tv-label').text())
const row = (w: ReturnType<typeof open>, id: string) => w.find(`[data-id="${id}"]`)

describe('what it shows', () => {
  it('shows only what is open', () => {
    expect(labels(open())).toEqual(['src', 'tests', 'README.md'])
    expect(labels(open({ expanded: ['src'] }))).toEqual(['src', 'ui', 'composables', 'tests', 'README.md'])
  })

  it('speaks the level, not just indents it', () => {
    // Indentation says it to an eye and to nothing else.
    const w = open({ expanded: ['src', 'ui'] })
    const deep = row(w, 'atoms')
    expect(deep.attributes('aria-level')).toBe('3')
    expect(deep.attributes('aria-posinset')).toBe('1')
    expect(deep.attributes('aria-setsize')).toBe('2')
  })

  it('marks what can open, and says nothing about what cannot', () => {
    const w = open()
    expect(row(w, 'src').attributes('aria-expanded')).toBe('false')
    expect(row(w, 'readme').attributes('aria-expanded')).toBeUndefined()
  })

  it('is one tab stop for the whole tree', () => {
    // Not one per node: a deep tree would be a hundred stops on the way
    // past it.
    const w = open({ expanded: ['src', 'ui'] })
    expect(rows(w).filter(r => r.attributes('tabindex') === '0')).toHaveLength(1)
  })

  it('puts the stop on what is selected', () => {
    const w = open({ expanded: ['src'], modelValue: 'composables' })
    expect(row(w, 'composables').attributes('tabindex')).toBe('0')
  })
})

describe('Right and Left each do two things', () => {
  it('Right opens a closed node, then steps into it', async () => {
    const w = open()
    await row(w, 'src').trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:expanded')!.at(-1)).toEqual([['src']])
    expect(w.emitted('expand')![0]![0]).toMatchObject({ id: 'src' })

    const o = open({ expanded: ['src'] })
    await row(o, 'src').trigger('keydown', { key: 'ArrowRight' })
    await nextTick()
    expect(document.activeElement).toBe(row(o, 'ui').element)
  })

  it('Left closes an open node, then walks out of it', async () => {
    const w = open({ expanded: ['src'] })
    await row(w, 'src').trigger('keydown', { key: 'ArrowLeft' })
    expect(w.emitted('update:expanded')!.at(-1)).toEqual([[]])

    // On a closed node, Left is the way OUT — one level per press.
    const o = open({ expanded: ['src'] })
    await row(o, 'composables').trigger('keydown', { key: 'ArrowLeft' })
    await nextTick()
    expect(document.activeElement).toBe(row(o, 'src').element)
  })

  it('does nothing off the ends rather than wrapping', async () => {
    // A tree is a structure, not a ring: wrapping from the last leaf to
    // the root is a jump nobody asked for.
    const w = open()
    await row(w, 'readme').trigger('keydown', { key: 'ArrowLeft' })
    expect(w.emitted('update:expanded')).toBeUndefined()
  })
})

describe('moving through what is visible', () => {
  it('walks across levels, not within one', async () => {
    // Down from the last child of a group is the next group, not
    // nothing — the list the arrows walk is the visible rows.
    const w = open({ expanded: ['src'] })
    await row(w, 'composables').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(document.activeElement).toBe(row(w, 'tests').element)
  })

  it('stops at both ends', async () => {
    const w = open()
    await row(w, 'src').trigger('keydown', { key: 'ArrowUp' })
    await nextTick()
    expect(document.activeElement).toBe(row(w, 'src').element)
    await row(w, 'readme').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(document.activeElement).toBe(row(w, 'readme').element)
  })

  it('goes to the first and last visible row on Home and End', async () => {
    const w = open({ expanded: ['src', 'ui'] })
    await row(w, 'ui').trigger('keydown', { key: 'End' })
    await nextTick()
    expect(document.activeElement).toBe(row(w, 'readme').element)
    await row(w, 'readme').trigger('keydown', { key: 'Home' })
    await nextTick()
    expect(document.activeElement).toBe(row(w, 'src').element)
  })

  it('finds a node by typing its name', async () => {
    const w = open()
    await row(w, 'src').trigger('keydown', { key: 'r' })
    await nextTick()
    expect(document.activeElement).toBe(row(w, 'readme').element)
  })
})

describe('the star key', () => {
  it('opens every sibling at that level', async () => {
    // The one key in the pattern that does what a mouse would take a
    // dozen clicks to do.
    const w = open()
    await row(w, 'src').trigger('keydown', { key: '*' })
    expect(w.emitted('update:expanded')!.at(-1)!.at(0)).toEqual(['src', 'tests'])
  })

  it('leaves other levels alone', async () => {
    const w = open({ expanded: ['src'] })
    await row(w, 'ui').trigger('keydown', { key: '*' })
    // ui's siblings, not src's.
    expect(w.emitted('update:expanded')!.at(-1)!.at(0)).toEqual(['src', 'ui'])
  })
})

describe('choosing', () => {
  it('reports the node, not the id alone', async () => {
    const w = open()
    await row(w, 'readme').trigger('click')
    expect(w.emitted('select')![0]![0]).toMatchObject({ id: 'readme', label: 'README.md' })
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['readme'])
  })

  it('opens and chooses in one gesture on a row with children', async () => {
    // Half a row doing something different from the other half is a row
    // nobody can predict.
    const w = open()
    await row(w, 'src').trigger('click')
    expect(w.emitted('update:expanded')!.at(-1)).toEqual([['src']])
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['src'])
  })

  it('refuses a disabled node however it is reached', async () => {
    const w = mount(TreeView, {
      props: { items: [{ id: 'a', label: 'Locked', disabled: true }], label: 'Files' },
      attachTo: document.body
    })
    expect(w.find('[data-id="a"]').attributes('aria-disabled')).toBe('true')
    await w.find('[data-id="a"]').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('says so when there is nothing', () => {
    const w = mount(TreeView, { props: { items: [], label: 'Files' } })
    expect(w.find('.u-tv-empty').text()).toBe('Nothing here.')
    expect(rows(w)).toHaveLength(0)
  })
})
