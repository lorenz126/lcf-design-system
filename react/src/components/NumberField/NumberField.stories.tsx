import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type FormEvent } from 'react'
import { LcfProvider, useFormat } from '../../i18n/context'
import type { Unit } from '../../i18n/format'
import { Button } from '../Button/Button'
import { Field } from '../Field/Field'
import { NumberField } from './NumberField'

const meta = {
  title: 'Components/NumberField',
  component: NumberField,
  parameters: { docs: { subtitle: 'A quantity with its unit, typed in the reader\'s own separators and kept as a number.' } },
  args: { unit: 'm2', min: 0, defaultValue: 118.5 }
} satisfies Meta<typeof NumberField>
export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  render: args => (
    <Field label="Floor area" description="Net, per plan.">
      <NumberField {...args} />
    </Field>
  )
}

/** The row under the title: an area, a price and a share, their numbers on one edge. */
export const Showcase: Story = {
  tags: ['!autodocs'],
  render: () => (
    <div className="docs-showcase">
      <Field label="Floor area"><NumberField unit="m2" min={0} defaultValue={118.5} /></Field>
      <Field label="Price per m²"><NumberField unit="CHF" min={0} defaultValue={84} /></Field>
      <Field label="Discount"><NumberField unit="percent" min={0} max={15} defaultValue={5} /></Field>
    </div>
  )
}

const UNITS: { unit: Unit; label: string; value: number }[] = [
  { unit: 'm2', label: 'Floor area', value: 118.5 },
  { unit: 'm3', label: 'Volume', value: 310 },
  { unit: 'm', label: 'Room height', value: 2.6 },
  { unit: 'mm', label: 'Board thickness', value: 12.5 },
  { unit: 'cm', label: 'Joint width', value: 1.5 },
  { unit: 'km', label: 'Distance', value: 24 },
  { unit: 'kg', label: 'Weight per board', value: 9.8 },
  { unit: 'h', label: 'Assembly', value: 6 },
  { unit: 'percent', label: 'Discount', value: 5 },
  { unit: 'CHF', label: 'Price per m²', value: 84 },
  { unit: 'EUR', label: 'Supplier price', value: 61.4 }
]

/** All eleven. The unit is a column at the end, and part of the name: "Floor area square metres". */
export const Units: Story = {
  render: () => (
    <div className="ws-fields">
      {UNITS.map(u => (
        <Field key={u.unit} label={u.label}><NumberField unit={u.unit} min={0} defaultValue={u.value} /></Field>
      ))}
    </div>
  )
}

/** One value, three ways: each provider writes and reads its own separators. Type "1.234,5" into the Austrian one. */
export const Separators: Story = {
  render: () => (
    <div className="ws-fields">
      {['de-CH', 'de-AT', 'en-GB'].map(locale => (
        <LcfProvider key={locale} locale={locale}>
          <Field label={locale}><NumberField unit="CHF" min={0} defaultValue={10410.5} /></Field>
        </LcfProvider>
      ))}
    </div>
  )
}

/** Out of range says so at once, and keeps the number: it is never clamped, or emptied. */
export const Range: Story = {
  render: () => (
    <div className="ws-fields">
      <Field label="Discount"><NumberField unit="percent" min={0} max={15} defaultValue={20} /></Field>
      <Field label="Order quantity" description="The supplier takes ten or more."><NumberField min={10} defaultValue={4} /></Field>
    </div>
  )
}

/** A grid of 0.05: off it, it says so; the arrow keys move along it, and snap onto it first. */
export const Step: Story = {
  render: () => (
    <Field label="Price per m²" description="Rounded to five centimes.">
      <NumberField unit="CHF" min={0} step={0.05} defaultValue={84.33} />
    </Field>
  )
}

/** − and + for the pointer, outside the Tab order; the arrow keys are the keyboard's. At md and lg only. */
export const Stepper: Story = {
  render: () => (
    <div className="ws-stack">
      <Field label="Layers"><NumberField stepper min={1} max={4} defaultValue={2} /></Field>
      <Field label="Layers, large" size="lg"><NumberField stepper min={1} max={4} defaultValue={2} /></Field>
    </div>
  )
}

/** Two digits always shown for a currency, and never rounded: 10.555 stays 10.555. */
export const Money: Story = {
  render: () => (
    <div className="ws-fields">
      <Field label="Unit price"><NumberField unit="CHF" min={0} defaultValue={10.555} /></Field>
      <Field label="Supplier price"><NumberField unit="EUR" min={0} defaultValue={1250} /></Field>
    </div>
  )
}

/** Below zero allowed, so the phone gets the full keyboard: the decimal pad has no minus. */
export const Negative: Story = {
  render: () => (
    <Field label="Correction" description="Up to 20 off.">
      <NumberField unit="percent" min={-20} max={0} defaultValue={-5} />
    </Field>
  )
}

function ControlledDemo() {
  const [value, setValue] = useState<number | null>(118.5)
  return (
    <div className="ws-stack">
      <Field label="Floor area" description="The buttons set the value from outside; the box follows unless it is being typed in.">
        <NumberField unit="m2" min={0} value={value} onValueChange={setValue} />
      </Field>
      <div className="ws-row">
        <Button size="sm" variant="outline" color="secondary" onClick={() => setValue(120)}>Set 120</Button>
        <Button size="sm" variant="outline" color="secondary" onClick={() => setValue(null)}>Clear</Button>
      </div>
    </div>
  )
}

/** The app owns the number; the field keeps only what is being typed. */
export const Controlled: Story = { render: () => <ControlledDemo /> }

function InFormDemo() {
  const [posted, setPosted] = useState<string>()
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPosted(new URLSearchParams(new FormData(e.currentTarget) as unknown as Record<string, string>).toString())
  }
  return (
    <form className="ws-stack" onSubmit={onSubmit}>
      <Field label="Floor area"><NumberField unit="m2" min={0} name="area" defaultValue={1234.5} /></Field>
      <div className="ws-row">
        <Button type="submit" size="sm">Save</Button>
        {posted && <output className="ws-label">Posted: {posted}</output>}
      </div>
    </form>
  )
}

/** A hidden input posts the canonical number under `name`: 1234.5, not "1'234.5". */
export const InForm: Story = { name: 'In a form', render: () => <InFormDemo /> }

function InFieldDemo() {
  const f = useFormat()
  const suggested = 118.5
  const [value, setValue] = useState<number | null>(suggested)
  const [confirmed, setConfirmed] = useState(false)
  const at = value === suggested
  return (
    <Field
      label="Floor area"
      state={confirmed ? 'confirmed' : at ? 'suggested' : undefined}
      origin={at ? { source: 'customer', via: 'email' } : { source: 'staff', by: 'Anna' }}
      suggestion={f.unit(suggested, 'm2')}
      onConfirm={() => setConfirmed(true)}
      onRevert={!at && !confirmed ? () => setValue(suggested) : undefined}
    >
      <NumberField unit="m2" min={0} value={value} onValueChange={v => { setValue(v); setConfirmed(false) }} />
    </Field>
  )
}

/** Suggested by the customer: Enter confirms it, typing overrides it, ↺ brings it back. */
export const InField: Story = { name: 'In a field', render: () => <InFieldDemo /> }
