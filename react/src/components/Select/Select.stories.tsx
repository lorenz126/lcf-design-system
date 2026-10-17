import type { Meta, StoryObj } from '@storybook/react-vite'
import { useId, useState, type FormEvent } from 'react'
import { fn } from 'storybook/test'
import { Button } from '../Button/Button'
import { Field } from '../Field/Field'
import type { Origin, OriginSource } from '../types'
import { Select, type SelectGroup, type SelectOption } from './Select'

const MARKETS: SelectOption[] = [
  { value: 'CH', label: 'Switzerland' },
  { value: 'DE', label: 'Germany' },
  { value: 'AT', label: 'Austria' }
]

const UNITS: SelectOption[] = [
  { value: 'm2', label: 'Square metres' },
  { value: 'm', label: 'Running metres' },
  { value: 'pc', label: 'Pieces' },
  { value: 'h', label: 'Hours' },
  { value: 'flat', label: 'Flat rate' }
]

const PRODUCT_LINES: SelectGroup[] = [
  {
    label: 'Ceilings',
    options: [
      { value: 'tiles', label: 'Ceiling tiles' },
      { value: 'baffles', label: 'Baffles' },
      { value: 'islands', label: 'Ceiling islands' }
    ]
  },
  {
    label: 'Walls',
    options: [
      { value: 'panels', label: 'Wall panels' },
      { value: 'frames', label: 'Fabric frames' },
      { value: 'slats', label: 'Wood slats' }
    ]
  },
  {
    label: 'Furniture',
    options: [
      { value: 'screens', label: 'Desk screens' },
      { value: 'booths', label: 'Phone booths' }
    ]
  }
]

/* Two hundred articles, the size of a real catalogue: eight materials,
   five thicknesses, five formats, grouped by material. */
const MATERIALS = ['Acoustic panel', 'Baffle', 'Ceiling tile', 'Fabric frame', 'Gypsum board', 'Mineral wool', 'Perforated board', 'Wood wool']
const THICKNESSES = ['12.5', '15', '20', '25', '40']
const FORMATS = ['600 × 600', '625 × 625', '1200 × 600', '1250 × 625', '2400 × 1200']
const ARTICLES: SelectGroup[] = MATERIALS.map((material, m) => ({
  label: material,
  options: THICKNESSES.flatMap((thickness, t) => FORMATS.map((format, f) => ({
    value: `A${m + 1}${t + 1}${f + 1}`,
    label: `${material}, ${thickness} mm, ${format}`
  })))
}))

const meta = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    docs: { subtitle: 'One choice from a list the app hands over whole: the platform\'s own select, in the frame every field has.' }
  },
  args: { options: MARKETS }
} satisfies Meta<typeof Select>
export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  render: args => (
    <Field label="Market" description="Prices and VAT follow it.">
      <Select {...args} />
    </Field>
  )
}

/** The row under the title: a suggested market, a product line still to choose, and a confirmed unit. */
export const Showcase: Story = {
  tags: ['!autodocs'],
  render: () => (
    <div className="docs-showcase" data-fill>
      <Field block label="Market" state="suggested" origin={{ source: 'customer', via: 'email' }} onConfirm={fn()}>
        <Select block options={MARKETS} defaultValue="CH" />
      </Field>
      <Field block label="Product line" required>
        <Select block options={PRODUCT_LINES} />
      </Field>
      <Field block label="Unit" state="confirmed" origin={{ source: 'staff', by: 'Anna' }}>
        <Select block options={UNITS} defaultValue="m2" />
      </Field>
    </div>
  )
}

/** 22, 26 and 32 pixels, as Input and Button. In a Field the select takes the Field's size; the label does not change. */
export const Sizes: Story = {
  render: () => (
    <div className="ws-stack" style={{ alignItems: 'flex-start' }}>
      {(['sm', 'md', 'lg'] as const).map(size => (
        <Field key={size} size={size} label={`Unit, ${size}`}>
          <Select options={UNITS} defaultValue="m2" />
        </Field>
      ))}
    </div>
  )
}

/**
 * Nothing is chosen until somebody chooses. Required, the placeholder
 * cannot be chosen again and the field says "Required" while it shows;
 * optional, choosing it takes the choice back. The words are the
 * table's unless the app gives its own.
 */
export const Placeholder: Story = {
  render: () => (
    <div className="ws-fields">
      <Field block label="Market" required description="Required: the placeholder is not a choice.">
        <Select block options={MARKETS} />
      </Field>
      <Field block label="Second market" description="Optional: choosing the placeholder clears it.">
        <Select block options={MARKETS} defaultValue="DE" />
      </Field>
      <Field block label="Unit" description="The app's own words.">
        <Select block options={UNITS} placeholder="Unit of the item" />
      </Field>
    </div>
  )
}

/** Options in groups, each with a heading in the list that is not itself a choice. */
export const Groups: Story = {
  render: () => (
    <Field label="Product line" description="As in the price list.">
      <Select options={PRODUCT_LINES} defaultValue="baffles" />
    </Field>
  )
}

/** Two hundred articles in eight groups. A letter jumps to the first article starting with it; on a phone, it is the phone's own picker. */
export const LongList: Story = {
  name: 'Long list',
  render: () => (
    <Field block label="Article" description="Type a letter to jump: “g” for gypsum board.">
      <Select block options={ARTICLES} />
    </Field>
  )
}

/** In the list but not choosable: one market, and a whole group. Say why in the description. */
export const DisabledOptions: Story = {
  name: 'Disabled options',
  render: () => (
    <Field label="Product line" description="Furniture is not offered in this market yet.">
      <Select
        options={[...PRODUCT_LINES.slice(0, 2), { ...PRODUCT_LINES[2]!, disabled: true }]}
        defaultValue="panels"
      />
    </Field>
  )
}

/**
 * A value the list does not offer — a suggestion from an e-mail, a
 * product line since withdrawn — is shown as itself and called wrong,
 * never replaced by the first option and never dropped from the form.
 */
export const NotAChoice: Story = {
  name: 'Not a choice',
  render: () => (
    <div className="ws-fields">
      <Field block label="Market" state="suggested" origin={{ source: 'customer', via: 'email' }}>
        <Select block options={MARKETS} defaultValue="LI" />
      </Field>
      <Field block label="Product line" origin="assumed">
        <Select block options={[...PRODUCT_LINES.slice(0, 2), { ...PRODUCT_LINES[2]!, disabled: true }]} defaultValue="booths" />
      </Field>
    </div>
  )
}

interface Row {
  label: string
  options: (SelectOption | SelectGroup)[]
  suggestion: string | null
  origin: Origin | OriginSource
  required?: boolean
  hint?: string
}

const OFFER: Row[] = [
  { label: 'Market', options: MARKETS, suggestion: 'CH', origin: { source: 'customer', via: 'email' }, required: true },
  { label: 'Product line', options: PRODUCT_LINES, suggestion: 'baffles', origin: { source: 'customer', via: 'form' }, hint: 'Price driver' },
  { label: 'Unit', options: UNITS, suggestion: 'm2', origin: 'assumed' },
  { label: 'Article', options: ARTICLES, suggestion: null, origin: 'missing', required: true }
]

const labelOf = (options: Row['options'], value: string | null) =>
  options.flatMap(o => ('options' in o ? o.options : [o])).find(o => o.value === value)?.label

/* The recipe, as Field's Review story has it for numbers: Field is told
   everything; the app keeps the value, the suggestion and whether a
   person confirmed it. */
function ReviewSelect({ row }: { row: Row }) {
  const [value, setValue] = useState<string | null>(row.suggestion)
  const [confirmed, setConfirmed] = useState(false)
  const atSuggestion = value === row.suggestion
  const suggested = row.suggestion !== null && atSuggestion
  return (
    <Field
      block
      label={row.label}
      hint={row.hint}
      required={row.required}
      state={confirmed ? 'confirmed' : suggested ? 'suggested' : undefined}
      origin={atSuggestion ? row.origin : { source: 'staff', by: 'Anna' }}
      suggestion={labelOf(row.options, row.suggestion)}
      onConfirm={() => setConfirmed(true)}
      // Only while there is somewhere to go back to, and nobody has confirmed.
      onRevert={row.suggestion !== null && !atSuggestion && !confirmed ? () => setValue(row.suggestion) : undefined}
    >
      <Select
        block
        options={row.options}
        value={value}
        onValueChange={v => {
          setValue(v)
          setConfirmed(false)
        }}
      />
    </Field>
  )
}

function ReviewForm() {
  const [submitted, setSubmitted] = useState(0)
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(n => n + 1)
  }
  return (
    <form className="ws-form" onSubmit={onSubmit} noValidate data-submitted={submitted}>
      <div className="ws-fields" data-testid="review">
        {OFFER.map(row => <ReviewSelect key={row.label} row={row} />)}
      </div>
      <div className="ws-row">
        <Button type="submit" size="sm">Save offer</Button>
      </div>
    </form>
  )
}

/** Four choices in an offer, wired by Field's recipe: Enter confirms and never submits, choosing another overrides, Escape or ↺ goes back. */
export const Review: Story = { render: () => <ReviewForm /> }

/** The Field's error makes it invalid; the danger edge doubles, as an Input's does. */
export const Invalid: Story = {
  render: () => (
    <Field label="Unit" error="Hours are not sold by the square metre." description="As in the price list.">
      <Select options={UNITS} defaultValue="h" />
    </Field>
  )
}

/** Disabled: dimmed, not focusable, not posted. Read-only: the choice, focusable and posted, with nothing else to choose. */
export const DisabledAndReadOnly: Story = {
  name: 'Disabled and read-only',
  render: () => (
    <div className="ws-fields">
      <Field block label="Disabled" disabled description="Set once the customer is known.">
        <Select block options={MARKETS} defaultValue="CH" />
      </Field>
      <Field block label="Read-only" readOnly state="confirmed" description="The offer is sent and locked.">
        <Select block options={MARKETS} defaultValue="CH" />
      </Field>
    </div>
  )
}

function BareDemo() {
  const id = useId()
  return (
    <div className="ws-row">
      <span id={id} className="ws-label">Row 3</span>
      <Select aria-label="Unit" aria-describedby={id} size="sm" options={UNITS} defaultValue="pc" />
    </div>
  )
}

/** Outside a Field — a table cell — it needs a name of its own: an `aria-label`, or a `<label for>`. Without one it warns in development. */
export const Bare: Story = { render: () => <BareDemo /> }
