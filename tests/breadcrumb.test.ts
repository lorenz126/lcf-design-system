import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Breadcrumb from '../ui/molecules/Breadcrumb.vue'

const trail = [
  { label: 'Home', to: '/' },
  { label: 'Projects', to: '/p' },
  { label: 'Framework', to: '/p/f' },
  { label: 'Components', to: '/p/f/c' },
  { label: 'Organisms', to: '/p/f/c/o' },
  { label: 'Sidebar' }
]

const open = (props: Record<string, unknown> = {}) =>
  mount(Breadcrumb, { props: { items: trail, ...props } })

const steps = (w: ReturnType<typeof open>) =>
  w.findAll('.u-bc-link, .u-bc-here, .u-bc-fold').map(e => e.text().trim() || 'fold')

describe('Breadcrumb', () => {
  it('folds the middle, keeping the root and where you are', () => {
    // The first crumb is the root and the last two are where you are and
    // what you are inside; everything between is what you can afford.
    expect(steps(open())).toEqual(['Home', 'fold', 'Organisms', 'Sidebar'])
  })

  it('unfolds, because a fold you cannot open is a hole in the trail', async () => {
    const w = open()
    await w.find('.u-bc-fold').trigger('click')
    expect(steps(w)).toEqual(trail.map(c => c.label))
    expect(w.find('.u-bc-fold').exists()).toBe(false)
  })

  it('leaves a short trail alone', () => {
    const w = open({ items: trail.slice(0, 3) })
    expect(w.find('.u-bc-fold').exists()).toBe(false)
    expect(steps(w)).toEqual(['Home', 'Projects', 'Framework'])
  })

  it('never folds when told not to', () => {
    expect(steps(open({ maxItems: 0 }))).toEqual(trail.map(c => c.label))
  })

  it('does not link to the page you are on', () => {
    // A link to the current page is a control that does nothing.
    const w = open({ maxItems: 0 })
    const last = w.find('.u-bc-here')
    expect(last.text()).toBe('Sidebar')
    expect(last.element.tagName).not.toBe('A')
    expect(last.attributes('aria-current')).toBe('page')
    expect(w.findAll('[aria-current="page"]')).toHaveLength(1)
  })

  it('does not link to it even when given somewhere to go', () => {
    const w = open({ items: [{ label: 'Home', to: '/' }, { label: 'Here', to: '/here' }] })
    expect(w.find('.u-bc-here').element.tagName).not.toBe('A')
  })

  it('hides the chevrons from anything that reads it aloud', () => {
    // The nesting is carried by the order; three chevrons read out add
    // nothing but three chevrons.
    const w = open({ maxItems: 0 })
    const seps = w.findAll('.u-bc-sep')
    expect(seps).toHaveLength(trail.length - 1)
    for (const s of seps) expect(s.attributes('aria-hidden')).toBe('true')
  })

  it('is a named list', () => {
    const w = open()
    expect(w.find('nav').attributes('aria-label')).toBe('Breadcrumb')
    expect(w.find('ol').exists()).toBe(true)
  })

  it('survives one crumb', () => {
    const w = open({ items: [{ label: 'Only' }] })
    expect(steps(w)).toEqual(['Only'])
    expect(w.findAll('.u-bc-sep')).toHaveLength(0)
  })
})
