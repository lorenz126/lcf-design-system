import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, defineComponent, effectScope, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import Icon from '../ui/atoms/Icon.vue'
import {
  _resetCommands, match, score, useCommandPalette, useCommands
} from '../composables/useCommands'
import CommandPalette from '../ui/molecules/CommandPalette.vue'

afterEach(() => _resetCommands())

const cmd = (id: string, label: string, extra: Record<string, unknown> = {}) =>
  ({ id, label, run: () => {}, ...extra })

describe('score', () => {
  it('wants every character, in order', () => {
    expect(score('nis', 'New Issue')).toBeGreaterThan(0)
    expect(score('sni', 'New Issue')).toBe(-1)
    expect(score('xyz', 'New Issue')).toBe(-1)
  })

  it('prefers word starts, because that is where an abbreviation lives', () => {
    // "ni" as the two initials beats "ni" buried inside a word.
    expect(score('ni', 'New Issue')).toBeGreaterThan(score('ni', 'Opening'))
  })

  it('prefers a run to the same letters scattered', () => {
    expect(score('iss', 'Issues')).toBeGreaterThan(score('iss', 'Invite Someone Soon'))
  })

  it('has nothing to say about an empty query', () => {
    expect(score('', 'anything')).toBe(0)
  })
})

describe('match', () => {
  it('lets a keyword find something the label does not say', () => {
    const c = cmd('a', 'Sign out', { keywords: ['logout', 'leave'] })
    expect(match('logout', c)!.cmd).toBe(c)
  })

  it('puts a label match above a keyword match, whatever the numbers say', () => {
    // A long keyword string can out-score a short label; tiers are why
    // that cannot matter.
    const named = cmd('a', 'Issues')
    const aliased = cmd('b', 'Something else entirely', { keywords: ['issues issues issues issues'] })
    expect(match('issues', named)!.tier).toBe(0)
    expect(match('issues', aliased)!.tier).toBe(1)
  })

  it('will not run a match across two keywords', () => {
    // Joined into one string, "theme dark light appearance" answers to
    // "kan" — the k of dark, then two letters of appearance — and a
    // theme switch turns up under a search for Kanban. Found in the
    // browser, on the real command list.
    const c = cmd('a', 'Switch to dark', { keywords: ['theme', 'dark', 'light', 'appearance'] })
    expect(match('kan', c)).toBeUndefined()
    expect(match('appear', c)!.tier).toBe(1)
  })

  it('says nothing at all when nothing matched', () => {
    expect(match('zzz', cmd('a', 'Issues'))).toBeUndefined()
  })
})

describe('the registry', () => {
  const Host = defineComponent({
    props: { items: { type: Array, required: true } },
    setup(p) {
      useCommands(() => p.items as never)
      return () => h('div')
    }
  })

  it('collects what is registered', () => {
    mount(Host, { props: { items: [cmd('a', 'One'), cmd('b', 'Two')] } })
    expect(useCommandPalette().all.value.map(c => c.id)).toEqual(['a', 'b'])
  })

  it('takes them away when the thing that owned them unmounts', () => {
    // The whole point: a page contributing "Close this issue" removes it
    // by being gone, with nothing to remember.
    const w = mount(Host, { props: { items: [cmd('a', 'One')] } })
    expect(useCommandPalette().all.value).toHaveLength(1)
    w.unmount()
    expect(useCommandPalette().all.value).toHaveLength(0)
  })

  it('follows a source that changes without re-registering', async () => {
    const list = ref([cmd('a', 'One')])
    const scope = effectScope()
    scope.run(() => useCommands(list))
    const { all } = useCommandPalette()
    expect(all.value).toHaveLength(1)
    list.value = [cmd('a', 'One'), cmd('b', 'Two')]
    expect(all.value).toHaveLength(2)
    scope.stop()
    expect(all.value).toHaveLength(0)
  })

  it('hands back an off() for callers with no scope to hang on', () => {
    const off = useCommands(() => [cmd('a', 'Always')])
    expect(useCommandPalette().all.value).toHaveLength(1)
    off()
    expect(useCommandPalette().all.value).toHaveLength(0)
  })

  it('lets a later registration win a duplicate id', () => {
    useCommands(() => [cmd('save', 'Save')])
    useCommands(() => [cmd('save', 'Save this page')])
    const all = useCommandPalette().all.value
    expect(all).toHaveLength(1)
    expect(all[0]!.label).toBe('Save this page')
  })
})

describe('sections', () => {
  it('groups as registered while there is no query', () => {
    useCommands(() => [
      cmd('a', 'Go home', { group: 'Navigation' }),
      cmd('b', 'New issue', { group: 'Issues' }),
      cmd('c', 'Loose end')
    ])
    const s = useCommandPalette().sections('')
    expect(s.map(g => g.label)).toEqual(['Navigation', 'Issues', undefined])
  })

  it('keeps the groups under a query, ordered by their best member', () => {
    // Flattening loses what kind of thing each row is; ordering groups
    // by anything but their best match buries the top result.
    useCommands(() => [
      cmd('a', 'Assign to someone', { group: 'Issues' }),
      cmd('b', 'Issues', { group: 'Navigation' })
    ])
    const s = useCommandPalette().sections('issues')
    expect(s[0]!.label).toBe('Navigation')
    expect(s[0]!.items[0]!.label).toBe('Issues')
  })

  it('puts what was last run on top, once', () => {
    useCommands(() => [cmd('a', 'One'), cmd('b', 'Two')])
    const p = useCommandPalette()
    p.ran('b')
    const s = p.sections('')
    expect(s[0]!.label).toBe('Recent')
    expect(s[0]!.items.map(c => c.id)).toEqual(['b'])
    // And not a second time further down.
    expect(s.slice(1).flatMap(g => g.items).map(c => c.id)).toEqual(['a'])
  })

  it('forgets a recent command whose page has gone', () => {
    const off = useCommands(() => [cmd('a', 'One')])
    const p = useCommandPalette()
    p.ran('a')
    off()
    expect(p.sections('')).toEqual([])
  })
})

describe('CommandPalette', () => {
  const open = async () => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.open = true })
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) { this.open = false })
    const w = mount(CommandPalette, { attachTo: document.body })
    useCommandPalette().show()
    await nextTick(); await nextTick()
    return w
  }

  it('renders nothing inside itself on the server', async () => {
    // useCommands does nothing without a window, so the registry is
    // knowably empty there — the server was rendering "No matching
    // commands." into a dialog nobody could see, and the client replaced
    // it with the list on its first breath. That was a hydration
    // mismatch on every page of every app that mounted this.
    useCommands(() => [cmd('a', 'One')])
    const app = createSSRApp(CommandPalette)
    app.component('UiIcon', Icon)
    const html = await renderToString(app)
    expect(html).toContain('<dialog')
    expect(html).not.toContain('u-cp-panel')
    expect(html).not.toContain('No matching commands')
  })

  it('opens on the shortcut and closes on the same press', async () => {
    const w = mount(CommandPalette, { attachTo: document.body })
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.open = true })
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) { this.open = false })
    dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await nextTick()
    expect(useCommandPalette().open.value).toBe(true)
    dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await nextTick()
    expect(useCommandPalette().open.value).toBe(false)
    w.unmount()
  })

  it('leaves the key alone when the app says it binds its own', async () => {
    mount(CommandPalette, { props: { shortcut: '' }, attachTo: document.body })
    dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await nextTick()
    expect(useCommandPalette().open.value).toBe(false)
  })

  it('keeps focus in the field and moves a highlight instead', async () => {
    useCommands(() => [cmd('a', 'One'), cmd('b', 'Two')])
    const w = await open()
    const input = w.find('input')
    expect(input.attributes('role')).toBe('combobox')
    const first = input.attributes('aria-activedescendant')
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).not.toBe(first)
    expect(w.findAll('[role="option"]')[1]!.attributes('aria-selected')).toBe('true')
  })

  it('wraps at the ends', async () => {
    useCommands(() => [cmd('a', 'One'), cmd('b', 'Two')])
    const w = await open()
    const input = w.find('input')
    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(w.findAll('[role="option"]')[1]!.attributes('aria-selected')).toBe('true')
  })

  it('runs after it has closed, not before', async () => {
    // Closing a <dialog> restores focus to whatever had it. A command
    // that opens something would lose it again straight away.
    const order: string[] = []
    useCommands(() => [cmd('a', 'One', { run: () => order.push(`run, open=${useCommandPalette().open.value}`) })])
    const w = await open()
    await w.find('[role="option"]').trigger('click')
    await nextTick(); await nextTick()
    expect(order).toEqual(['run, open=false'])
  })

  it('lists a disabled command and refuses to run it', async () => {
    const run = vi.fn()
    useCommands(() => [cmd('a', 'Locked', { disabled: true, run })])
    const w = await open()
    const row = w.find('[role="option"]')
    expect(row.attributes('aria-disabled')).toBe('true')
    await row.trigger('click')
    await nextTick()
    expect(run).not.toHaveBeenCalled()
  })

  it('starts empty every time it opens', async () => {
    useCommands(() => [cmd('a', 'One'), cmd('b', 'Two')])
    const w = await open()
    const input = w.find('input')
    await input.setValue('two')
    expect(w.findAll('[role="option"]')).toHaveLength(1)
    useCommandPalette().hide()
    await nextTick()
    useCommandPalette().show()
    await nextTick(); await nextTick()
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(w.findAll('[role="option"]')).toHaveLength(2)
  })

  it('says so when nothing matched, rather than showing an empty box', async () => {
    useCommands(() => [cmd('a', 'One')])
    const w = await open()
    await w.find('input').setValue('zzzz')
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    expect(w.find('.u-cp-empty').text()).toBe('No matching commands.')
  })

  it('puts the pointer and the keyboard on the same row', async () => {
    // Two highlights are two answers to "which one does Enter run".
    useCommands(() => [cmd('a', 'One'), cmd('b', 'Two')])
    const w = await open()
    await w.findAll('[role="option"]')[1]!.trigger('mousemove')
    expect(w.find('input').attributes('aria-activedescendant'))
      .toBe(w.findAll('[role="option"]')[1]!.attributes('id'))
  })
})
