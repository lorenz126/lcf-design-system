import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Pagination from '../ui/molecules/Pagination.vue'

/** The row as a reader sees it: "1 … 4 5 6 … 24". */
const row = (w: ReturnType<typeof mount>) =>
  w.findAll('.u-pg-n, .u-pg-gap').map(e => e.text()).join(' ')

const at = (page: number, total = 24, siblings?: number) =>
  mount(Pagination, { props: { modelValue: page, total, ...(siblings ? { siblings } : {}) } })

describe('Pagination', () => {
  it('keeps the window the same length wherever you are', () => {
    // The promise the component makes: the button under your pointer does
    // not change meaning between two clicks.
    const lengths = [1, 2, 5, 12, 20, 23, 24].map(p => row(at(p)).split(' ').length)
    expect(new Set(lengths).size).toBe(1)
  })

  it('puts the ellipsis where the sequence actually breaks', () => {
    expect(row(at(5))).toBe('1 … 4 5 6 … 24')
    expect(row(at(12))).toBe('1 … 11 12 13 … 24')
    // Near an end there is nothing to hide on that side, so the run
    // continues rather than eliding one number behind an ellipsis that
    // costs the same width.
    expect(row(at(1))).toBe('1 2 3 4 5 … 24')
    expect(row(at(24))).toBe('1 … 20 21 22 23 24')
  })

  it('lists every page when eliding would hide less than it costs', () => {
    expect(row(at(3, 7))).toBe('1 2 3 4 5 6 7')
  })

  it('widens with siblings', () => {
    expect(row(at(12, 24, 2))).toBe('1 … 10 11 12 13 14 … 24')
  })

  it('marks the current page and only the current page', () => {
    const w = at(5)
    const current = w.findAll('[aria-current="page"]')
    expect(current).toHaveLength(1)
    expect(current[0]!.text()).toBe('5')
  })

  it('will not step past either end', async () => {
    const first = at(1)
    expect(first.find('[aria-label="Previous page"]').attributes('disabled')).toBeDefined()
    await first.find('[aria-label="Previous page"]').trigger('click')
    expect(first.emitted('update:modelValue')).toBeUndefined()

    const last = at(24)
    expect(last.find('[aria-label="Next page"]').attributes('disabled')).toBeDefined()
  })

  it('reports a move once, through both channels', async () => {
    const w = at(5)
    await w.findAll('.u-pg-n').find(b => b.text() === '6')!.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[6]])
    expect(w.emitted('change')).toEqual([[6]])
  })

  it('says nothing when the click lands on the page you are on', async () => {
    const w = at(5)
    await w.find('[aria-current="page"]').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('change')).toBeUndefined()
  })

  it('survives a single page', () => {
    const w = at(1, 1)
    expect(row(w)).toBe('1')
    expect(w.find('[aria-label="Next page"]').attributes('disabled')).toBeDefined()
  })

  it('does not offer the ellipsis as a control', () => {
    const w = at(12)
    expect(w.findAll('.u-pg-gap').length).toBe(2)
    expect(w.findAll('button.u-pg-gap')).toHaveLength(0)
  })
})
