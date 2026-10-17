import type { Meta, StoryObj } from '@storybook/react-vite'
import { TrendingUp } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { fn } from 'storybook/test'
import { useFormat } from '../../i18n/context'
import type { Unit } from '../../i18n/format'
import { Button } from '../Button/Button'
import { Checkbox } from '../Checkbox/Checkbox'
import { CheckboxGroup } from '../Checkbox/CheckboxGroup'
import { Input } from '../Input/Input'
import { NumberField } from '../NumberField/NumberField'
import { Select } from '../Select/Select'
import { Textarea } from '../Textarea/Textarea'
import type { Origin, OriginSource } from '../types'
import { useField } from './context'
import { Field } from './Field'

const meta = {
  title: 'Components/Field',
  component: Field,
  parameters: {
    docs: { subtitle: 'The label, the words around a control, and where its value came from — wired once, for any control.' }
  },
  args: {
    label: 'Contact person',
    description: 'Who signs the offer.',
    children: <Input />
  }
} satisfies Meta<typeof Field>
export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

/** The row under the title: a suggested price driver, a required field still empty, and a confirmed price. */
export const Showcase: Story = {
  tags: ['!autodocs'],
  render: () => (
    <div className="docs-showcase" data-fill>
      <Field
        block
        label="Floor area"
        state="suggested"
        origin={{ source: 'customer', via: 'email' }}
        hint="Price driver"
        hintIcon={<TrendingUp />}
        onConfirm={fn()}
      >
        <NumberField unit="m2" min={0} defaultValue={118.5} block />
      </Field>
      <Field block label="Contact person" required>
        <Input />
      </Field>
      <Field block label="Price per m²" state="confirmed" origin={{ source: 'staff', by: 'Anna' }}>
        <NumberField unit="CHF" min={0} defaultValue={84} block />
      </Field>
    </div>
  )
}

/** Type into it and the word and the caution edge go: nobody sets them. */
export const Required: Story = {
  args: { label: 'Contact person', required: true, description: undefined }
}

/** The error comes first and the description stays, because it often says how to fix it. */
export const DescriptionAndError: Story = {
  name: 'Description and error',
  args: {
    label: 'E-mail address',
    error: 'This address has no @.',
    description: 'Written as name@company.ch.',
    children: <Input type="email" defaultValue="anna.muster.example.com" />
  }
}

function Edited() {
  const f = useFormat()
  const [value, setValue] = useState<number | null>(124)
  return (
    <Field
      block
      label="Edited"
      origin={{ source: 'staff', by: 'Anna' }}
      suggestion={f.unit(118.5, 'm2')}
      onConfirm={fn()}
      onRevert={value === 118.5 ? undefined : () => setValue(118.5)}
      state={value === 118.5 ? 'suggested' : undefined}
    >
      <NumberField unit="m2" min={0} value={value} onValueChange={setValue} block />
    </Field>
  )
}

/** Suggested, edited (with the way back), confirmed, required and empty, and invalid, side by side. */
export const States: Story = {
  render: () => (
    <div className="ws-fields">
      <Field block label="Suggested" state="suggested" origin="customer" onConfirm={fn()}>
        <NumberField unit="m2" min={0} defaultValue={118.5} block />
      </Field>
      <Edited />
      <Field block label="Confirmed" state="confirmed" origin="customer">
        <NumberField unit="m2" min={0} defaultValue={118.5} block />
      </Field>
      <Field block label="Required, empty" required origin="missing">
        <NumberField unit="m2" min={0} block />
      </Field>
      <Field block label="Invalid" error="More than the building has." origin="customer">
        <NumberField unit="m2" min={0} defaultValue={11850} block />
      </Field>
    </div>
  )
}

const ORIGINS: { label: string; origin: Origin | OriginSource }[] = [
  { label: 'From the customer', origin: 'customer' },
  { label: 'By e-mail', origin: { source: 'customer', via: 'email' } },
  { label: 'By web form', origin: { source: 'customer', via: 'form' } },
  { label: 'Added by a person', origin: { source: 'staff', by: 'Anna' } },
  { label: 'Added, nobody named', origin: 'staff' },
  { label: 'Assumed', origin: 'assumed' },
  { label: 'Missing', origin: 'missing' }
]

/** Every source, both channels, and staff with and without a name. */
export const Origins: Story = {
  render: () => (
    <div className="ws-fields">
      {ORIGINS.map(o => (
        <Field key={o.label} block label={o.label} origin={o.origin}>
          <Input />
        </Field>
      ))}
    </div>
  )
}

/** The app's word for why the field matters, beside the label, spoken after the value. */
export const Hint: Story = {
  args: {
    label: 'Floor area',
    hint: 'Price driver',
    hintIcon: <TrendingUp />,
    description: 'Net, per plan.',
    children: <NumberField unit="m2" min={0} defaultValue={118.5} />
  }
}

interface Row {
  label: string
  unit: Unit
  suggestion: number
  origin: Origin | OriginSource
  hint?: string
  max?: number
}

const OFFER: Row[] = [
  { label: 'Floor area', unit: 'm2', suggestion: 118.5, origin: { source: 'customer', via: 'email' }, hint: 'Price driver' },
  { label: 'Wall area', unit: 'm2', suggestion: 96, origin: { source: 'customer', via: 'email' } },
  { label: 'Price per m²', unit: 'CHF', suggestion: 84, origin: { source: 'customer', via: 'form' }, hint: 'Price driver' },
  { label: 'Discount', unit: 'percent', suggestion: 5, origin: 'assumed', max: 15 },
  { label: 'Distance', unit: 'km', suggestion: 24, origin: 'customer' },
  { label: 'Assembly', unit: 'h', suggestion: 6, origin: 'assumed' }
]

/* The recipe. Field is told everything; the app keeps the value, the
   suggestion and whether a person confirmed it. */
function ReviewField({ row }: { row: Row }) {
  const f = useFormat()
  const [value, setValue] = useState<number | null>(row.suggestion)
  const [confirmed, setConfirmed] = useState(false)
  const atSuggestion = value === row.suggestion
  return (
    <Field
      block
      label={row.label}
      hint={row.hint}
      hintIcon={row.hint && <TrendingUp />}
      state={confirmed ? 'confirmed' : atSuggestion ? 'suggested' : undefined}
      origin={atSuggestion ? row.origin : { source: 'staff', by: 'Anna' }}
      suggestion={f.unit(row.suggestion, row.unit)}
      onConfirm={() => setConfirmed(true)}
      // Only while there is somewhere to go back to, and nobody has confirmed.
      onRevert={!atSuggestion && !confirmed ? () => setValue(row.suggestion) : undefined}
    >
      <NumberField
        block
        unit={row.unit}
        min={0}
        max={row.max}
        value={value}
        onValueChange={v => {
          setValue(v)
          setConfirmed(false)
        }}
      />
    </Field>
  )
}

/* Saving the offer is the app's: here it only counts, so a submit that
   Enter must not cause can be seen (data-submitted). */
function ReviewForm() {
  const [submitted, setSubmitted] = useState(0)
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(n => n + 1)
  }
  return (
    <form className="ws-form" onSubmit={onSubmit} noValidate data-submitted={submitted}>
      <div className="ws-fields" data-testid="review">
        {OFFER.map(row => <ReviewField key={row.label} row={row} />)}
      </div>
      <div className="ws-row">
        <Button type="submit" size="sm">Save offer</Button>
      </div>
    </form>
  )
}

/** Six offer fields in a form, wired by the recipe: Enter confirms and never submits, typing overrides, Escape or ↺ goes back. */
export const Review: Story = { render: () => <ReviewForm /> }

/** An offer section in sm block fields, four columns that wrap at phone width. */
export const Dense: Story = {
  render: () => (
    <div className="ws-fields" data-dense>
      <Field block size="sm" label="Floor area" state="suggested" origin="customer"><NumberField unit="m2" min={0} defaultValue={118.5} /></Field>
      <Field block size="sm" label="Wall area" state="confirmed"><NumberField unit="m2" min={0} defaultValue={96} /></Field>
      <Field block size="sm" label="Room height" origin="assumed"><NumberField unit="m" min={0} defaultValue={2.6} /></Field>
      <Field block size="sm" label="Ceiling" required><NumberField unit="m2" min={0} /></Field>
      <Field block size="sm" label="Price per m²" hint="Price driver"><NumberField unit="CHF" min={0} defaultValue={84} /></Field>
      <Field block size="sm" label="Discount"><NumberField unit="percent" min={0} max={15} defaultValue={5} /></Field>
      <Field block size="sm" label="Site contact"><Input /></Field>
      <Field block size="sm" label="Access" origin="missing" required><Input /></Field>
    </div>
  )
}

/** A table-like row: the label is still the name, and marks, actions and the required word stay visible. */
export const HiddenLabel: Story = {
  name: 'Hidden label',
  render: () => (
    <div className="ws-row">
      <Field hideLabel label="Floor area" state="suggested" origin="customer" onConfirm={fn()}>
        <NumberField unit="m2" min={0} defaultValue={118.5} />
      </Field>
      <Field hideLabel label="Price per m²" state="confirmed">
        <NumberField unit="CHF" min={0} defaultValue={84} />
      </Field>
      <Field hideLabel label="Site contact" required>
        <Input />
      </Field>
    </div>
  )
}

/** The control takes the Field's size; the label does not change. */
export const Sizes: Story = {
  render: () => (
    // Each Field as wide as its control, so its marks stay beside it.
    <div className="ws-stack" style={{ alignItems: 'flex-start' }}>
      {(['sm', 'md', 'lg'] as const).map(size => (
        <Field key={size} size={size} label={`Floor area, ${size}`} origin="customer">
          <NumberField unit="m2" min={0} defaultValue={118.5} />
        </Field>
      ))}
    </div>
  )
}

/** No actions on a field nobody may change. */
export const DisabledAndReadOnly: Story = {
  name: 'Disabled and read-only',
  render: () => (
    <div className="ws-fields">
      <Field block label="Disabled" disabled state="suggested" origin="customer" onConfirm={fn()} description="Unlocked when the plan arrives.">
        <NumberField unit="m2" min={0} defaultValue={118.5} />
      </Field>
      <Field block label="Read-only" readOnly state="suggested" origin="customer" onConfirm={fn()} description="The offer is sent and locked.">
        <NumberField unit="m2" min={0} defaultValue={118.5} />
      </Field>
    </div>
  )
}

/* A control the layer does not have yet, wired by the contract alone:
   the id, the description, required, aria-invalid written either way,
   and data-empty on its box. */
function RoofSelect({ children }: { children: ReactNode }) {
  const field = useField()
  const [value, setValue] = useState('')
  const empty = value === ''
  return (
    <select
      className="ws-select"
      id={field?.id}
      aria-describedby={field?.describedBy}
      required={field?.required}
      aria-invalid={field?.invalid ? 'true' : 'false'}
      data-empty={empty || undefined}
      data-color={field?.required && empty ? 'caution' : undefined}
      value={value}
      onChange={e => setValue(e.target.value)}
    >
      {children}
    </select>
  )
}

/** A native select wired with useField(): the next controls need nothing new from Field. */
export const AnyControl: Story = {
  name: 'Any control',
  render: () => (
    <Field label="Roof" required description="As on the plan." origin={{ source: 'customer', via: 'form' }}>
      <RoofSelect>
        <option value="">Choose…</option>
        <option value="flat">Flat</option>
        <option value="pitched">Pitched</option>
      </RoofSelect>
    </Field>
  )
}

/* The recipe once more, for any value: the app keeps the value, the
   suggestion and whether a person confirmed it; Field is told the rest.
   `same` compares, so a list of ticked boxes can be the value too. */
function useReview<T>(suggestion: T, same: (a: T, b: T) => boolean = Object.is) {
  const [value, setValue] = useState<T>(suggestion)
  const [confirmed, setConfirmed] = useState(false)
  const atSuggestion = same(value, suggestion)
  return {
    value,
    change: (v: T) => {
      setValue(v)
      setConfirmed(false)
    },
    field: {
      state: confirmed ? ('confirmed' as const) : atSuggestion ? ('suggested' as const) : undefined,
      origin: atSuggestion ? ({ source: 'customer', via: 'email' } as const) : ({ source: 'staff', by: 'Anna' } as const),
      onConfirm: () => setConfirmed(true),
      onRevert: !atSuggestion && !confirmed ? () => setValue(suggestion) : undefined
    }
  }
}

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i])

function AllControlsForm() {
  const f = useFormat()
  const [submitted, setSubmitted] = useState(0)
  const contact = useReview('Anna Muster')
  const area = useReview<number | null>(118.5)
  const market = useReview<string | null>('CH')
  const work = useReview(['painting', 'filling'], sameList)
  const note = useReview('Access through the courtyard; the lift is out of order until May.')
  return (
    <form
      className="ws-form"
      noValidate
      data-submitted={submitted}
      onSubmit={e => {
        e.preventDefault()
        setSubmitted(n => n + 1)
      }}
    >
      <div className="ws-stack" data-testid="all-controls">
        <Field block required label="Contact person" suggestion="Anna Muster" {...contact.field}>
          <Input block value={contact.value} onChange={e => contact.change(e.target.value)} />
        </Field>
        <Field block required label="Floor area" suggestion={f.unit(118.5, 'm2')} {...area.field}>
          <NumberField block unit="m2" min={0} value={area.value} onValueChange={area.change} />
        </Field>
        <Field block required label="Market" suggestion="Switzerland" {...market.field}>
          <Select
            block
            value={market.value}
            onValueChange={market.change}
            options={[
              { value: 'CH', label: 'Switzerland' },
              { value: 'AT', label: 'Austria' },
              { value: 'DE', label: 'Germany' }
            ]}
          />
        </Field>
        <Field block required label="Work" suggestion="Painting, Filling" {...work.field}>
          <CheckboxGroup name="work" value={work.value} onValueChange={work.change}>
            <Checkbox value="painting" label="Painting" />
            <Checkbox value="filling" label="Filling" />
            <Checkbox value="wallpapering" label="Wallpapering" />
          </CheckboxGroup>
        </Field>
        {/* No `suggestion` for long text: it would become ↺'s visible label. */}
        <Field block required label="Note for the crew" {...note.field}>
          <Textarea block value={note.value} onChange={e => note.change(e.target.value)} />
        </Field>
      </div>
      <div className="ws-row">
        <Button type="submit" size="sm">Save offer</Button>
      </div>
    </form>
  )
}

/** Input, NumberField, Select, a CheckboxGroup and Textarea in one form, each by the same recipe: suggested, required, Enter (Ctrl+Enter in the note) confirms, a change overrides, Escape or ↺ goes back. */
export const AllControls: Story = { name: 'All controls', render: () => <AllControlsForm /> }
