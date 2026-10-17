import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState, type ReactNode } from 'react'
import { LcfProvider } from '../i18n/context'
import { _resetAnnouncer } from './Field/announce'
import { Field } from './Field/Field'
import { Select, type SelectGroup, type SelectOption } from './Select/Select'
import * as SelectEntry from './Select/index'

const de = ({ children }: { children: ReactNode }) => <LcfProvider locale="de-CH">{children}</LcfProvider>
const fr = ({ children }: { children: ReactNode }) => <LcfProvider locale="fr-CH">{children}</LcfProvider>

const MARKETS: SelectOption[] = [
  { value: 'CH', label: 'Schweiz' },
  { value: 'DE', label: 'Deutschland' },
  { value: 'AT', label: 'Österreich' }
]
const LINES: SelectGroup[] = [
  { label: 'Decken', options: [{ value: 'tiles', label: 'Deckenplatten' }, { value: 'baffles', label: 'Baffeln' }] },
  { label: 'Möbel', disabled: true, options: [{ value: 'booths', label: 'Telefonkabinen' }, { value: 'screens', label: 'Tischwände' }] }
]

const region = () => document.querySelector('[data-lcf-announcer]')
const said = async () => {
  await act(() => new Promise(r => requestAnimationFrame(() => r(undefined))))
  return (region()?.textContent ?? '').replace(/\s+/g, ' ').trim()
}
const box = () => screen.getByRole<HTMLSelectElement>('combobox')
const shown = (s: HTMLSelectElement) => s.options[s.selectedIndex]?.text

afterEach(() => {
  _resetAnnouncer()
  vi.restoreAllMocks()
})

describe('Select: in a Field', () => {
  it('is a native select named by the label, with the Field\'s id and words', () => {
    render(<Field label="Markt" id="market" description="Preise folgen ihm."><Select options={MARKETS} /></Field>, { wrapper: de })
    const s = screen.getByRole('combobox', { name: 'Markt' })
    expect(s.tagName).toBe('SELECT')
    expect(s).toHaveAttribute('id', 'market')
    expect(s).toHaveAccessibleDescription('Preise folgen ihm.')
    expect(s).toHaveAttribute('aria-invalid', 'false')
  })

  it('required and empty: native required, data-empty on the box in the control slot, the word, and the caution edge', async () => {
    const user = userEvent.setup()
    render(<Field label="Markt" required><Select options={MARKETS} /></Field>, { wrapper: de })
    const s = box()
    expect(s).toBeRequired()
    const outer = document.querySelector('.lcf-field-control > .lcf-select')!
    expect(outer).toHaveAttribute('data-empty')
    expect(s.closest('.lcf-input')).toHaveAttribute('data-color', 'caution')
    expect(screen.getByText('Pflichtfeld')).toBeInTheDocument()
    expect(s.validity.valueMissing).toBe(true)
    await user.selectOptions(s, 'DE')
    expect(outer).not.toHaveAttribute('data-empty')
    expect(s.closest('.lcf-input')).not.toHaveAttribute('data-color')
    expect(s.validity.valid).toBe(true)
  })

  it('takes size, disabled and the error from the Field; className and style sit on its outer box, ref on the select', () => {
    let el: HTMLSelectElement | null = null
    const { rerender } = render(
      <Field label="Markt" size="sm" error="Falscher Markt."><Select options={MARKETS} className="mine" style={{ marginTop: 4 }} ref={e => { el = e }} /></Field>,
      { wrapper: de }
    )
    const s = box()
    expect(el).toBe(s)
    expect(s.closest('.lcf-input')).toHaveAttribute('data-size', 'sm')
    expect(s.closest('.lcf-input')).toHaveAttribute('data-color', 'danger')
    expect(s).toHaveAttribute('aria-invalid', 'true')
    expect(s.closest('.lcf-select')).toHaveClass('mine')
    expect(s.closest('.lcf-select')).toHaveStyle({ marginTop: '4px' })
    rerender(<Field label="Markt" disabled><Select options={MARKETS} /></Field>)
    expect(box()).toBeDisabled()
  })

  it('Enter confirms and never submits; on a required placeholder it refuses and says why', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onSubmit = vi.fn((e: { preventDefault(): void }) => e.preventDefault())
    const { unmount } = render(
      <form onSubmit={onSubmit}><Field label="Markt" required onConfirm={onConfirm}><Select options={MARKETS} /></Field></form>,
      { wrapper: de }
    )
    box().focus()
    await user.keyboard('{Enter}')
    expect(onConfirm).not.toHaveBeenCalled()
    expect(await said()).toBe('Markt: Pflichtfeld')
    unmount()
    render(<form onSubmit={onSubmit}><Field label="Markt" required onConfirm={onConfirm}><Select options={MARKETS} defaultValue="CH" /></Field></form>, { wrapper: de })
    box().focus()
    await user.keyboard('{Enter}')
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('Escape goes back to the suggestion; the review recipe works with a select as with a number', async () => {
    const user = userEvent.setup()
    function Review() {
      const [value, setValue] = useState<string | null>('CH')
      const [confirmed, setConfirmed] = useState(false)
      const at = value === 'CH'
      return (
        <Field
          label="Markt"
          state={confirmed ? 'confirmed' : at ? 'suggested' : undefined}
          suggestion="Schweiz"
          onConfirm={() => setConfirmed(true)}
          onRevert={!at && !confirmed ? () => setValue('CH') : undefined}
        >
          <Select options={MARKETS} value={value} onValueChange={v => { setValue(v); setConfirmed(false) }} />
        </Field>
      )
    }
    const { container } = render(<Review />, { wrapper: de })
    const field = container.querySelector('.lcf-field')!
    expect(field).toHaveAttribute('data-state', 'suggested')
    await user.selectOptions(box(), 'AT')
    expect(field).not.toHaveAttribute('data-state')
    expect(screen.getByRole('button', { name: 'Zurück zum Vorschlag: Schweiz' })).toBeInTheDocument()
    box().focus()
    await user.keyboard('{Escape}')
    expect(box()).toHaveValue('CH')
    expect(field).toHaveAttribute('data-state', 'suggested')
    expect(box()).toHaveFocus()
    expect(await said()).toBe('Vorschlag.')
    await user.keyboard('{Enter}')
    expect(field).toHaveAttribute('data-state', 'confirmed')
    expect(await said()).toBe('Bestätigt.')
  })

  it('warns about an id, required or readOnly set on it inside a Field, and about no name bare', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { unmount } = render(<Field label="Markt" id="m"><Select id="mine" required readOnly options={MARKETS} /></Field>)
    expect(box()).toHaveAttribute('id', 'm')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ignored'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('required, readOnly on a control inside a Field'))
    unmount()
    warn.mockClear()
    render(<Select options={MARKETS} />)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Select has no name'))
  })
})

describe('Select: nothing is chosen until somebody chooses', () => {
  it('starts on the placeholder, value \'\', in the table\'s words marked with their language', () => {
    render(<Select aria-label="Markt" options={MARKETS} />, { wrapper: de })
    const s = box()
    expect(s.value).toBe('')
    expect(s.options[0]).toHaveTextContent('Bitte wählen…')
    expect(s.options[0]).toHaveAttribute('lang', 'de-CH')
    expect(s.closest('.lcf-select')).toHaveAttribute('data-empty')
  })

  it('the table falls back to English, and says so; the app\'s own placeholder is not marked', () => {
    const { rerender } = render(<Select aria-label="Marché" options={MARKETS} />, { wrapper: fr })
    expect(box().options[0]).toHaveTextContent('Choose…')
    expect(box().options[0]).toHaveAttribute('lang', 'en')
    rerender(<Select aria-label="Marché" options={MARKETS} placeholder="Marché à choisir" />)
    expect(box().options[0]).toHaveTextContent('Marché à choisir')
    expect(box().options[0]).not.toHaveAttribute('lang')
  })

  it('required: the placeholder cannot be chosen again; optional: choosing it takes the choice back as null', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = render(<Select aria-label="Markt" required options={MARKETS} defaultValue="DE" />)
    expect(box().options[0]).toBeDisabled()
    rerender(<Select aria-label="Markt" options={MARKETS} defaultValue="DE" onValueChange={onValueChange} />)
    expect(box().options[0]).toBeEnabled()
    await user.selectOptions(box(), '')
    expect(onValueChange).toHaveBeenCalledWith(null)
    expect(box().closest('.lcf-select')).toHaveAttribute('data-empty')
  })

  it('a required select left alone stops its form, and an optional one posts nothing chosen as \'\'', () => {
    render(
      <>
        <form id="a"><Select aria-label="Markt" name="m" required options={MARKETS} /></form>
        <form id="b"><Select aria-label="Zweitmarkt" name="m2" options={MARKETS} /></form>
      </>
    )
    expect((document.getElementById('a') as HTMLFormElement).checkValidity()).toBe(false)
    expect(new FormData(document.getElementById('b') as HTMLFormElement).get('m2')).toBe('')
  })
})

describe('Select: values', () => {
  it('emits the option\'s value on a choice, once, with the native change too', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const onChange = vi.fn()
    render(<Select aria-label="Markt" options={MARKETS} onValueChange={onValueChange} onChange={onChange} />)
    await user.selectOptions(box(), 'AT')
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('AT')
    expect(onChange).toHaveBeenCalledOnce()
    expect(shown(box())).toBe('Österreich')
  })

  it('controlled: the box follows the value, and a choice the app rejects is shown as rejected', async () => {
    const user = userEvent.setup()
    function App() {
      const [v, setV] = useState<string | null>('CH')
      return (
        <>
          <Select aria-label="Markt" options={MARKETS} value={v} onValueChange={n => n !== 'AT' && setV(n)} />
          <button type="button" onClick={() => setV('DE')}>DE</button>
        </>
      )
    }
    render(<App />)
    await user.selectOptions(box(), 'AT')
    expect(box()).toHaveValue('CH')
    await user.click(screen.getByRole('button', { name: 'DE' }))
    expect(box()).toHaveValue('DE')
  })

  it('groups are optgroups; a disabled group\'s options cannot be chosen', () => {
    render(<Select aria-label="Linie" options={LINES} />)
    const groups = document.querySelectorAll('optgroup')
    expect([...groups].map(g => g.label)).toEqual(['Decken', 'Möbel'])
    expect(groups[1]).toBeDisabled()
    expect(screen.getByRole('option', { name: 'Baffeln' })).toBeEnabled()
  })

  it('a form reset puts an uncontrolled select back to its default, and a controlled one stays the app\'s', async () => {
    const user = userEvent.setup()
    render(
      <form>
        <Select aria-label="Markt" name="m" options={MARKETS} defaultValue="DE" />
        <Select aria-label="Linie" name="l" options={LINES} value="tiles" onValueChange={() => {}} />
        <button type="reset">Reset</button>
      </form>
    )
    const [market, line] = screen.getAllByRole<HTMLSelectElement>('combobox')
    await user.selectOptions(market!, 'AT')
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() => expect(market).toHaveValue('DE'))
    expect(line).toHaveValue('tiles')
  })

  it('warns about an option whose value is \'\'', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<Select aria-label="Markt" options={[{ value: '', label: 'Keiner' }, ...MARKETS]} />)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("the value ''"))
  })

  it('is public, with its types', () => {
    expect(SelectEntry.Select).toBe(Select)
  })
})

describe('Select: a value the list does not offer', () => {
  it('is shown as itself — never as the first option — called wrong, and posted', () => {
    render(
      <form>
        <Field label="Markt" id="m"><Select name="market" options={MARKETS} defaultValue="LI" /></Field>
      </form>,
      { wrapper: de }
    )
    const s = box()
    expect(s.value).toBe('LI')
    expect(shown(s)).toBe('LI')
    expect(s).toHaveAttribute('aria-invalid', 'true')
    expect(s.closest('.lcf-input')).toHaveAttribute('data-color', 'danger')
    expect(s.validity.customError).toBe(true)
    expect(s.validationMessage).toBe('Steht nicht zur Auswahl.')
    expect(s).toHaveAttribute('aria-describedby', 'm-problem')
    expect(document.getElementById('m-problem')).toHaveAttribute('lang', 'de-CH')
    expect(new FormData(s.form!).get('market')).toBe('LI')
  })

  it('a value whose option is disabled stays chosen, enabled while chosen so it is posted, and is called wrong', async () => {
    const user = userEvent.setup()
    render(<form><Select aria-label="Linie" name="line" options={LINES} defaultValue="booths" /></form>, { wrapper: de })
    const s = box()
    expect(shown(s)).toBe('Telefonkabinen')
    expect(screen.getByRole('option', { name: 'Telefonkabinen' })).toBeEnabled()
    expect(screen.getByRole('option', { name: 'Tischwände' })).toBeDisabled()
    expect(new FormData(s.form!).get('line')).toBe('booths')
    expect(screen.getByText('Steht nicht zur Auswahl.')).toBeInTheDocument()
    await user.selectOptions(s, 'tiles')
    expect(screen.queryByText('Steht nicht zur Auswahl.')).toBeNull()
    expect(s.validity.valid).toBe(true)
    expect(screen.getByRole('option', { name: 'Telefonkabinen' })).toBeDisabled()
  })

  it('a Field\'s confirm refuses it, and says why', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Field label="Markt" onConfirm={onConfirm}><Select options={MARKETS} defaultValue="LI" /></Field>, { wrapper: de })
    box().focus()
    await user.keyboard('{Enter}')
    expect(onConfirm).not.toHaveBeenCalled()
    expect(await said()).toBe('Markt: Steht nicht zur Auswahl.')
  })
})

describe('Select: read-only and disabled', () => {
  it('read-only renders only the choice: focusable, posted, aria-readonly, no chevron', () => {
    const { container } = render(
      <form><Field label="Markt" readOnly><Select name="m" options={MARKETS} defaultValue="AT" /></Field></form>,
      { wrapper: de }
    )
    const s = box()
    expect(s.options).toHaveLength(1)
    expect(shown(s)).toBe('Österreich')
    expect(s).toHaveAttribute('aria-readonly', 'true')
    expect(s).toBeEnabled()
    expect(new FormData(s.form!).get('m')).toBe('AT')
    expect(container.querySelector('.lcf-select-chevron')).toBeNull()
    expect(s.closest('.lcf-input')).toHaveAttribute('data-readonly')
  })

  it('disabled is native: not posted', () => {
    render(<form><Field label="Markt" disabled><Select name="m" options={MARKETS} defaultValue="AT" /></Field></form>)
    expect(box()).toBeDisabled()
    expect(new FormData(box().form!).get('m')).toBeNull()
  })
})
