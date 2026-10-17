import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState, type ReactNode } from 'react'
import { LcfProvider } from '../i18n/context'
import { Checkbox } from './Checkbox/Checkbox'
import { CheckboxGroup } from './Checkbox/CheckboxGroup'
import * as CheckboxEntry from './Checkbox/index'
import { _resetAnnouncer } from './Field/announce'
import { Field } from './Field/Field'
import { Input } from './Input/Input'

const de = ({ children }: { children: ReactNode }) => <LcfProvider locale="de-CH">{children}</LcfProvider>
const flat = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim()
const region = () => document.querySelector('[data-lcf-announcer]')
const said = async () => {
  await act(() => new Promise(r => requestAnimationFrame(() => r(undefined))))
  return flat(region()?.textContent)
}

afterEach(() => {
  _resetAnnouncer()
  vi.restoreAllMocks()
})

describe('Checkbox: the input is the control', () => {
  it('puts every attribute on the <input> — aria-label, name, required, form, data-*, ref — and only className and style on the row', () => {
    // The Nuxt 0.2.0 lesson: on the wrapper, an aria-label named nothing.
    let el: HTMLInputElement | null = null
    render(
      <Checkbox
        aria-label="Zeile wählen"
        name="rows"
        required
        form="offer"
        data-row="p1"
        title="Zeile"
        className="mine"
        style={{ marginTop: 3 }}
        ref={e => { el = e }}
      />
    )
    const box = screen.getByRole('checkbox', { name: 'Zeile wählen' })
    expect(el).toBe(box)
    expect(box).toHaveAttribute('name', 'rows')
    expect(box).toBeRequired()
    expect(box).toHaveAttribute('form', 'offer')
    expect(box).toHaveAttribute('data-row', 'p1')
    expect(box).toHaveAttribute('title', 'Zeile')
    const row = box.closest('.lcf-checkbox')!
    expect(row).toHaveClass('mine')
    expect(row).toHaveStyle({ marginTop: '3px' })
    expect(row).not.toHaveAttribute('aria-label')
    expect(row).not.toHaveAttribute('data-row')
  })

  it('names the box by its label beside it, describes it by its description, and a click on the label ticks it', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<Checkbox label="Gerüst nötig" description="Ab 3 m Arbeitshöhe." onCheckedChange={onCheckedChange} />)
    const box = screen.getByRole('checkbox', { name: 'Gerüst nötig' })
    expect(box).toHaveAccessibleDescription('Ab 3 m Arbeitshöhe.')
    expect(screen.getByText('Gerüst nötig')).toHaveAttribute('for', box.id)
    await user.click(screen.getByText('Gerüst nötig'))
    expect(box).toBeChecked()
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)
    // The description is not part of the label: clicking it changes nothing.
    await user.click(screen.getByText('Ab 3 m Arbeitshöhe.'))
    expect(box).toBeChecked()
  })

  it('joins its description with the app\'s own aria-describedby, its own first', () => {
    render(<><Checkbox label="AGB" description="Seite 4." aria-describedby="terms" /><p id="terms">Gelesen.</p></>)
    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription('Seite 4. Gelesen.')
  })

  it('Space ticks and clears; controlled, it shows what the app says', async () => {
    const user = userEvent.setup()
    function App() {
      const [on, setOn] = useState(false)
      return <Checkbox label="Grundierung" checked={on} onCheckedChange={setOn} />
    }
    render(<App />)
    const box = screen.getByRole('checkbox')
    await user.tab()
    await user.keyboard(' ')
    expect(box).toBeChecked()
    await user.keyboard(' ')
    expect(box).not.toBeChecked()
  })

  it('posts its value under its name, natively; "on" by default', () => {
    render(
      <form data-testid="f">
        <Checkbox label="A" name="a" defaultChecked />
        <Checkbox label="B" name="b" value="yes" defaultChecked />
        <Checkbox label="C" name="c" />
      </form>
    )
    const data = new FormData(screen.getByTestId('f') as HTMLFormElement)
    expect([...data.entries()]).toEqual([['a', 'on'], ['b', 'yes']])
  })

  it('indeterminate is the DOM property, shown while the prop says so — a click emits the next checked and stays mixed until the app decides', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const { rerender } = render(<Checkbox label="Alle Räume" indeterminate onCheckedChange={onCheckedChange} />)
    const box = screen.getByRole<HTMLInputElement>('checkbox')
    expect(box).toBePartiallyChecked()
    await user.click(box)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(box.indeterminate).toBe(true)
    rerender(<Checkbox label="Alle Räume" checked onCheckedChange={onCheckedChange} />)
    expect(box.indeterminate).toBe(false)
    expect(box).toBeChecked()
  })

  it('invalid writes aria-invalid and the danger colour; otherwise aria-invalid="false" and primary', () => {
    const { rerender } = render(<Checkbox label="AGB" />)
    const box = screen.getByRole('checkbox')
    expect(box).toHaveAttribute('aria-invalid', 'false')
    expect(box.closest('.lcf-checkbox')).toHaveAttribute('data-color', 'primary')
    rerender(<Checkbox label="AGB" invalid />)
    expect(box).toHaveAttribute('aria-invalid', 'true')
    expect(box.closest('.lcf-checkbox')).toHaveAttribute('data-color', 'danger')
  })

  it('read-only says so and changes nothing, by click or by Space', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<Checkbox label="Grundierung" readOnly defaultChecked onCheckedChange={onCheckedChange} />)
    const box = screen.getByRole('checkbox')
    expect(box).toHaveAttribute('aria-readonly', 'true')
    await user.click(box)
    await user.keyboard(' ')
    expect(box).toBeChecked()
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it('unlocked again, the very next click is reported: read-only left React\'s record of the box right', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const { rerender } = render(<Checkbox label="Grundierung" readOnly defaultChecked onCheckedChange={onCheckedChange} />)
    const box = screen.getByRole('checkbox')
    await user.click(box)
    rerender(<Checkbox label="Grundierung" defaultChecked onCheckedChange={onCheckedChange} />)
    await user.click(box)
    expect(box).not.toBeChecked()
    expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('takes size sm, md (default) and lg as data-size', () => {
    const { rerender } = render(<Checkbox label="A" />)
    const row = () => screen.getByRole('checkbox').closest('.lcf-checkbox')
    expect(row()).toHaveAttribute('data-size', 'md')
    rerender(<Checkbox label="A" size="lg" />)
    expect(row()).toHaveAttribute('data-size', 'lg')
  })

  it('warns with no name, and not with a label, aria-label, aria-labelledby or a <label for>', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { unmount } = render(<Checkbox />)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Checkbox has no name'))
    unmount()
    warn.mockClear()
    render(
      <>
        <Checkbox label="A" />
        <Checkbox aria-label="B" />
        <span id="c">C</span><Checkbox aria-labelledby="c" />
        <label htmlFor="d">D</label><Checkbox id="d" />
      </>
    )
    expect(warn).not.toHaveBeenCalled()
  })

  it('warns when put in a Field on its own: a Field holds a CheckboxGroup', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<Field label="Gerüst"><Checkbox label="Gerüst nötig" /></Field>)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('put it in a CheckboxGroup'))
  })

  it('is public with CheckboxGroup from one path', () => {
    expect(CheckboxEntry.Checkbox).toBe(Checkbox)
    expect(CheckboxEntry.CheckboxGroup).toBe(CheckboxGroup)
  })
})

function Work({ field = {}, group = {} }: { field?: Partial<Parameters<typeof Field>[0]>; group?: Partial<Parameters<typeof CheckboxGroup>[0]> }) {
  return (
    <Field label="Leistungen" {...field}>
      <CheckboxGroup name="work" {...group}>
        <Checkbox value="paint" label="Malen" />
        <Checkbox value="fill" label="Spachteln" description="Risse und Löcher." />
        <Checkbox value="paper" label="Tapezieren" />
      </CheckboxGroup>
    </Field>
  )
}

describe('CheckboxGroup in a Field: one control', () => {
  it('is a fieldset named by the Field\'s label, which points at no box; each box is named by its own label only', () => {
    render(<Work />, { wrapper: de })
    const group = screen.getByRole('group', { name: 'Leistungen' })
    expect(group.tagName).toBe('FIELDSET')
    const label = screen.getByText('Leistungen').closest('label')!
    expect(label).not.toHaveAttribute('for')
    expect(group.id).toBe(label.id.replace(/-label$/, ''))
    expect(screen.getByRole('checkbox', { name: 'Malen' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Spachteln' })).toHaveAccessibleDescription('Risse und Löcher.')
  })

  it('carries the Field\'s words on the fieldset, said once for the group, not on every box', () => {
    render(<Work field={{ state: 'suggested', origin: { source: 'customer', via: 'email' }, description: 'Was die Offerte enthält.', onConfirm: () => {} }} />, { wrapper: de })
    const group = screen.getByRole('group', { name: 'Leistungen' })
    expect(group).toHaveAccessibleDescription('Vorschlag. Enter bestätigt. Herkunft: Kunde per E-Mail. Was die Offerte enthält.')
    expect(screen.getByRole('checkbox', { name: 'Malen' })).not.toHaveAttribute('aria-describedby')
  })

  it('emits the chosen values in the order the boxes are rendered, not the order they were clicked', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Work group={{ onValueChange }} />, { wrapper: de })
    await user.click(screen.getByRole('checkbox', { name: 'Tapezieren' }))
    await user.click(screen.getByRole('checkbox', { name: 'Malen' }))
    expect(onValueChange).toHaveBeenLastCalledWith(['paint', 'paper'])
    await user.click(screen.getByRole('checkbox', { name: 'Tapezieren' }))
    expect(onValueChange).toHaveBeenLastCalledWith(['paint'])
  })

  it('posts each chosen box under the group\'s name, natively; a disabled box posts nothing', () => {
    render(
      <form data-testid="f">
        <Field label="Leistungen">
          <CheckboxGroup name="work" defaultValue={['paint', 'paper']}>
            <Checkbox value="paint" label="Malen" />
            <Checkbox value="fill" label="Spachteln" />
            <Checkbox value="paper" label="Tapezieren" disabled />
          </CheckboxGroup>
        </Field>
      </form>
    )
    expect(new FormData(screen.getByTestId('f') as HTMLFormElement).getAll('work')).toEqual(['paint'])
  })

  it('a box without a value (a "select all") keeps its own checked and is not part of the value', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const onAll = vi.fn()
    render(
      <Field label="Räume">
        <CheckboxGroup defaultValue={['k']} onValueChange={onValueChange}>
          <Checkbox label="Alle" checked={false} indeterminate onCheckedChange={onAll} />
          <Checkbox value="k" label="Küche" />
        </CheckboxGroup>
      </Field>
    )
    await user.click(screen.getByRole('checkbox', { name: 'Alle' }))
    expect(onAll).toHaveBeenCalledWith(true)
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByRole('checkbox', { name: 'Küche' })).toBeChecked()
  })

  it('hides the Field from what is inside it: an Input between the boxes does not take the Field\'s id', () => {
    render(
      <Field label="Leistungen">
        <CheckboxGroup>
          <Checkbox value="other" label="Andere" />
          <Input aria-label="Welche" />
        </CheckboxGroup>
      </Field>
    )
    const group = screen.getByRole('group', { name: 'Leistungen' })
    expect(screen.getByRole('textbox', { name: 'Welche' }).id).not.toBe(group.id)
  })

  it('takes the Field\'s size, disabled, read-only and error', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Work field={{ size: 'sm' }} />)
    expect(screen.getByRole('group')).toHaveAttribute('data-size', 'sm')
    expect(screen.getByRole('checkbox', { name: 'Malen' }).closest('.lcf-checkbox')).toHaveAttribute('data-size', 'sm')

    rerender(<Work field={{ disabled: true }} />)
    expect(screen.getByRole('group')).toBeDisabled()
    for (const b of screen.getAllByRole('checkbox')) expect(b).toBeDisabled()

    rerender(<Work field={{ readOnly: true, onConfirm: () => {} }} />)
    const malen = screen.getByRole('checkbox', { name: 'Malen' })
    expect(malen).toHaveAttribute('aria-readonly', 'true')
    await user.click(malen)
    expect(malen).not.toBeChecked()
    expect(screen.queryByRole('button')).toBeNull()

    rerender(<Work field={{ error: 'Nicht beides.' }} />)
    for (const b of screen.getAllByRole('checkbox')) {
      expect(b).toHaveAttribute('aria-invalid', 'true')
      expect(b.closest('.lcf-checkbox')).toHaveAttribute('data-color', 'danger')
      // Never "invalid" with no words: the error describes every box
      // too, after the box's own description.
      expect(b).toHaveAccessibleDescription(expect.stringMatching(/(^|\. )Nicht beides\.$/))
    }
    expect(screen.getByRole('group')).toHaveAccessibleDescription('Nicht beides.')

    rerender(<Work field={{}} />)
    for (const b of screen.getAllByRole('checkbox')) expect(b).not.toHaveAccessibleDescription(expect.stringContaining('Nicht beides.'))
  })

  it('goes back to its default on a form reset when uncontrolled', async () => {
    const user = userEvent.setup()
    render(
      <form>
        <Work group={{ defaultValue: ['fill'] }} />
        <button type="reset">Reset</button>
      </form>
    )
    await user.click(screen.getByRole('checkbox', { name: 'Malen' }))
    await user.click(screen.getByRole('checkbox', { name: 'Spachteln' }))
    expect(screen.getByRole('checkbox', { name: 'Spachteln' })).not.toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Spachteln' })).toBeChecked())
    expect(screen.getByRole('checkbox', { name: 'Malen' })).not.toBeChecked()
  })
})

describe('CheckboxGroup: required is at least one', () => {
  it('derives required-and-empty from data-empty on the fieldset: the word, the caution edge on every box', async () => {
    const user = userEvent.setup()
    render(<Work field={{ required: true }} />, { wrapper: de })
    const group = screen.getByRole('group', { name: 'Leistungen' })
    expect(group.parentElement).toHaveClass('lcf-field-control')
    expect(group).toHaveAttribute('data-empty')
    expect(screen.getByText('Pflichtfeld')).toBeInTheDocument()
    for (const b of screen.getAllByRole('checkbox')) expect(b.closest('.lcf-checkbox')).toHaveAttribute('data-color', 'caution')
    await user.click(screen.getByRole('checkbox', { name: 'Spachteln' }))
    expect(group).not.toHaveAttribute('data-empty')
    for (const b of screen.getAllByRole('checkbox')) expect(b.closest('.lcf-checkbox')).toHaveAttribute('data-color', 'primary')
  })

  it('says "Pflichtfeld." first in the group\'s description, in its language — no attribute on a group says it', () => {
    render(<Work field={{ required: true, description: 'Was die Offerte enthält.' }} />, { wrapper: de })
    const group = screen.getByRole('group', { name: 'Leistungen' })
    expect(group).toHaveAccessibleDescription('Pflichtfeld. Was die Offerte enthält.')
    expect(document.getElementById(`${group.id}-required`)).toHaveAttribute('lang', 'de-CH')
  })

  it('stops the form, by a custom validity on the first box in the table\'s words, and never native required on a box', async () => {
    const user = userEvent.setup()
    render(<form data-testid="f"><Work field={{ required: true }} /></form>, { wrapper: de })
    const form = screen.getByTestId('f') as HTMLFormElement
    const [first, second] = screen.getAllByRole<HTMLInputElement>('checkbox')
    for (const b of screen.getAllByRole('checkbox')) expect(b).not.toBeRequired()
    expect(form.checkValidity()).toBe(false)
    expect(first!.validationMessage).toBe('Bitte mindestens eine Option wählen.')
    expect(first).toHaveAttribute('aria-invalid', 'false')
    await user.click(second!)
    expect(form.checkValidity()).toBe(true)
    expect(first!.validationMessage).toBe('')
  })

  it('a disabled first box passes the message to the next one', () => {
    render(
      <form data-testid="f">
        <Field label="Zugang" required>
          <CheckboxGroup>
            <Checkbox value="lift" label="Lift" disabled />
            <Checkbox value="stairs" label="Treppe" />
          </CheckboxGroup>
        </Field>
      </form>,
      { wrapper: de }
    )
    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: 'Treppe' }).validationMessage).toBe('Bitte mindestens eine Option wählen.')
    expect((screen.getByTestId('f') as HTMLFormElement).checkValidity()).toBe(false)
  })
})

describe('CheckboxGroup in a confirmable Field: the keys', () => {
  function Review({ onSubmit }: { onSubmit?: () => void }) {
    const SUGGESTED = ['paint', 'fill']
    const [value, setValue] = useState(SUGGESTED)
    const [confirmed, setConfirmed] = useState(false)
    const at = value.join() === SUGGESTED.join()
    return (
      <form onSubmit={e => { e.preventDefault(); onSubmit?.() }}>
        <Field
          label="Leistungen"
          required
          state={confirmed ? 'confirmed' : at ? 'suggested' : undefined}
          suggestion="Malen, Spachteln"
          onConfirm={() => setConfirmed(true)}
          onRevert={!at && !confirmed ? () => setValue(SUGGESTED) : undefined}
        >
          <CheckboxGroup value={value} onValueChange={v => { setValue(v); setConfirmed(false) }}>
            <Checkbox value="paint" label="Malen" />
            <Checkbox value="fill" label="Spachteln" />
            <Checkbox value="paper" label="Tapezieren" />
          </CheckboxGroup>
        </Field>
        <button type="submit">Speichern</button>
      </form>
    )
  }

  it('Enter in any box confirms and never submits; Space overrides; Escape goes back and focus stays', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const { container } = render(<Review onSubmit={onSubmit} />, { wrapper: de })
    const field = container.querySelector('.lcf-field')!
    expect(field).toHaveAttribute('data-state', 'suggested')
    await user.tab()
    await user.tab()
    const spachteln = screen.getByRole('checkbox', { name: 'Spachteln' })
    expect(spachteln).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(field).toHaveAttribute('data-state', 'confirmed')
    expect(onSubmit).not.toHaveBeenCalled()
    expect(await said()).toBe('Bestätigt.')

    await user.keyboard(' ')
    expect(spachteln).not.toBeChecked()
    expect(field).not.toHaveAttribute('data-state')
    expect(screen.getByRole('button', { name: 'Zurück zum Vorschlag: Malen, Spachteln' })).toHaveAttribute('tabindex', '-1')
    region()!.textContent = ''
    await user.keyboard('{Escape}')
    expect(spachteln).toBeChecked()
    expect(field).toHaveAttribute('data-state', 'suggested')
    expect(spachteln).toHaveFocus()
    expect(await said()).toBe('Vorschlag.')
  })

  it('refuses to confirm a required group with nothing ticked, and says why with the field\'s name', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onSubmit = vi.fn((e: { preventDefault(): void }) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Work field={{ required: true, onConfirm }} />
        <button type="submit">Speichern</button>
      </form>,
      { wrapper: de }
    )
    await user.tab()
    await user.keyboard('{Enter}')
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(await said()).toBe('Leistungen: Bitte mindestens eine Option wählen.')
    expect(region()?.querySelector('span')).toHaveAttribute('lang', 'de-CH')
  })

  it('✓ confirms the group and gives focus back to a box, which a fieldset cannot take', async () => {
    const user = userEvent.setup()
    render(<Review />, { wrapper: de })
    await user.click(screen.getByRole('button', { name: 'Bestätigen' }))
    expect(document.querySelector('.lcf-field')).toHaveAttribute('data-state', 'confirmed')
    expect(screen.getByRole('checkbox', { name: 'Malen' })).toHaveFocus()
  })

  it('an "other" Input between the boxes: Enter confirms and never submits; its Escape is its own', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onConfirm = vi.fn()
    const onRevert = vi.fn()
    render(
      <form onSubmit={e => { e.preventDefault(); onSubmit() }}>
        <Field label="Leistungen" state="suggested" onConfirm={onConfirm} onRevert={onRevert}>
          <CheckboxGroup defaultValue={['paint']}>
            <Checkbox value="paint" label="Malen" />
            <Checkbox value="other" label="Andere" />
            <Input aria-label="Andere Leistung" />
          </CheckboxGroup>
        </Field>
        <button type="submit">Speichern</button>
      </form>,
      { wrapper: de }
    )
    const other = screen.getByRole('textbox', { name: 'Andere Leistung' })
    await user.click(other)
    await user.keyboard('Gips{Enter}')
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onSubmit).not.toHaveBeenCalled()
    await user.keyboard('{Escape}')
    expect(onRevert).not.toHaveBeenCalled()
    expect(other).toHaveValue('Gips')
    // A box's Escape still goes back.
    await user.click(screen.getByRole('checkbox', { name: 'Andere' }))
    await user.keyboard('{Escape}')
    expect(onRevert).toHaveBeenCalledOnce()
  })

  it('leaves Enter alone in a group whose Field is not confirmable', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((e: { preventDefault(): void }) => e.preventDefault())
    render(<form onSubmit={onSubmit}><Work /><button type="submit">Speichern</button></form>)
    await user.tab()
    await user.keyboard('{Enter}')
    // user-event submits on Enter in a checkbox as Chromium does, measured.
    expect(onSubmit).toHaveBeenCalledOnce()
  })
})

describe('CheckboxGroup: development warnings', () => {
  it('warns outside a Field with no name, and not with aria-label', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { unmount } = render(<CheckboxGroup><Checkbox value="a" label="A" /></CheckboxGroup>)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('CheckboxGroup has no name'))
    unmount()
    warn.mockClear()
    render(<CheckboxGroup aria-label="Räume"><Checkbox value="a" label="A" /></CheckboxGroup>)
    expect(warn).not.toHaveBeenCalled()
    expect(screen.getByRole('group', { name: 'Räume' })).toBeInTheDocument()
  })

  it('warns about an id, or required, on the group inside a Field, and about a box with neither value nor checked', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <Field label="Räume" id="rooms">
        <CheckboxGroup id="mine" required>
          <Checkbox label="Küche" />
        </CheckboxGroup>
      </Field>
    )
    expect(screen.getByRole('group')).toHaveAttribute('id', 'rooms')
    const lines = warn.mock.calls.map(c => String(c[0]))
    expect(lines.some(l => l.includes('ignored'))).toBe(true)
    expect(lines.some(l => l.includes('required on a control inside a Field'))).toBe(true)
    expect(lines.some(l => l.includes('neither `value` nor `checked`'))).toBe(true)
  })

  it('leaves native required off a box of a group, and warns: there it would mean that box, not at least one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <CheckboxGroup aria-label="Räume" defaultValue={['b']}>
        <Checkbox value="a" label="A" required />
        <Checkbox value="b" label="B" />
      </CheckboxGroup>
    )
    expect(screen.getByRole('checkbox', { name: 'A' })).not.toBeRequired()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('required on a Checkbox in a CheckboxGroup'))
  })

  it('warns when wrapped inside a Field, where the Field cannot see it is a group', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    function Rooms() {
      return <CheckboxGroup><Checkbox value="k" label="Küche" /></CheckboxGroup>
    }
    render(<Field label="Räume"><Rooms /></Field>)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('wrapped in another component'))
  })
})
