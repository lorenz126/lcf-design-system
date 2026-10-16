import type { Meta, StoryObj } from '@storybook/react-vite'
import { TrendingUp } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { fn } from 'storybook/test'
import { useFormat } from '../../i18n/context'
import type { Unit } from '../../i18n/format'
import { Input } from '../Input/Input'
import { NumberField } from '../NumberField/NumberField'
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

/** Six offer fields wired by the recipe: Enter confirms, typing overrides, ↺ goes back. */
export const Review: Story = {
  render: () => (
    <div className="ws-fields" data-testid="review">
      {OFFER.map(row => <ReviewField key={row.label} row={row} />)}
    </div>
  )
}

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

/** A table-like row: the label is still the name, and marks and actions stay visible. */
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
   the id, the description, required, and data-empty on its box. */
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
