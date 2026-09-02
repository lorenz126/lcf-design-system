import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import Sidebar from '../ui/organisms/Sidebar.vue'
import type { SidebarItem } from '../ui/organisms/Sidebar.vue'

const items: SidebarItem[] = [
  { label: 'Overview', to: '/' },
  { label: 'Settings', id: 'settings' },
  {
    label: 'Components',
    heading: 'Library',
    divider: true,
    badge: '2',
    children: [
      { label: 'Button', to: '/buttons' },
      { label: 'Icon', to: '/buttons' }
    ]
  },
  { label: 'Repository', to: 'https://example.com', external: true }
]

const open = (props: Record<string, unknown> = {}) =>
  mount(Sidebar, { props: { items, ...props }, attachTo: document.body })

const rows = (w: ReturnType<typeof open>) => w.findAll('.u-sb-row')
const labels = (w: ReturnType<typeof open>) => rows(w).map(r => r.text().trim())

/** Stands in for NuxtLink: anything that is not the string 'a'. */
const Link = defineComponent({
  props: { to: { type: String, default: '' } },
  setup: (p, { slots }) => () => h('a', { 'data-to': p.to }, slots.default?.())
})

describe('Sidebar', () => {
  it('opens the group the current page is in', () => {
    // A navigation that hides where you are is worse than one that shows
    // too much.
    const shut = open()
    expect(labels(shut)).not.toContain('Button')

    const w = open({ current: '/buttons' })
    expect(labels(w)).toContain('Button')
    expect(w.find('[aria-expanded="true"]').exists()).toBe(true)
  })

  it('marks every row the open page documents', () => {
    // Two atoms share one page here, and both are where you are.
    const w = open({ current: '/buttons' })
    expect(w.findAll('.u-sb-on').map(r => r.text().trim())).toEqual(['Button', 'Icon'])
  })

  it('matches by id when there is no route to match', () => {
    const w = open({ current: 'settings' })
    const on = w.findAll('.u-sb-on')
    expect(on).toHaveLength(1)
    expect(on[0]!.text().trim()).toBe('Settings')
    // "page" belongs to a link; a button that is merely current says so.
    expect(on[0]!.attributes('aria-current')).toBe('true')
  })

  it('renders a link as a link, and a row with nowhere to go as a button', () => {
    const w = open()
    expect(rows(w)[0]!.element.tagName).toBe('A')
    expect(rows(w)[0]!.attributes('href')).toBe('/')
    expect(rows(w)[1]!.element.tagName).toBe('BUTTON')
  })

  it('hands the router component `to`, not `href`', () => {
    // link="NuxtLink" as a STRING rendered a literal <nuxtlink> element
    // that looked right and could not be clicked. The prop takes the
    // component, and the component is given the prop it expects.
    const w = mount(Sidebar, { props: { items, link: Link } })
    const first = w.findAll('.u-sb-row')[0]!
    expect(first.attributes('data-to')).toBe('/')
    expect(first.attributes('href')).toBeUndefined()
  })

  it('sends an external row out of the app and says so', () => {
    const w = open()
    const ext = rows(w).find(r => r.text().includes('Repository'))!
    expect(ext.attributes('href')).toBe('https://example.com')
    expect(ext.attributes('target')).toBe('_blank')
    expect(ext.attributes('rel')).toContain('noreferrer')
  })

  it('reports a row with no destination rather than navigating', async () => {
    const w = open()
    await rows(w)[1]!.trigger('click')
    expect(w.emitted('select')![0]![0]).toMatchObject({ id: 'settings' })
  })

  /* In a rail the row carries no text at all, so the tooltip IS the
     label — which makes it the only way to identify a row, here and for
     anyone using one. */
  const rail = (w: ReturnType<typeof open>) =>
    w.findAll('.u-tt-anchor').map(a => ({
      label: a.find('[role="tooltip"]').text().trim(),
      row: a.find('.u-sb-row')
    }))

  it('collapses to top-level rows only, each one still identifiable', () => {
    const w = open({ current: '/buttons', collapsed: true })
    expect(rail(w).map(r => r.label)).toEqual([
      'Overview', 'Settings', 'Components', 'Repository'
    ])
    // The children are gone, and so is the heading: no room beside a
    // 22px icon for either.
    expect(labels(w).join(' ')).not.toContain('Button')
    expect(w.find('.u-sb-heading').exists()).toBe(false)
  })

  it('lets a collapsed group stand in for its children', () => {
    // Otherwise the rail highlights nothing at all on most pages, since
    // the row that matches is one the rail does not render.
    const w = open({ current: '/buttons', collapsed: true })
    const on = rail(w).filter(r => r.row.classes().includes('u-sb-on'))
    expect(on.map(r => r.label)).toEqual(['Components'])
  })

  it('asks for its width back rather than opening what cannot be seen', async () => {
    const w = open({ collapsed: true })
    const group = rail(w).find(r => r.label === 'Components')!.row
    await group.trigger('click')
    expect(w.emitted('expand')).toHaveLength(1)
    // And the group is already open for when the width arrives.
    await w.setProps({ collapsed: false })
    expect(labels(w)).toContain('Button')
  })

  it('opens every group while a filter is on', () => {
    const w = open({ expandAll: true })
    expect(labels(w)).toContain('Button')
  })

  it('says so when a filter leaves nothing', () => {
    const w = mount(Sidebar, { props: { items: [], emptyText: 'Nothing matches that.' } })
    expect(w.find('.u-sb-empty').text()).toBe('Nothing matches that.')
  })
})
