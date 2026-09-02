import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Toaster from '../ui/molecules/Toaster.vue'
import { useToast } from '../composables/useToast'

const { show, success, error, clear, dismiss, items } = useToast()

const open = (props: Record<string, unknown> = {}) =>
  mount(Toaster, { props, attachTo: document.body })

/* nextTick, not a setTimeout: fake timers stub setTimeout, and a flush
   that waits on the thing being faked never comes back. Vue's scheduler
   runs on microtasks, which they leave alone. */
const flush = async () => { await nextTick(); await nextTick() }
const rows = (w: ReturnType<typeof open>) => w.findAll('.u-tst-item')
const inRegion = (w: ReturnType<typeof open>, role: string) =>
  w.findAll(`[role="${role}"] .u-tst-item`).map(e => e.find('.u-tst-title').text())

beforeEach(() => { clear(); vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers(); clear() })

describe('Toaster', () => {
  it('mounts both regions before there is anything to say', () => {
    // A live region that arrives already holding text is usually not
    // announced at all. These are here from the start, and empty.
    const w = open()
    expect(w.find('[role="status"]').exists()).toBe(true)
    expect(w.find('[role="alert"]').exists()).toBe(true)
    expect(rows(w)).toHaveLength(0)
  })

  it('sends what interrupts to one region and what waits to the other', async () => {
    const w = open()
    success('Saved')
    error('Could not reach the server')
    show('Archived')
    await flush()
    expect(inRegion(w, 'status')).toEqual(['Saved', 'Archived'])
    expect(inRegion(w, 'alert')).toEqual(['Could not reach the server'])
  })

  it('lets go of a message on its own', async () => {
    const w = open()
    show({ title: 'Saved', duration: 1000 })
    await flush()
    expect(rows(w)).toHaveLength(1)
    vi.advanceTimersByTime(1200)
    await flush()
    expect(rows(w)).toHaveLength(0)
  })

  it('keeps one that asks to stay', async () => {
    const w = open()
    show({ title: 'Pinned', duration: 0 })
    await flush()
    vi.advanceTimersByTime(60_000)
    await flush()
    expect(rows(w)).toHaveLength(1)
  })

  it('stops every timer while the stack is hovered, not just one', async () => {
    // Reading the second message is a reason to keep the first.
    const w = open()
    show({ title: 'One', duration: 1000 })
    show({ title: 'Two', duration: 1000 })
    await flush()
    await w.find('.u-tst').trigger('pointerenter')
    vi.advanceTimersByTime(5000)
    await flush()
    expect(rows(w)).toHaveLength(2)

    await w.find('.u-tst').trigger('pointerleave')
    vi.advanceTimersByTime(1200)
    await flush()
    expect(rows(w)).toHaveLength(0)
  })

  it('stops them for focus too, so a keyboard can reach the dismiss', async () => {
    const w = open()
    show({ title: 'One', duration: 1000 })
    await flush()
    await w.find('.u-tst').trigger('focusin')
    vi.advanceTimersByTime(5000)
    await flush()
    expect(rows(w)).toHaveLength(1)
  })

  it('offers a way out that names what it is dismissing', async () => {
    const w = open()
    show('Saved')
    await flush()
    const x = w.find('.u-tst-x')
    expect(x.attributes('aria-label')).toBe('Dismiss: Saved')
    await x.trigger('click')
    await flush()
    expect(rows(w)).toHaveLength(0)
  })

  it('runs an action and then gets out of the way', async () => {
    const w = open()
    const undo = vi.fn()
    show({ title: 'Archived', action: { label: 'Undo', onClick: undo } })
    await flush()
    await w.find('.u-tst-do').trigger('click')
    await flush()
    expect(undo).toHaveBeenCalledOnce()
    expect(rows(w)).toHaveLength(0)
  })

  it('gives a message carrying an action longer to be read', () => {
    show('Plain')
    show({ title: 'With a way out', action: { label: 'Undo', onClick: () => {} } })
    // An action you have to race is not an action.
    expect(items.value[1]!.duration).toBeGreaterThan(items.value[0]!.duration)
  })

  it('drops a timer with the message it belonged to', async () => {
    // Dismissing early must not leave a timer that fires into an empty
    // queue, or a later toast with the same id would vanish with it.
    const w = open()
    const id = show({ title: 'One', duration: 1000 })
    await flush()
    dismiss(id)
    await flush()
    show({ title: 'Two', duration: 5000 })
    await flush()
    vi.advanceTimersByTime(1500)
    await flush()
    expect(rows(w)).toHaveLength(1)
    expect(rows(w)[0]!.text()).toContain('Two')
  })

  it('says nothing on a server, where nobody would see it', () => {
    // The queue is a module-level store, so a toast raised during SSR is
    // one that could arrive in somebody else's page.
    const w = window
    // @ts-expect-error — standing in for an environment without one.
    delete globalThis.window
    expect(show('Invisible')).toBe(-1)
    globalThis.window = w
    expect(items.value).toHaveLength(0)
  })
})
