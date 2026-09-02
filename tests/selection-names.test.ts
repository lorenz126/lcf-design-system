import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Checkbox from '../ui/atoms/Checkbox.vue'
import Radio from '../ui/atoms/Radio.vue'
import List from '../ui/organisms/List.vue'
import Table from '../ui/organisms/Table.vue'

/**
 * A sweep of all forty-seven pages counted the interactive elements with
 * no accessible name and found a column of them: every row checkbox in
 * List and in Table announced as "checkbox", four times, with nothing
 * saying which row.
 */

const ROWS = [
  { id: 'a', name: 'api-gateway', env: 'production' },
  { id: 'b', name: 'billing-worker', env: 'staging' }
]
const COLUMNS = [{ key: 'name', label: 'Service' }, { key: 'env', label: 'Environment' }]
const ITEMS = [
  { id: 1, label: 'api-gateway', description: 'Deployed' },
  { id: 2, label: 'billing-worker', description: 'Degraded' }
]

describe('an attribute belongs to the control, not to the box around it', () => {
  it('puts an aria-label on the input rather than on the wrapper', () => {
    // Vue's default is the root element, which here is a div — so the
    // label named nothing, and no caller could fix it from outside.
    const w = mount(Checkbox, { attrs: { 'aria-label': 'Select api-gateway' } })
    expect(w.find('input').attributes('aria-label')).toBe('Select api-gateway')
    expect(w.find('.u-row').attributes('aria-label')).toBeUndefined()
  })

  it('does the same for a radio', () => {
    const w = mount(Radio, { props: { name: 'g', value: 'a' }, attrs: { 'aria-label': 'One' } })
    expect(w.find('input').attributes('aria-label')).toBe('One')
  })

  it('carries a name attribute to where a form can see it', () => {
    const w = mount(Checkbox, { attrs: { name: 'terms', required: true } })
    expect(w.find('input').attributes('name')).toBe('terms')
    expect(w.find('input').attributes('required')).toBeDefined()
  })
})

describe('Table names its selection', () => {
  const open = () => mount(Table, { props: { columns: COLUMNS, rows: ROWS, selectable: true } })

  it('names each row‘s box by that row‘s first cell', () => {
    // Pointing at the cell rather than building "Select " + name: the
    // name is then what the cell actually says, in whatever markup the
    // caller rendered, and it is not an English sentence invented for a
    // table that might be in German.
    const w = open()
    const boxes = w.findAll('tbody input[type="checkbox"]')
    expect(boxes).toHaveLength(2)
    for (const [i, box] of boxes.entries()) {
      const target = box.attributes('aria-labelledby')!
      expect(target).toBeTruthy()
      expect(w.find(`#${target}`).text()).toBe(ROWS[i]!.name)
    }
  })

  it('names the header box, which has no row to take one from', () => {
    expect(open().find('thead input[type="checkbox"]').attributes('aria-label'))
      .toBe('Select all rows')
  })

  it('lets the page say it in its own words', () => {
    const w = mount(Table, {
      props: { columns: COLUMNS, rows: ROWS, selectable: true, selectAllLabel: 'Alle auswählen' }
    })
    expect(w.find('thead input').attributes('aria-label')).toBe('Alle auswählen')
  })

  it('puts the id on the first column only', () => {
    // Two cells with one id is worse than none: aria-labelledby resolves
    // to whichever the parser saw first.
    const w = open()
    const withId = w.findAll('tbody td').filter(td => td.attributes('id'))
    expect(withId).toHaveLength(2)
    expect(withId.map(td => td.text())).toEqual(['api-gateway', 'billing-worker'])
  })
})

describe('List names its selection', () => {
  it('names each box by the row it is on', () => {
    const w = mount(List, { props: { items: ITEMS, select: 'multiple' } })
    const boxes = w.findAll('input[type="checkbox"]')
    expect(boxes).toHaveLength(2)
    for (const [i, box] of boxes.entries()) {
      const target = box.attributes('aria-labelledby')!
      expect(w.find(`#${target}`).text()).toBe(ITEMS[i]!.label)
    }
  })

  it('does the same when the rows are radios', () => {
    const w = mount(List, { props: { items: ITEMS, select: 'single' } })
    const target = w.find('input[type="radio"]').attributes('aria-labelledby')!
    expect(w.find(`#${target}`).text()).toBe('api-gateway')
  })
})
