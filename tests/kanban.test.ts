import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { _resetAnnouncer } from '../composables/useAnnounce'
import Kanban from '../ui/organisms/Kanban.vue'
import type { KanbanColumn } from '../ui/organisms/Kanban.vue'

const board = (): KanbanColumn[] => [
  { id: 'todo', label: 'Todo', cards: [{ id: 'a', title: 'Alpha' }, { id: 'b', title: 'Bravo' }] },
  { id: 'doing', label: 'Doing', limit: 1, cards: [{ id: 'c', title: 'Charlie' }] },
  { id: 'done', label: 'Done', cards: [] }
]

/**
 * A real parent, binding a real v-model.
 *
 * This matters more than it looks: defineModel only applies a write
 * locally when the parent has NOT bound one, so mounting Kanban on its
 * own would quietly test the easy case and miss the whole class of bug
 * where a second keypress plans its move against a board one render old.
 */
const Host = defineComponent({
  setup() {
    const cols = ref(board())
    const moves = ref<unknown[]>([])
    return { cols, moves }
  },
  render() {
    return h(Kanban, {
      modelValue: this.cols,
      'onUpdate:modelValue': (v: KanbanColumn[]) => { this.cols = v },
      onMove: (e: unknown) => this.moves.push(e)
    })
  }
})

const open = () => mount(Host, { attachTo: document.body })
afterEach(() => { _resetAnnouncer(); document.body.innerHTML = '' })

const layout = (w: ReturnType<typeof open>) =>
  w.findAll('[data-col]').map(c => c.findAll('.u-kb-title').map(t => t.text()))

const handle = (w: ReturnType<typeof open>, id: string) => w.find(`[data-handle="${id}"]`)

async function key(w: ReturnType<typeof open>, id: string, k: string) {
  await handle(w, id).trigger('keydown', { key: k })
  // Two ticks: one for the re-render, one for the frame the announcement
  // waits out.
  await new Promise(r => requestAnimationFrame(() => r(null)))
  await new Promise(r => setTimeout(r, 0))
}

/* The announcement no longer lives in the component's template:
   useAnnounce keeps one region on the document, and fills it a frame
   later so that repeating a sentence still counts as a change. */
const said = () => document.querySelector('[aria-live="polite"]')?.textContent ?? ''

describe('Kanban', () => {
  it('picks up and puts down, and says which', async () => {
    const w = open()
    await key(w, 'a', 'Enter')
    expect(handle(w, 'a').attributes('aria-pressed')).toBe('true')
    expect(said()).toContain('Picked up Alpha, Todo, 1 of 2')
    await key(w, 'a', 'Enter')
    expect(handle(w, 'a').attributes('aria-pressed')).toBe('false')
    expect(said()).toContain('Dropped.')
  })

  it('moves between columns and within one', async () => {
    const w = open()
    await key(w, 'a', 'Enter')
    await key(w, 'a', 'ArrowRight')
    expect(layout(w)).toEqual([['Bravo'], ['Alpha', 'Charlie'], []])
    await key(w, 'a', 'ArrowDown')
    expect(layout(w)).toEqual([['Bravo'], ['Charlie', 'Alpha'], []])
  })

  it('plans the second move against the board the first one made', async () => {
    // Two presses inside one frame, the way a held arrow key arrives.
    // Reading the model back in the same tick returns the board as it
    // was BEFORE the first move, and the card lands one column short.
    const w = open()
    await key(w, 'a', 'Enter')
    handle(w, 'a').trigger('keydown', { key: 'ArrowRight' })
    handle(w, 'a').trigger('keydown', { key: 'ArrowRight' })
    await new Promise(r => setTimeout(r, 0))
    expect(layout(w)).toEqual([['Bravo'], ['Charlie'], ['Alpha']])
  })

  it('goes no further than the ends', async () => {
    const w = open()
    await key(w, 'a', 'Enter')
    await key(w, 'a', 'ArrowLeft')
    await key(w, 'a', 'ArrowUp')
    expect(layout(w)).toEqual([['Alpha', 'Bravo'], ['Charlie'], []])
    expect(w.vm.moves).toHaveLength(0)
  })

  it('puts it back on Escape, wherever it got to', async () => {
    const w = open()
    await key(w, 'a', 'Enter')
    await key(w, 'a', 'ArrowRight')
    await key(w, 'a', 'ArrowRight')
    await key(w, 'a', 'ArrowDown')
    await key(w, 'a', 'Escape')
    expect(layout(w)).toEqual([['Alpha', 'Bravo'], ['Charlie'], []])
    expect(said()).toContain('Cancelled.')
    expect(handle(w, 'a').attributes('aria-pressed')).toBe('false')
  })

  it('takes a stale grab over rather than going deaf', async () => {
    // A grab that outlives its focus once left a board where no other
    // card answered Enter — a mode nobody could see and nothing cleared.
    const w = open()
    await key(w, 'a', 'Enter')
    await key(w, 'c', 'Enter')
    expect(handle(w, 'a').attributes('aria-pressed')).toBe('false')
    expect(handle(w, 'c').attributes('aria-pressed')).toBe('true')
    // Left keeps the index it had, which was the top of its column.
    await key(w, 'c', 'ArrowLeft')
    expect(layout(w)).toEqual([['Charlie', 'Alpha', 'Bravo'], [], []])
  })

  it('ignores arrows on a card it is not holding', async () => {
    const w = open()
    await key(w, 'a', 'ArrowRight')
    expect(layout(w)).toEqual([['Alpha', 'Bravo'], ['Charlie'], []])
  })

  it('reports each move once, with where it came from and went', async () => {
    const w = open()
    await key(w, 'a', 'Enter')
    await key(w, 'a', 'ArrowRight')
    expect(w.vm.moves).toHaveLength(1)
    expect(w.vm.moves[0]).toMatchObject({ from: 'todo', to: 'doing', index: 0 })
  })

  it('shows a work-in-progress limit and does not enforce it', async () => {
    // Refusing the drop does not reduce work in progress; it moves the
    // lie off the board.
    const w = open()
    await key(w, 'a', 'Enter')
    await key(w, 'a', 'ArrowRight')
    expect(layout(w)[1]).toEqual(['Alpha', 'Charlie'])
    const count = w.findAll('.u-kb-count')[1]!
    expect(count.text()).toBe('2/1')
    expect(count.classes()).toContain('u-kb-over')
  })

  it('keeps the handle focused across a move into another column', async () => {
    const w = open()
    ;(handle(w, 'a').element as HTMLElement).focus()
    await key(w, 'a', 'Enter')
    await key(w, 'a', 'ArrowRight')
    expect(document.activeElement).toBe(handle(w, 'a').element)
  })
})
