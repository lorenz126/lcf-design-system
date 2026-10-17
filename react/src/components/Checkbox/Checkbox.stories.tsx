import type { Meta, StoryObj } from '@storybook/react-vite'
import { useId, useState, type FormEvent } from 'react'
import { fn } from 'storybook/test'
import { Button } from '../Button/Button'
import { Field } from '../Field/Field'
import { Input } from '../Input/Input'
import { NumberField } from '../NumberField/NumberField'
import { Checkbox } from './Checkbox'
import { CheckboxGroup } from './CheckboxGroup'

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  subcomponents: { CheckboxGroup },
  parameters: {
    docs: { subtitle: 'A box with its label beside it — and, several as a CheckboxGroup, the one control a Field holds.' }
  },
  args: { label: 'Scaffolding needed' }
} satisfies Meta<typeof Checkbox>
export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

/* The boxes on their own come first: under a group, at phone width, they
   read as more of its options (measured at 390); above it, the Field's
   label starts the group. */
/** The row under the title: two boxes on their own, a suggested group in a Field, and a required one still empty. */
export const Showcase: Story = {
  tags: ['!autodocs'],
  render: () => (
    <div className="ws-fields">
      <div className="ws-stack">
        <Checkbox label="Prices include VAT" defaultChecked />
        <Checkbox label="Send a copy to the site manager" description="As a PDF, with the plan." />
      </div>
      <Field block label="Work" state="suggested" origin={{ source: 'customer', via: 'email' }} onConfirm={fn()}>
        <CheckboxGroup defaultValue={['painting', 'filling']}>
          <Checkbox value="painting" label="Painting" />
          <Checkbox value="filling" label="Filling" />
          <Checkbox value="wallpaper" label="Wallpapering" />
        </CheckboxGroup>
      </Field>
      <Field block label="Access" required>
        <CheckboxGroup>
          <Checkbox value="lift" label="Lift" />
          <Checkbox value="stairs" label="Stairs only" />
        </CheckboxGroup>
      </Field>
    </div>
  )
}

/** Clear, ticked and mixed; invalid, read-only and disabled, each clear and ticked. */
export const States: Story = {
  render: () => (
    <div className="ws-grid" style={{ ['--cols' as string]: 2 }}>
      <span className="ws-corner" />
      <span className="ws-label ws-col">clear</span>
      <span className="ws-label ws-col">ticked</span>
      <span className="ws-label">default</span>
      <Checkbox label="Primer" />
      <Checkbox label="Primer" defaultChecked />
      <span className="ws-label">mixed</span>
      <Checkbox label="All rooms" indeterminate />
      <span />
      <span className="ws-label">invalid</span>
      <Checkbox label="Terms accepted" invalid />
      <Checkbox label="Terms accepted" invalid defaultChecked />
      <span className="ws-label">read-only</span>
      <Checkbox label="Primer" readOnly />
      <Checkbox label="Primer" readOnly defaultChecked />
      <span className="ws-label">disabled</span>
      <Checkbox label="Primer" disabled />
      <Checkbox label="Primer" disabled defaultChecked />
    </div>
  )
}

/** Guidance under the label is read after the name; a long label wraps beside the box, which stays on its first line. */
export const Description: Story = {
  render: () => (
    <div className="ws-stack">
      <Checkbox label="Scaffolding needed" description="From 3 m working height, on both façades." />
      <Checkbox
        defaultChecked
        label="Protect floors, stairs and every fitted surface on the way from the entrance to the rooms being painted"
        description="Fleece and tape; removed before handover."
      />
    </div>
  )
}

const ROOMS = [
  { value: 'living', label: 'Living room' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bath', label: 'Bathroom' }
]

function Rooms() {
  const [chosen, setChosen] = useState<string[]>(['kitchen'])
  const all = chosen.length === ROOMS.length
  return (
    <Field label="Rooms">
      <CheckboxGroup value={chosen} onValueChange={setChosen}>
        <Checkbox
          label="All rooms"
          checked={all}
          indeterminate={chosen.length > 0 && !all}
          onCheckedChange={on => setChosen(on ? ROOMS.map(r => r.value) : [])}
        />
        <div className="ws-indent">
          {ROOMS.map(r => <Checkbox key={r.value} value={r.value} label={r.label} />)}
        </div>
      </CheckboxGroup>
    </Field>
  )
}

/** "All rooms" is mixed while some are ticked — the app works that out and passes `indeterminate`; a click ticks or clears them all. */
export const Indeterminate: Story = { render: () => <Rooms /> }

/** The box, the tick and the label's type step: 14, 16 and 20px boxes on 13, 15 and 17px text. */
export const Sizes: Story = {
  render: () => (
    <div className="ws-stack">
      {(['sm', 'md', 'lg'] as const).map(size => (
        <Checkbox key={size} size={size} defaultChecked label={`Primer, ${size}`} description="Two coats on new plaster." />
      ))}
    </div>
  )
}

const WORK = [
  { value: 'painting', label: 'Painting', description: 'Walls and ceilings, two coats.' },
  { value: 'filling', label: 'Filling', description: 'Cracks and holes, sanded flush.' },
  { value: 'wallpaper', label: 'Wallpapering' },
  { value: 'scaffold', label: 'Scaffolding', description: 'From 3 m working height.' }
]
const SUGGESTED = ['painting', 'filling']
const same = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i])

/* The recipe, as for a number: Field is told everything; the app keeps
   the value, the suggestion and whether a person confirmed it. The
   group's value comes back in the order the boxes are rendered, so it
   compares with the suggestion element by element. */
function WorkField() {
  const [value, setValue] = useState(SUGGESTED)
  const [confirmed, setConfirmed] = useState(false)
  const atSuggestion = same(value, SUGGESTED)
  return (
    <Field
      block
      required
      label="Work"
      description="What the offer prices."
      state={confirmed ? 'confirmed' : atSuggestion ? 'suggested' : undefined}
      origin={atSuggestion ? { source: 'customer', via: 'email' } : { source: 'staff', by: 'Anna' }}
      suggestion="Painting, Filling"
      onConfirm={() => setConfirmed(true)}
      // Only while there is somewhere to go back to, and nobody has confirmed.
      onRevert={!atSuggestion && !confirmed ? () => setValue(SUGGESTED) : undefined}
    >
      <CheckboxGroup
        name="work"
        value={value}
        onValueChange={v => {
          setValue(v)
          setConfirmed(false)
        }}
      >
        {WORK.map(w => <Checkbox key={w.value} {...w} />)}
        {/* "Other" between the boxes is the group's too: Enter there
            confirms the field and never submits; its Escape is its own. */}
        <Input aria-label="Other work" placeholder="Other work" name="workOther" size="sm" />
      </CheckboxGroup>
    </Field>
  )
}

function AreaField() {
  const [value, setValue] = useState<number | null>(118.5)
  const [confirmed, setConfirmed] = useState(false)
  return (
    <Field block label="Floor area" state={confirmed ? 'confirmed' : 'suggested'} origin="customer" onConfirm={() => setConfirmed(true)}>
      <NumberField unit="m2" min={0} value={value} onValueChange={setValue} />
    </Field>
  )
}

/* Saving is the app's: here it only counts, so a submit Enter must not
   cause can be seen (data-submitted). */
function WorkForm() {
  const [submitted, setSubmitted] = useState(0)
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(n => n + 1)
  }
  return (
    <form className="ws-form" onSubmit={onSubmit} noValidate data-submitted={submitted}>
      <div className="ws-fields">
        <AreaField />
        <WorkField />
      </div>
      <div className="ws-row">
        <Button type="submit" size="sm">Save offer</Button>
      </div>
    </form>
  )
}

/** A group in a Field, by the review recipe: Space ticks, Enter in any box — or in the "other" box after them — confirms and never submits, Escape or ↺ in a box goes back to the suggestion. */
export const InField: Story = { name: 'In a Field', render: () => <WorkForm /> }

/** Required is "at least one": the word and the caution edge on every box while none is ticked, and Enter says why it cannot confirm. */
export const RequiredGroup: Story = {
  name: 'Required group',
  render: () => (
    <Field label="Access" required origin="missing" description="How the crew reaches the flat." onConfirm={fn()}>
      <CheckboxGroup name="access">
        <Checkbox value="lift" label="Lift" />
        <Checkbox value="stairs" label="Stairs only" />
        <Checkbox value="crane" label="Crane for the façade" />
      </CheckboxGroup>
    </Field>
  )
}

/** The Field's error turns every box invalid; disabled and read-only take the group with them, and show no actions. */
export const GroupStates: Story = {
  name: 'Group states',
  render: () => (
    <div className="ws-fields">
      <Field block label="Invalid" error="A lift, or stairs only — not both." origin="customer">
        <CheckboxGroup defaultValue={['lift', 'stairs']}>
          <Checkbox value="lift" label="Lift" />
          <Checkbox value="stairs" label="Stairs only" />
        </CheckboxGroup>
      </Field>
      <Field block label="Disabled" disabled description="Unlocked when the plan arrives." state="suggested" onConfirm={fn()}>
        <CheckboxGroup defaultValue={['lift']}>
          <Checkbox value="lift" label="Lift" />
          <Checkbox value="stairs" label="Stairs only" />
        </CheckboxGroup>
      </Field>
      <Field block label="Read-only" readOnly description="The offer is sent and locked." state="confirmed">
        <CheckboxGroup defaultValue={['lift']}>
          <Checkbox value="lift" label="Lift" />
          <Checkbox value="stairs" label="Stairs only" />
        </CheckboxGroup>
      </Field>
    </div>
  )
}

const POSITIONS = [
  { id: 'p1', name: 'Painting, walls', amount: 'CHF 4,180.00' },
  { id: 'p2', name: 'Filling', amount: 'CHF 620.00' },
  { id: 'p3', name: 'Scaffolding', amount: 'CHF 1,450.00' }
]

function Positions() {
  const prefix = useId()
  return (
    <table className="ws-table">
      <tbody>
        {POSITIONS.map(p => (
          <tr key={p.id}>
            <td><Checkbox aria-labelledby={`${prefix}-${p.id}`} size="sm" /></td>
            <td id={`${prefix}-${p.id}`}>{p.name}</td>
            <td>{p.amount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** No label of its own: a row's box is named by the row's first cell through `aria-labelledby`, which lands on the input. */
export const NamedByItsRow: Story = { name: 'Named by its row', render: () => <Positions /> }
