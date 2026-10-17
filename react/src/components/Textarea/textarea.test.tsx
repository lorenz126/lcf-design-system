import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRef, useState, type ReactNode } from 'react'
import { LcfProvider } from '../../i18n/context'
import { _resetAnnouncer } from '../Field/announce'
import { Field } from '../Field/Field'
import { Input } from '../Input/Input'
import { countCharacters } from './count'
import * as Entry from './index'
import { Textarea } from './Textarea'

const provider = (locale: string) => ({ children }: { children: ReactNode }) => <LcfProvider locale={locale}>{children}</LcfProvider>
const de = provider('de-CH')

const flat = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim()
const region = () => document.querySelector('[data-lcf-announcer]')
const frame = () => new Promise(r => requestAnimationFrame(() => r(undefined)))
const said = async () => {
  await act(frame)
  return flat(region()?.textContent)
}

afterEach(() => {
  _resetAnnouncer()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Textarea: in a Field, unchanged', () => {
  it('takes the Field\'s id, name and description — the one that says Ctrl+Enter, since Enter is a new line', () => {
    render(
      <Field
        id="access"
        label="Zugang"
        state="suggested"
        onConfirm={() => {}}
        origin={{ source: 'customer', via: 'email' }}
        description="Aus der E-Mail."
      >
        <Textarea characterLimit={300} defaultValue="Seiteneingang." />
      </Field>,
      { wrapper: de }
    )
    const box = screen.getByRole('textbox', { name: 'Zugang' })
    expect(box.tagName).toBe('TEXTAREA')
    expect(box).toHaveAttribute('id', 'access')
    expect(box).toHaveAttribute('aria-describedby', 'access-limit access-state access-keys-lines access-origin access-help')
    expect(box).toHaveAccessibleDescription('Höchstens 300 Zeichen. Vorschlag. Strg+Enter bestätigt. Herkunft: Kunde per E-Mail. Aus der E-Mail.')
    expect(document.getElementById('access-keys-lines')).toHaveAttribute('lang', 'de-CH')
    expect(document.getElementById('access-limit')).toHaveAttribute('lang', 'de-CH')
  })

  it('an Input beside it keeps "Enter bestätigt."', () => {
    render(<Field label="Fläche" onConfirm={() => {}}><Input /></Field>, { wrapper: de })
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Enter bestätigt.')
  })

  it('is required, disabled and read-only from the Field, and warns when they are set on it instead', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { rerender } = render(<Field label="Grund" required><Textarea /></Field>, { wrapper: de })
    expect(screen.getByRole('textbox')).toBeRequired()
    rerender(<Field label="Grund" disabled><Textarea /></Field>)
    expect(screen.getByRole('textbox')).toBeDisabled()
    rerender(<Field label="Grund" readOnly><Textarea /></Field>)
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly')
    expect(warn).not.toHaveBeenCalled()
    rerender(<Field label="Grund"><Textarea required /></Field>)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('required on a control inside a Field'))
  })

  it('ignores an id given to it inside a Field, and says so', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<Field label="Notiz" id="note"><Textarea id="mine" /></Field>)
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'note')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ignored'))
  })

  it('writes aria-invalid either way; the Field\'s error makes it invalid and the edge danger', () => {
    const { rerender } = render(<Field label="Notiz"><Textarea /></Field>)
    const box = screen.getByRole('textbox')
    expect(box).toHaveAttribute('aria-invalid', 'false')
    rerender(<Field label="Notiz" error="Zu lang für eine SMS."><Textarea /></Field>)
    expect(box).toHaveAttribute('aria-invalid', 'true')
    expect(box).toHaveAttribute('data-color', 'danger')
  })

  it('takes the Field\'s size unless it sets its own', () => {
    const { rerender } = render(<Field label="Notiz" size="lg"><Textarea /></Field>)
    expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'lg')
    rerender(<Field label="Notiz" size="lg"><Textarea size="sm" /></Field>)
    expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'sm')
  })
})

describe('Textarea: required and empty', () => {
  it('stamps data-empty on its box, the caution edge, the word — and they go once something is typed', async () => {
    const user = userEvent.setup()
    const { container } = render(<Field label="Grund" required><Textarea /></Field>, { wrapper: de })
    const box = screen.getByRole('textbox')
    const outer = container.querySelector('.lcf-field-control > .lcf-textarea')!
    expect(outer).toHaveAttribute('data-empty')
    expect(box).toHaveAttribute('data-color', 'caution')
    expect(screen.getByText('Pflichtfeld')).toBeInTheDocument()
    await user.type(box, ' ')
    // Whitespace is not empty, as native required says too.
    expect(outer).not.toHaveAttribute('data-empty')
    expect(box).not.toHaveAttribute('data-color')
  })

  it('is empty again after a form reset, when uncontrolled', async () => {
    const user = userEvent.setup()
    const { container } = render(<form><Field label="Notiz" required><Textarea /></Field><button type="reset">Reset</button></form>)
    const outer = container.querySelector('.lcf-textarea')!
    await user.type(screen.getByRole('textbox'), 'Leiter')
    expect(outer).not.toHaveAttribute('data-empty')
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() => expect(outer).toHaveAttribute('data-empty'))
  })

  it('reads emptiness from a controlled value', () => {
    const { container, rerender } = render(<Field label="Notiz" required><Textarea value="" onChange={() => {}} /></Field>)
    const outer = container.querySelector('.lcf-textarea')!
    expect(outer).toHaveAttribute('data-empty')
    rerender(<Field label="Notiz" required><Textarea value="x" onChange={() => {}} /></Field>)
    expect(outer).not.toHaveAttribute('data-empty')
  })
})

describe('Textarea: confirm and revert', () => {
  function Suggested({ onConfirm }: { onConfirm: () => void }) {
    const suggestion = 'Seiteneingang.'
    const [value, setValue] = useState(suggestion)
    const at = value === suggestion
    return (
      <form onSubmit={e => { e.preventDefault(); throw new Error('submitted') }}>
        <Field
          label="Zugang"
          state={at ? 'suggested' : undefined}
          onConfirm={onConfirm}
          onRevert={at ? undefined : () => setValue(suggestion)}
        >
          <Textarea value={value} onChange={e => setValue(e.target.value)} />
        </Field>
      </form>
    )
  }

  it('Enter is a new line; Ctrl+Enter and ⌘ Enter confirm; Shift and Alt with Enter do not', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Suggested onConfirm={onConfirm} />, { wrapper: de })
    const box = screen.getByRole('textbox') as HTMLTextAreaElement
    await user.click(box)
    await user.keyboard('{Enter}')
    expect(box.value).toBe('Seiteneingang.\n')
    expect(onConfirm).not.toHaveBeenCalled()
    await user.keyboard('{Shift>}{Enter}{/Shift}{Alt>}{Enter}{/Alt}')
    expect(onConfirm).not.toHaveBeenCalled()
    await user.keyboard('{Control>}{Enter}{/Control}')
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await user.keyboard('{Meta>}{Enter}{/Meta}')
    expect(onConfirm).toHaveBeenCalledTimes(2)
    // Confirming adds no line.
    expect(box.value.endsWith('\n\n\n\n')).toBe(false)
  })

  it('Ctrl+Enter in a one-line control in the same kind of field still does nothing', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Field label="Fläche" onConfirm={onConfirm}><Input /></Field>)
    await user.type(screen.getByRole('textbox'), '{Control>}{Enter}{/Control}')
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('Escape goes back to the suggestion, and focus stays in the box', async () => {
    const user = userEvent.setup()
    const { container } = render(<Suggested onConfirm={() => {}} />, { wrapper: de })
    const box = screen.getByRole('textbox') as HTMLTextAreaElement
    await user.type(box, ' Lift defekt.')
    expect(container.querySelector('.lcf-field')).not.toHaveAttribute('data-state')
    await user.keyboard('{Escape}')
    expect(box.value).toBe('Seiteneingang.')
    expect(container.querySelector('.lcf-field')).toHaveAttribute('data-state', 'suggested')
    expect(box).toHaveFocus()
  })

  it('refuses to confirm while required and empty, in the table\'s word', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Field label="Grund" required onConfirm={onConfirm}><Textarea /></Field>, { wrapper: de })
    await user.type(screen.getByRole('textbox'), '{Control>}{Enter}{/Control}')
    expect(onConfirm).not.toHaveBeenCalled()
    expect(await said()).toBe('Grund: Pflichtfeld')
  })
})

describe('Textarea: the count reports, it never blocks', () => {
  it('shows "count / limit" for the eye only, and sets no maxlength', () => {
    const { container } = render(<Field label="Notiz"><Textarea characterLimit={120} defaultValue="Eichenparkett" /></Field>, { wrapper: de })
    const count = container.querySelector('.lcf-textarea-count')!
    expect(count).toHaveTextContent('13 / 120')
    expect(count).toHaveAttribute('aria-hidden', 'true')
    expect(count).toHaveAttribute('lang', 'de-CH')
    expect(count).not.toHaveAttribute('data-color')
    expect(screen.getByRole('textbox')).not.toHaveAttribute('maxlength')
  })

  it('past the limit: the count turns danger; the field stays valid, a confirm goes through, the form submits', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onSubmit = vi.fn((e: { preventDefault(): void }) => e.preventDefault())
    const { container } = render(
      <form onSubmit={onSubmit}>
        <Field label="SMS" onConfirm={onConfirm}><Textarea name="sms" characterLimit={5} defaultValue="Seiteneingang" /></Field>
        <button type="submit">Senden</button>
      </form>
    )
    const box = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(container.querySelector('.lcf-textarea-count')).toHaveAttribute('data-color', 'danger')
    expect(box).toHaveAttribute('aria-invalid', 'false')
    expect(box.validity.valid).toBe(true)
    await user.type(box, '{Control>}{Enter}{/Control}')
    expect(onConfirm).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'Senden' }))
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(new FormData(box.form!).get('sms')).toBe('Seiteneingang')
  })

  it('formats both numbers with the reader\'s separators', () => {
    const { container } = render(<Field label="Notiz"><Textarea characterLimit={2000} defaultValue={'x'.repeat(1830)} /></Field>, { wrapper: de })
    expect(container.querySelector('.lcf-textarea-count')).toHaveTextContent("1'830 / 2'000")
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription("Höchstens 2'000 Zeichen.")
  })

  it('counts what a person sees: a decomposed é, a flag and a line break are one each', () => {
    expect(countCharacters('')).toBe(0)
    expect(countCharacters('é')).toBe(1)
    expect(countCharacters('é')).toBe(1)
    expect(countCharacters('🇨🇭')).toBe(1)
    expect('🇨🇭'.length).toBe(4)
    expect(countCharacters('a\nb')).toBe(3)
    expect(Entry.countCharacters).toBe(countCharacters)
  })

  it('follows a controlled value', () => {
    const { container, rerender } = render(<Field label="Notiz"><Textarea characterLimit={10} value="abc" onChange={() => {}} /></Field>)
    expect(container.querySelector('.lcf-textarea-count')).toHaveTextContent('3 / 10')
    rerender(<Field label="Notiz"><Textarea characterLimit={10} value="abcdefghijkl" onChange={() => {}} /></Field>)
    expect(container.querySelector('.lcf-textarea-count')).toHaveTextContent('12 / 10')
    expect(container.querySelector('.lcf-textarea-count')).toHaveAttribute('data-color', 'danger')
  })

  it('says what is left a second after the typing stops — not before, and not once the person has left', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    render(<Field label="SMS"><Textarea characterLimit={160} /></Field>, { wrapper: de })
    const box = screen.getByRole('textbox')
    box.focus()
    fireEvent.change(box, { target: { value: 'x'.repeat(150) } })
    act(() => { vi.advanceTimersByTime(999) })
    expect(await said()).toBe('')
    act(() => { vi.advanceTimersByTime(1) })
    expect(await said()).toBe('Noch 10 Zeichen.')
    expect(region()?.querySelector('span')).toHaveAttribute('lang', 'de-CH')

    fireEvent.change(box, { target: { value: 'x'.repeat(165) } })
    act(() => { vi.advanceTimersByTime(1000) })
    expect(await said()).toBe('5 Zeichen zu viel.')

    fireEvent.change(box, { target: { value: 'x'.repeat(100) } })
    box.blur()
    act(() => { vi.advanceTimersByTime(2000) })
    expect(await said()).toBe('5 Zeichen zu viel.')
  })

  it('in English, one and many', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    render(<Textarea aria-label="Text message" characterLimit={10} />)
    const box = screen.getByRole('textbox')
    box.focus()
    fireEvent.change(box, { target: { value: 'x'.repeat(9) } })
    act(() => { vi.advanceTimersByTime(1000) })
    expect(await said()).toBe('1 character left.')
    fireEvent.change(box, { target: { value: 'x'.repeat(13) } })
    act(() => { vi.advanceTimersByTime(1000) })
    expect(await said()).toBe('3 characters too many.')
  })
})

describe('Textarea: growing', () => {
  it('sets rows, and the rows and the ceiling as custom properties; maxRows under rows is raised, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { rerender } = render(<Textarea aria-label="Notiz" />)
    const box = screen.getByRole('textbox')
    expect(box).toHaveAttribute('rows', '3')
    expect(box.style.getPropertyValue('--c-rows')).toBe('3')
    expect(box.style.getPropertyValue('--c-max-rows')).toBe('10')
    rerender(<Textarea aria-label="Notiz" rows={12} />)
    expect(box.style.getPropertyValue('--c-max-rows')).toBe('12')
    expect(warn).not.toHaveBeenCalled()
    rerender(<Textarea aria-label="Notiz" rows={4} maxRows={2} />)
    expect(box.style.getPropertyValue('--c-max-rows')).toBe('4')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('maxRows (2) is less than rows (4)'))
  })

  it('without field-sizing, measures: the height follows scrollHeight, as the text grows and shrinks', async () => {
    const user = userEvent.setup()
    // jsdom lays nothing out: a line is 22px, padding 12.
    vi.spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLTextAreaElement) {
      return this.value.split('\n').length * 22 + 12
    })
    render(<Textarea aria-label="Notiz" />)
    const box = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(box.style.height).toBe('34px')
    await user.type(box, 'a{Enter}b{Enter}c')
    expect(box.style.height).toBe('78px')
    await user.clear(box)
    expect(box.style.height).toBe('34px')
  })

  it('with field-sizing: content, it leaves the height to the engine', () => {
    const real = window.getComputedStyle.bind(window)
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
      const cs = real(el, pseudo)
      if (!(el instanceof HTMLTextAreaElement)) return cs
      return new Proxy(cs, {
        get: (target, key) => key === 'getPropertyValue'
          ? (p: string) => (p === 'field-sizing' ? 'content' : target.getPropertyValue(p))
          : Reflect.get(target, key, target)
      })
    })
    render(<Textarea aria-label="Notiz" defaultValue={'a\nb\nc\nd'} />)
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).style.height).toBe('')
  })
})

describe('Textarea: bare', () => {
  it('className, style and ref on the <textarea>; native props pass through', () => {
    const ref = createRef<HTMLTextAreaElement>()
    render(<Textarea aria-label="Notiz" ref={ref} className="mine" style={{ inlineSize: '30rem' }} name="note" spellCheck={false} />)
    const box = screen.getByRole('textbox')
    expect(ref.current).toBe(box)
    expect(box).toHaveClass('lcf-textarea-el', 'mine')
    expect(box.style.inlineSize).toBe('30rem')
    expect(box).toHaveAttribute('name', 'note')
    expect(box).toHaveAttribute('spellcheck', 'false')
    expect(box).toHaveAttribute('data-size', 'md')
  })

  it('warns when it has no name, and not with aria-label or a <label for>', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { unmount } = render(<Textarea placeholder="Notiz" />)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Textarea has no name'))
    unmount()
    warn.mockClear()
    render(<><label htmlFor="n">Notiz</label><Textarea id="n" /><Textarea aria-label="Zweite" /></>)
    expect(warn).not.toHaveBeenCalled()
  })

  it('invalid sets aria-invalid and the danger edge', () => {
    render(<Textarea aria-label="Notiz" invalid />)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('textbox')).toHaveAttribute('data-color', 'danger')
  })
})
