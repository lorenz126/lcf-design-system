import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState, type ReactNode } from 'react'
import { LcfProvider } from '../i18n/context'
import { Alert } from './Alert/Alert'
import { _resetAnnouncer } from './Field/announce'
import { useField } from './Field/context'
import { Field } from './Field/Field'
import { joinIds } from './Field/ids'
import { Input } from './Input/Input'
import { NumberField } from './NumberField/NumberField'
import { Spinner } from './Spinner/Spinner'

const provider = (locale: string) => ({ children }: { children: ReactNode }) => <LcfProvider locale={locale}>{children}</LcfProvider>
const de = provider('de-CH')
const at = provider('de-AT')
const en = provider('en-GB')
const fr = provider('fr-CH')

/* Text as it is heard: the formatter writes a no-break space between a
   number and its unit. */
const flat = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim()
const region = () => document.querySelector('[data-lcf-announcer]')
const frame = () => new Promise(r => requestAnimationFrame(() => r(undefined)))
const said = async () => {
  await act(frame)
  return flat(region()?.textContent)
}

afterEach(() => {
  _resetAnnouncer()
  vi.restoreAllMocks()
})

/* A native select, wired by the contract alone: what Select, Textarea
   and Combobox will do, and what an app's own control can do today. */
function NativeSelect({ children }: { children: ReactNode }) {
  const f = useField()
  const [v, setV] = useState('')
  return (
    <span className="lcf-input" data-empty={v === '' || undefined}>
      <select id={f?.id} aria-describedby={f?.describedBy} required={f?.required} value={v} onChange={e => setV(e.target.value)}>
        {children}
      </select>
    </span>
  )
}

function Textarea() {
  const f = useField()
  return <textarea id={f?.id} aria-describedby={f?.describedBy} />
}

describe('Field: ids and naming', () => {
  it('points its label at the control, gives two fields two ids, and lets its id prop win', () => {
    render(<><Field label="Ort"><Input /></Field><Field label="Fläche" id="area"><Input /></Field></>)
    const a = screen.getByRole('textbox', { name: 'Ort' })
    const b = screen.getByRole('textbox', { name: 'Fläche' })
    expect(a.id).not.toBe(b.id)
    expect(b.id).toBe('area')
    expect(screen.getByText('Ort').closest('label')).toHaveAttribute('for', a.id)
  })

  it('ignores an id given to the control inside a Field, and says so', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<Field label="Ort" id="place"><Input id="mine" /></Field>)
    expect(screen.getByRole('textbox', { name: 'Ort' })).toHaveAttribute('id', 'place')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ignored'))
  })

  it('names a NumberField with its unit: "Fläche Quadratmeter"', () => {
    render(<Field label="Fläche" required><NumberField unit="m2" /></Field>, { wrapper: de })
    expect(screen.getByRole('textbox', { name: 'Fläche Quadratmeter' })).toBeInTheDocument()
  })

  it('hideLabel keeps the name, and the marks and actions stay visible', () => {
    render(
      <Field label="Fläche" hideLabel origin="assumed" onConfirm={() => {}} state="suggested">
        <Input defaultValue="118" />
      </Field>,
      { wrapper: de }
    )
    expect(screen.getByRole('textbox', { name: 'Fläche' })).toBeInTheDocument()
    expect(screen.getByText('Fläche')).toHaveClass('lcf-sr-only')
    const confirm = screen.getByRole('button', { name: 'Bestätigen' })
    expect(confirm.closest('.lcf-sr-only')).toBeNull()
    expect(screen.getByText('Angenommen').closest('.lcf-sr-only')).toBeNull()
  })
})

describe('Field: descriptions and errors', () => {
  it('describes the control in one order: own problem, the app\'s ids, error, state, keys, origin, hint, description', () => {
    render(
      <>
        <Field
          id="area"
          label="Fläche"
          error="Zu gross für das Objekt."
          state="suggested"
          onConfirm={() => {}}
          origin={{ source: 'customer', via: 'email' }}
          hint="Preistreiber"
          description="Netto gemäss Plan."
        >
          <NumberField unit="m2" max={100} defaultValue={118.5} aria-describedby="extra" />
        </Field>
        <p id="extra">Siehe Plan.</p>
      </>,
      { wrapper: de }
    )
    const box = screen.getByRole('textbox', { name: 'Fläche Quadratmeter' })
    expect(box).toHaveAttribute('aria-describedby', 'area-problem extra area-error area-state area-keys area-origin area-hint area-help')
    expect(box).toHaveAccessibleDescription(
      /^Höchstens 100\sm²\. Siehe Plan\. Zu gross für das Objekt\. Vorschlag\. Enter bestätigt\. Herkunft: Kunde per E-Mail\. Preistreiber\. Netto gemäss Plan\.$/
    )
  })

  it('shows the error AND the description, error first; the error makes the control invalid', () => {
    render(<Field label="E-Mail" error="Keine Adresse." description="Für die Offerte."><Input /></Field>)
    const box = screen.getByRole('textbox')
    expect(box).toHaveAttribute('aria-invalid', 'true')
    expect(box.closest('.lcf-input')).toHaveAttribute('data-color', 'danger')
    const [first, second] = [...document.querySelectorAll('.lcf-field-msg')].map(e => e.textContent)
    expect([first, second]).toEqual(['Keine Adresse.', 'Für die Offerte.'])
  })

  it('error={true} and error="" make nothing invalid, and true warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { rerender } = render(<Field label="A" error={true}><Input /></Field>)
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('never invalid without words'))
    rerender(<Field label="A" error=""><Input /></Field>)
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid')
  })
})

describe('Field: required and empty', () => {
  it('is native required, with an aria-hidden asterisk and the word, marked with its language', () => {
    render(<Field label="Kontakt" required><Input /></Field>, { wrapper: de })
    const box = screen.getByRole('textbox', { name: 'Kontakt' })
    expect(box).toBeRequired()
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true')
    const word = screen.getByText('Pflichtfeld')
    expect(word).toHaveAttribute('lang', 'de-CH')
    expect(word).toHaveAttribute('aria-hidden', 'true')
    expect(box.closest('.lcf-input')).toHaveAttribute('data-color', 'caution')
  })

  it('stamps data-empty while empty — uncontrolled, after typing, and after a form reset', async () => {
    const user = userEvent.setup()
    render(<form><Field label="Kontakt" required><Input /></Field><button type="reset">Reset</button></form>)
    const box = screen.getByRole('textbox')
    const frame = box.closest('.lcf-input')!
    expect(frame).toHaveAttribute('data-empty')
    await user.type(box, 'Anna')
    expect(frame).not.toHaveAttribute('data-empty')
    expect(frame).not.toHaveAttribute('data-color')
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() => expect(frame).toHaveAttribute('data-empty'))
  })

  it('stamps data-empty from a controlled value, and whitespace is not empty (native required agrees)', () => {
    const { rerender } = render(<Field label="Kontakt" required><Input value="" onChange={() => {}} /></Field>)
    const frame = screen.getByRole('textbox').closest('.lcf-input')!
    expect(frame).toHaveAttribute('data-empty')
    rerender(<Field label="Kontakt" required><Input value=" " onChange={() => {}} /></Field>)
    expect(frame).not.toHaveAttribute('data-empty')
  })
})

describe('Field: states', () => {
  it('says "Vorschlag." when suggested, and "Enter bestätigt." when Enter does', () => {
    const { container } = render(
      <Field label="Fläche" state="suggested" onConfirm={() => {}}><Input defaultValue="118" /></Field>,
      { wrapper: de }
    )
    expect(container.firstChild).toHaveAttribute('data-state', 'suggested')
    const box = screen.getByRole('textbox')
    expect(box).toHaveAccessibleDescription('Vorschlag. Enter bestätigt.')
    expect(document.getElementById(`${box.id}-state`)).toHaveAttribute('lang', 'de-CH')
    expect(document.getElementById(`${box.id}-keys`)).toHaveAttribute('lang', 'de-CH')
  })

  it('says "Bestätigt." when confirmed, and the suggestion when edited away from it', () => {
    const { rerender } = render(<Field label="Fläche" state="confirmed"><Input defaultValue="118" /></Field>, { wrapper: de })
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Bestätigt.')
    rerender(<Field label="Fläche" suggestion="118 m²"><Input defaultValue="120" /></Field>)
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Vorschlag: 118 m².')
  })
})

describe('Field: Enter', () => {
  it('confirms in a confirmable field and never submits', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onSubmit = vi.fn((e: { preventDefault(): void }) => e.preventDefault())
    render(<form onSubmit={onSubmit}><Field label="Fläche" onConfirm={onConfirm}><Input defaultValue="118" /></Field></form>)
    await user.type(screen.getByRole('textbox'), '{Enter}')
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('is native in a field without onConfirm: it submits', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((e: { preventDefault(): void }) => e.preventDefault())
    render(<form onSubmit={onSubmit}><Field label="Fläche"><Input defaultValue="118" /></Field></form>)
    await user.type(screen.getByRole('textbox'), '{Enter}')
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('is left alone when already handled, while composing, with a modifier, and in a textarea', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const { rerender } = render(
      <Field label="Fläche" onConfirm={onConfirm}><Input onKeyDown={e => e.key === 'Enter' && e.preventDefault()} /></Field>
    )
    await user.type(screen.getByRole('textbox'), '{Enter}')
    rerender(<Field label="Fläche" onConfirm={onConfirm}><Input /></Field>)
    const box = screen.getByRole('textbox')
    fireEvent.keyDown(box, { key: 'Enter', isComposing: true })
    fireEvent.keyDown(box, { key: 'Enter', keyCode: 229 })
    await user.type(box, '{Shift>}{Enter}{/Shift}')
    rerender(<Field label="Notiz" onConfirm={onConfirm}><Textarea /></Field>)
    await user.type(screen.getByRole('textbox'), '{Enter}')
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('commits the number before it confirms', async () => {
    const user = userEvent.setup()
    const order: string[] = []
    render(
      <Field label="Fläche" onConfirm={() => order.push('confirm')}>
        <NumberField unit="m2" onValueChange={v => order.push(`value ${v}`)} />
      </Field>,
      { wrapper: de }
    )
    await user.type(screen.getByRole('textbox'), '120{Enter}')
    expect(order).toEqual(['value 120', 'confirm'])
  })

  it('neither confirms nor submits on text NumberField cannot read', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onSubmit = vi.fn((e: { preventDefault(): void }) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Field label="Fläche" onConfirm={onConfirm}><NumberField unit="m2" /></Field>
      </form>,
      { wrapper: de }
    )
    await user.type(screen.getByRole('textbox'), 'abc{Enter}')
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox')).toHaveValue('abc')
  })
})

describe('Field: ✓ and ↺', () => {
  it('✓ is for the pointer: out of the Tab order, named "Bestätigen"', () => {
    render(<Field label="Fläche" onConfirm={() => {}}><Input /></Field>, { wrapper: de })
    const confirm = screen.getByRole('button', { name: 'Bestätigen' })
    expect(confirm).toHaveAttribute('tabindex', '-1')
    expect(confirm).toHaveAttribute('lang', 'de-CH')
  })

  it('↺ is tabbable, sits before the control, says what it goes back to, and is described by the label', () => {
    render(<Field label="Fläche" suggestion="118 m²" onRevert={() => {}}><Input defaultValue="120" /></Field>, { wrapper: de })
    const revert = screen.getByRole('button', { name: 'Zurück zum Vorschlag: 118 m²' })
    const box = screen.getByRole('textbox')
    expect(revert.tabIndex).toBe(0)
    expect(revert.compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(revert).toHaveAccessibleDescription('Fläche')
    expect(revert).toHaveAttribute('lang', 'de-CH')
  })

  it('↺ by keyboard reverts, and focus lands on the control', async () => {
    const user = userEvent.setup()
    const onRevert = vi.fn()
    render(<Field label="Fläche" suggestion="118 m²" onRevert={onRevert}><Input defaultValue="120" /></Field>, { wrapper: de })
    await user.tab()
    expect(screen.getByRole('button', { name: /Zurück zum Vorschlag/ })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onRevert).toHaveBeenCalledOnce()
    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('shows no actions on a field nobody may change', () => {
    const { rerender } = render(<Field label="Fläche" disabled onConfirm={() => {}} onRevert={() => {}}><Input /></Field>)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    rerender(<Field label="Fläche" readOnly onConfirm={() => {}} onRevert={() => {}}><Input /></Field>)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly')
  })
})

describe('Field: origin and hint', () => {
  it.each([
    ['customer', 'Herkunft: Kunde.'],
    [{ source: 'customer', via: 'email' }, 'Herkunft: Kunde per E-Mail.'],
    [{ source: 'customer', via: 'form' }, 'Herkunft: Kunde per Formular.'],
    ['staff', 'Herkunft: Ergänzt.'],
    [{ source: 'staff', by: 'Anna' }, 'Herkunft: Ergänzt von Anna.'],
    [{ source: 'assumed', by: 'Anna' }, 'Herkunft: Angenommen.'],
    ['missing', 'Herkunft: Fehlt.']
  ] as const)('%j → %s', (origin, sentence) => {
    render(<Field label="Fläche" origin={origin}><Input /></Field>, { wrapper: de })
    const box = screen.getByRole('textbox')
    expect(box).toHaveAccessibleDescription(sentence)
    expect(document.getElementById(`${box.id}-origin`)).toHaveAttribute('lang', 'de-CH')
    expect(document.querySelector('.lcf-field-origin')).toHaveAttribute('aria-hidden', 'true')
  })

  it('ends the hint with a full stop only when it has none, and never marks the app\'s word', () => {
    const { rerender } = render(<Field label="Fläche" hint="Preistreiber"><Input /></Field>, { wrapper: de })
    const box = screen.getByRole('textbox')
    expect(box).toHaveAccessibleDescription('Preistreiber.')
    expect(document.getElementById(`${box.id}-hint`)).not.toHaveAttribute('lang')
    rerender(<Field label="Fläche" hint="Treibt den Preis!"><Input /></Field>)
    expect(box).toHaveAccessibleDescription('Treibt den Preis!')
  })
})

describe('Field: what is announced', () => {
  function Confirmable() {
    const [confirmed, setConfirmed] = useState(false)
    return (
      <Field label="Fläche" state={confirmed ? 'confirmed' : 'suggested'} onConfirm={() => setConfirmed(true)}>
        <Input defaultValue="118" />
      </Field>
    )
  }

  it('says "Bestätigt." when the person confirms', async () => {
    const user = userEvent.setup()
    render(<Confirmable />, { wrapper: de })
    await user.type(screen.getByRole('textbox'), '{Enter}')
    expect(await said()).toBe('Bestätigt.')
    expect(region()?.querySelector('span')).toHaveAttribute('lang', 'de-CH')
  })

  it('says it after ✓ too, though the button is gone by then', async () => {
    const user = userEvent.setup()
    render(<Confirmable />, { wrapper: de })
    await user.click(screen.getByRole('button', { name: 'Bestätigen' }))
    expect(await said()).toBe('Bestätigt.')
    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('says nothing on mount, or when the app changes the error', async () => {
    const { rerender } = render(<Field label="Fläche" state="confirmed" error="Zu gross." onConfirm={() => {}}><Input /></Field>, { wrapper: de })
    rerender(<Field label="Fläche" state="confirmed" error="Viel zu gross." onConfirm={() => {}}><Input /></Field>)
    rerender(<Field label="Fläche" state="confirmed" onConfirm={() => {}}><Input /></Field>)
    expect(await said()).toBe('')
  })
})

describe('useField', () => {
  it('is null outside a Field, and wires a native select inside one', () => {
    let outside: unknown = 'unset'
    function Probe() {
      outside = useField()
      return null
    }
    render(<Probe />)
    expect(outside).toBeNull()
    render(
      <Field label="Dach" description="Wie im Plan." required>
        <NativeSelect><option value="">–</option><option value="flat">Flach</option></NativeSelect>
      </Field>
    )
    const select = screen.getByRole('combobox', { name: 'Dach' })
    expect(select).toBeRequired()
    expect(select).toHaveAccessibleDescription('Wie im Plan.')
    expect(select.closest('.lcf-input')).toHaveAttribute('data-empty')
  })

  it('joinIds drops the empty parts and repeats', () => {
    expect(joinIds(undefined, 'a', '', 'b c', 'a', false)).toBe('a b c')
    expect(joinIds(undefined, '')).toBeUndefined()
  })
})

describe('Input', () => {
  it('defaults to md and text; className on the frame, ref and native props on the input', () => {
    let el: HTMLInputElement | null = null
    render(<Input aria-label="Ort" className="mine" ref={e => { el = e }} placeholder="Zürich" autoComplete="address-level2" />)
    const box = screen.getByRole('textbox', { name: 'Ort' })
    expect(box).toHaveAttribute('type', 'text')
    expect(box).toHaveAttribute('placeholder', 'Zürich')
    expect(box).toHaveAttribute('autocomplete', 'address-level2')
    expect(el).toBe(box)
    const frame = box.closest('.lcf-input')!
    expect(frame).toHaveClass('mine')
    expect(frame).toHaveAttribute('data-size', 'md')
  })

  it('warns when bare without a name, and not with aria-label or a <label for>', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { unmount } = render(<Input />)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no name'))
    unmount()
    warn.mockClear()
    render(<><Input aria-label="Ort" /><label htmlFor="x">PLZ</label><Input id="x" /></>)
    expect(warn).not.toHaveBeenCalled()
  })

  it('invalid sets aria-invalid and the danger edge; a Field\'s disabled disables it', () => {
    const { rerender } = render(<Input aria-label="Ort" invalid />)
    const box = screen.getByRole('textbox')
    expect(box).toHaveAttribute('aria-invalid', 'true')
    expect(box.closest('.lcf-input')).toHaveAttribute('data-color', 'danger')
    rerender(<Field label="Ort" disabled><Input /></Field>)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('a click on an adornment lands in the text', async () => {
    const user = userEvent.setup()
    render(<Input aria-label="Betrag" startAdornment={<span>CHF</span>} />)
    await user.click(screen.getByText('CHF'))
    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('takes the Field\'s size unless it sets its own', () => {
    const { rerender } = render(<Field label="Ort" size="sm"><Input /></Field>)
    expect(screen.getByRole('textbox').closest('.lcf-input')).toHaveAttribute('data-size', 'sm')
    rerender(<Field label="Ort" size="sm"><Input size="lg" /></Field>)
    expect(screen.getByRole('textbox').closest('.lcf-input')).toHaveAttribute('data-size', 'lg')
  })
})

describe('NumberField: reading and showing', () => {
  it('de-CH: "1234.5" shows as 1\'234.5 on blur and emits 1234.5', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<NumberField aria-label="Fläche" onValueChange={onValueChange} />, { wrapper: de })
    const box = screen.getByRole('textbox')
    await user.type(box, '1234.5')
    expect(onValueChange).not.toHaveBeenCalled()
    await user.tab()
    expect(onValueChange).toHaveBeenCalledWith(1234.5)
    expect(box).toHaveValue("1'234.5")
  })

  it.each([
    [at, '1.234,5', 1234.5, '1.234,5'],
    [at, '12.500', 12500, '12.500'],
    [at, '12,5', 12.5, '12,5'],
    [en, '1,234.5', 1234.5, '1,234.5']
  ] as const)('%#: %s → %s', async (wrapper, typed, n, shown) => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<NumberField aria-label="Fläche" onValueChange={onValueChange} />, { wrapper })
    await user.type(screen.getByRole('textbox'), typed)
    await user.tab()
    expect(onValueChange).toHaveBeenLastCalledWith(n)
    expect(screen.getByRole('textbox')).toHaveValue(shown)
  })

  it('"12," mid-typing is not an error, and commits 12', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<NumberField aria-label="Fläche" onValueChange={onValueChange} />, { wrapper: de })
    const box = screen.getByRole('textbox')
    await user.type(box, '12,')
    expect(box).not.toHaveAttribute('aria-invalid')
    await user.tab()
    expect(onValueChange).toHaveBeenCalledWith(12)
  })

  it.each([
    ["CHF 1'200.–", 'CHF', 1200],
    ["Fr. 1'200.50", 'CHF', 1200.5],
    ['12 %', 'percent', 12],
    ['118 m2', 'm2', 118]
  ] as const)('understands its own unit typed with the number: %s', async (typed, unit, n) => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<NumberField aria-label="Wert" unit={unit} onValueChange={onValueChange} />, { wrapper: de })
    await user.type(screen.getByRole('textbox'), typed)
    await user.tab()
    expect(onValueChange).toHaveBeenCalledWith(n)
  })

  it('"12 kg" in a square-metre field is not a number', async () => {
    const user = userEvent.setup()
    render(<NumberField aria-label="Fläche" unit="m2" />, { wrapper: de })
    await user.type(screen.getByRole('textbox'), '12 kg')
    await user.tab()
    expect(screen.getByText('Bitte eine Zahl eingeben.')).toBeInTheDocument()
  })

  it('unreadable text emits nothing, keeps the last value and the text, and says so — to the form as well', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<NumberField aria-label="Fläche" defaultValue={5} onValueChange={onValueChange} />, { wrapper: de })
    const box = screen.getByRole<HTMLInputElement>('textbox')
    await user.clear(box)
    await user.type(box, 'abc')
    await user.tab()
    expect(onValueChange).not.toHaveBeenCalled()
    expect(box).toHaveValue('abc')
    const msg = screen.getByText('Bitte eine Zahl eingeben.').closest('.lcf-field-msg')!
    expect(msg).toHaveAttribute('lang', 'de-CH')
    expect(box).toHaveAttribute('aria-invalid', 'true')
    expect(box.validity.customError).toBe(true)
    expect(box.validationMessage).toBe('Bitte eine Zahl eingeben.')
    // Escape gives the last good value back.
    await user.click(box)
    await user.keyboard('{Escape}')
    expect(box).toHaveValue('5')
  })

  it('a problem goes while typing, as soon as the text would commit cleanly', async () => {
    const user = userEvent.setup()
    render(<NumberField aria-label="Fläche" />, { wrapper: de })
    const box = screen.getByRole('textbox')
    await user.type(box, 'x')
    await user.tab()
    expect(box).toHaveAttribute('aria-invalid', 'true')
    await user.clear(box)
    await user.type(box, '4')
    expect(box).not.toHaveAttribute('aria-invalid')
  })

  it('never rounds: CHF 10.555 stays 10.555, and 0.1 + 0.2 by arrows shows 0.3', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { unmount } = render(<NumberField aria-label="Preis" unit="CHF" onValueChange={onValueChange} />, { wrapper: de })
    await user.type(screen.getByRole('textbox'), '10.555')
    await user.tab()
    expect(onValueChange).toHaveBeenCalledWith(10.555)
    expect(screen.getByRole('textbox')).toHaveValue('10.555')
    unmount()
    render(<NumberField aria-label="Anteil" defaultValue={0.1} step={0.1} />, { wrapper: de })
    await user.click(screen.getByRole('textbox'))
    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(screen.getByRole('textbox')).toHaveValue('0.3')
  })
})

describe('NumberField: range and step', () => {
  it('150 with max 100 is emitted as typed, and says "Höchstens 100%." (de-CH writes no space)', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<NumberField aria-label="Rabatt" unit="percent" max={100} onValueChange={onValueChange} />, { wrapper: de })
    await user.type(screen.getByRole('textbox'), '150')
    await user.tab()
    expect(onValueChange).toHaveBeenCalledWith(150)
    expect(flat(document.querySelector('.lcf-field-msg')?.textContent)).toBe('Höchstens 100%.')
  })

  it('0.3 on a 0.5 grid is off it', async () => {
    const user = userEvent.setup()
    render(<NumberField aria-label="Menge" step={0.5} />, { wrapper: de })
    await user.type(screen.getByRole('textbox'), '0.3')
    await user.tab()
    expect(screen.getByText('In Schritten von 0.5.')).toBeInTheDocument()
  })

  it('an out-of-range default says so on the first render, and says nothing aloud', async () => {
    render(<NumberField aria-label="Fläche" unit="m2" min={10} defaultValue={4} />, { wrapper: de })
    expect(flat(document.querySelector('.lcf-field-msg')?.textContent)).toBe('Mindestens 10 m².')
    expect(await said()).toBe('')
  })
})

describe('NumberField: keys and stepper', () => {
  it('arrows step and clamp; Up snaps 12.3 to 12.5; Shift and PageUp move ten', async () => {
    const user = userEvent.setup()
    render(<NumberField aria-label="Menge" defaultValue={12.3} step={0.5} max={20} />, { wrapper: de })
    const box = screen.getByRole('textbox')
    await user.click(box)
    await user.keyboard('{ArrowUp}')
    expect(box).toHaveValue('12.5')
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
    expect(box).toHaveValue('7.5')
    await user.keyboard('{PageUp}')
    expect(box).toHaveValue('12.5')
    await user.keyboard('{PageUp}')
    expect(box).toHaveValue('17.5')
    await user.keyboard('{PageUp}')
    expect(box).toHaveValue('20')
  })

  it('announces a step with its unit word, after the run of presses', async () => {
    const user = userEvent.setup()
    render(<NumberField aria-label="Fläche" unit="m2" defaultValue={10} />, { wrapper: de })
    await user.click(screen.getByRole('textbox'))
    await user.keyboard('{ArrowUp}{ArrowUp}')
    await waitFor(() => expect(flat(region()?.textContent)).toBe('12 Quadratmeter'))
  })

  it('unreadable text and an arrow: says it is not a number, and leaves the text', async () => {
    const user = userEvent.setup()
    render(<NumberField aria-label="Menge" defaultValue={3} />, { wrapper: de })
    const box = screen.getByRole('textbox')
    await user.clear(box)
    await user.type(box, 'zz')
    await user.keyboard('{ArrowUp}')
    expect(box).toHaveValue('zz')
    expect(screen.getByText('Bitte eine Zahl eingeben.')).toBeInTheDocument()
  })

  it('does nothing while composing or read-only, and nothing on the wheel', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = render(<NumberField aria-label="Menge" defaultValue={3} onValueChange={onValueChange} />, { wrapper: de })
    const box = screen.getByRole('textbox')
    fireEvent.keyDown(box, { key: 'ArrowUp', isComposing: true })
    fireEvent.wheel(box, { deltaY: -100 })
    expect(box).toHaveValue('3')
    rerender(<NumberField aria-label="Menge" defaultValue={3} readOnly onValueChange={onValueChange} />)
    await user.click(box)
    await user.keyboard('{ArrowUp}')
    expect(box).toHaveValue('3')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('Escape while editing restores and stops there; with nothing to undo it bubbles', async () => {
    const user = userEvent.setup()
    const parent = vi.fn()
    render(<div onKeyDown={e => parent(e.key)}><NumberField aria-label="Menge" defaultValue={3} /></div>, { wrapper: de })
    const box = screen.getByRole('textbox')
    await user.type(box, '9')
    await user.keyboard('{Escape}')
    expect(box).toHaveValue('3')
    expect(parent).not.toHaveBeenCalledWith('Escape')
    await user.keyboard('{Escape}')
    expect(parent).toHaveBeenCalledWith('Escape')
  })

  it('stepper buttons: out of the Tab order, named with the label, disabled at the bound, none at sm', async () => {
    const user = userEvent.setup()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { unmount } = render(<Field label="Fläche"><NumberField unit="m2" stepper defaultValue={9} max={10} /></Field>, { wrapper: de })
    const inc = screen.getByRole('button', { name: 'Erhöhen Fläche' })
    expect(inc).toHaveAttribute('tabindex', '-1')
    expect(inc).toHaveAttribute('lang', 'de-CH')
    await user.click(inc)
    expect(screen.getByRole('textbox')).toHaveValue('10')
    expect(inc).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Verringern Fläche' })).toBeEnabled()
    unmount()
    render(<Field label="Fläche" size="sm"><NumberField unit="m2" stepper /></Field>, { wrapper: de })
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no stepper at size sm'))
  })
})

describe('NumberField: values, forms and wiring', () => {
  it('emptying commits null and marks it empty', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<NumberField aria-label="Menge" defaultValue={3} onValueChange={onValueChange} />, { wrapper: de })
    const box = screen.getByRole('textbox')
    await user.clear(box)
    await user.type(box, '   ')
    await user.tab()
    expect(onValueChange).toHaveBeenCalledWith(null)
    expect(box.closest('.lcf-input')).toHaveAttribute('data-empty')
  })

  it('controlled: the box follows the value, except mid-edit; a rejected commit is shown as rejected', async () => {
    const user = userEvent.setup()
    function Parent() {
      const [v, setV] = useState<number | null>(50)
      return (
        <>
          <NumberField aria-label="Menge" value={v} onValueChange={n => n !== null && n <= 100 && setV(n)} />
          <button type="button" onClick={() => setV(70)}>Set</button>
        </>
      )
    }
    render(<Parent />, { wrapper: de })
    const box = screen.getByRole('textbox')
    await user.type(box, '1')
    expect(box).toHaveValue('501')
    // A change from outside while the person is typing does not touch the text…
    fireEvent.click(screen.getByRole('button', { name: 'Set' }))
    expect(box).toHaveValue('501')
    // …and the committed value shows once the edit is over: 501 rejected, 70 stands.
    await user.tab()
    expect(box).toHaveValue('70')
    await user.click(screen.getByRole('button', { name: 'Set' }))
    expect(box).toHaveValue('70')
  })

  it('posts the canonical number under name; the visible box has none', async () => {
    const user = userEvent.setup()
    let posted: FormDataEntryValue | null = 'not submitted'
    render(
      <form onSubmit={e => { e.preventDefault(); posted = new FormData(e.currentTarget).get('area') }}>
        <NumberField aria-label="Fläche" name="area" />
        {/* user-event submits implicitly only with one <input> or a submit
            button, and counts the hidden one; a browser does not. */}
        <button type="submit">Senden</button>
      </form>,
      { wrapper: de }
    )
    const box = screen.getByRole('textbox')
    await user.type(box, '1234.5{Enter}')
    expect(posted).toBe('1234.5')
    expect(box).not.toHaveAttribute('name')
  })

  it('offers the decimal pad only with min ≥ 0', () => {
    render(<><NumberField aria-label="A" min={0} /><NumberField aria-label="B" /></>)
    expect(screen.getByRole('textbox', { name: 'A' })).toHaveAttribute('inputmode', 'decimal')
    expect(screen.getByRole('textbox', { name: 'B' })).toHaveAttribute('inputmode', 'text')
  })

  it('marks the formatter\'s number and the table\'s words with their language', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Field label="Preis"><NumberField unit="CHF" min={0} /></Field>, { wrapper: de })
    const box = screen.getByRole('textbox', { name: 'Preis Franken' })
    expect(box).toHaveAttribute('lang', 'de-CH')
    expect(document.getElementById(`${box.id}-unit`)).toHaveAttribute('lang', 'de-CH')
    await user.type(box, '-1')
    await user.tab()
    expect(screen.getByText(/^Mindestens/).closest('.lcf-field-msg')).toHaveAttribute('lang', 'de-CH')
    unmount()
    render(<Field label="Preis"><NumberField unit="CHF" /></Field>, { wrapper: provider('de-DE') })
    expect(screen.getByRole('textbox', { name: 'Preis Schweizer Franken' })).toBeInTheDocument()
  })

  it('says a blur-time problem with the field\'s name, once', async () => {
    const user = userEvent.setup()
    render(<Field label="Fläche" required><NumberField unit="m2" max={500} /></Field>, { wrapper: de })
    const box = screen.getByRole('textbox')
    await user.type(box, '600')
    await user.tab()
    expect(await said()).toBe('Fläche: Höchstens 500 m².')
    region()!.textContent = ''
    await user.click(box)
    await user.clear(box)
    await user.type(box, '700')
    await user.tab()
    expect(await said()).toBe('')
  })
})

describe('the language of the layer\'s words, where the table falls back (fr-CH)', () => {
  it('marks every table word "en", the formatter\'s number "fr-CH", and never the app\'s label', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Field
          label="Surface"
          required
          state="suggested"
          suggestion="118 m²"
          onConfirm={() => {}}
          onRevert={() => {}}
          origin={{ source: 'customer', via: 'email' }}
        >
          <NumberField unit="m2" stepper max={100} />
        </Field>
        <Alert title="Prix ouvert" onDismiss={() => {}} />
        <Spinner labelled />
      </>,
      { wrapper: fr }
    )
    const box = screen.getByRole('textbox', { name: 'Surface square metres' })
    expect(box).toHaveAttribute('lang', 'fr-CH')
    await user.type(box, '150')
    await user.tab()
    const tableWords = [
      screen.getByText('Required'),
      screen.getByRole('button', { name: 'Confirm' }),
      screen.getByRole('button', { name: 'Back to suggestion: 118 m²' }),
      screen.getByRole('button', { name: 'Increase Surface' }),
      screen.getByRole('button', { name: 'Decrease Surface' }),
      document.querySelector('.lcf-field-origin'),
      document.getElementById(`${box.id}-unit`),
      document.getElementById(`${box.id}-state`),
      document.getElementById(`${box.id}-keys`),
      document.getElementById(`${box.id}-origin`),
      screen.getByText(/^At most/).closest('.lcf-field-msg'),
      screen.getByRole('button', { name: 'Dismiss: Prix ouvert' }),
      screen.getByRole('status', { name: 'Loading' })
    ]
    for (const el of tableWords) expect(el).toHaveAttribute('lang', 'en')
    expect(screen.getByText('Surface')).not.toHaveAttribute('lang')
    expect(screen.getByText('Surface').closest('[lang]')).toBeNull()
  })
})
