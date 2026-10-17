import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type FormEvent } from 'react'
import { fn } from 'storybook/test'
import { Button } from '../Button/Button'
import { Field } from '../Field/Field'
import { countCharacters } from './count'
import { Textarea } from './Textarea'

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  parameters: { docs: { subtitle: 'Several lines of text, growing with them. Its label and its words belong to Field.' } },
  args: { placeholder: 'Parking, access, anything the fitters should know' }
} satisfies Meta<typeof Textarea>
export default meta
type Story = StoryObj<typeof meta>

const REMARK = 'Please ring at the side entrance. The lift is out of order until May, so the boards go up the stairs.'
const WORK = 'Remove the old carpet, level the screed where needed, lay 118 m² of oak parquet with a matching skirting.'
// 185 characters: past a text message's 160.
const MESSAGE = `${REMARK} We arrive at 7:30 and need the hall cleared, the furniture out and the heating off.`

export const Base: Story = {
  render: args => (
    <Field label="Notes for the site" description="Printed on the work order, not on the offer.">
      <Textarea {...args} />
    </Field>
  )
}

/** The row under the title: a remark suggested from the customer's e-mail, a description with its count, and a required field still empty. */
export const Showcase: Story = {
  tags: ['!autodocs'],
  render: () => (
    <div className="docs-showcase" data-fill>
      <Field block label="Access" state="suggested" origin={{ source: 'customer', via: 'email' }} onConfirm={fn()}>
        <Textarea block rows={2} defaultValue={REMARK} />
      </Field>
      <Field block label="Scope of work">
        <Textarea block rows={2} characterLimit={300} defaultValue={WORK} />
      </Field>
      <Field block label="Reason for the discount" required>
        <Textarea block rows={2} />
      </Field>
    </div>
  )
}

function GrowDemo() {
  const [value, setValue] = useState('Kitchen first.\nThen the hall.')
  return (
    <Field label="Order of work" description="Two lines when empty, six at most; past six it scrolls.">
      <Textarea rows={2} maxRows={6} value={value} onChange={e => setValue(e.target.value)} />
    </Field>
  )
}

/** It grows with its text, from `rows` to `maxRows`, and then scrolls. Type a few lines into it. */
export const Grows: Story = { render: () => <GrowDemo /> }

/** One height: `maxRows` equal to `rows`. It scrolls once the text is longer. */
export const FixedHeight: Story = {
  name: 'Fixed height',
  render: () => (
    <Field label="Internal note">
      <Textarea rows={4} maxRows={4} defaultValue={`${WORK}\n\n${REMARK}\n\nCheck the moisture of the screed before anything is laid.`} />
    </Field>
  )
}

/**
 * A count beside the box, never a wall: under the limit, and past it.
 * Past it, the count turns danger and its numbers say by how much;
 * nothing is cut, and the field is not invalid until the app says so.
 */
export const CharacterLimit: Story = {
  name: 'Character limit',
  render: () => (
    <div className="ws-stack">
      <Field label="Short description" description="Shown in the offer's list of items.">
        <Textarea rows={2} characterLimit={120} defaultValue="Oak parquet, 118 m², with skirting." />
      </Field>
      <Field label="Text message to the customer" description="Sent the day before the fitting.">
        <Textarea rows={2} characterLimit={160} defaultValue={MESSAGE} />
      </Field>
    </div>
  )
}

/** Three steps of the type ramp: 13, 15 and 17 pixels on lines of 18, 22 and 26, so `rows` is exact at every size. */
export const Sizes: Story = {
  render: () => (
    <div className="ws-stack">
      <Field label="Small" size="sm"><Textarea rows={2} defaultValue={WORK} /></Field>
      <Field label="Medium"><Textarea rows={2} defaultValue={WORK} /></Field>
      <Field label="Large" size="lg"><Textarea rows={2} defaultValue={WORK} /></Field>
    </div>
  )
}

function InFieldDemo() {
  const [value, setValue] = useState(REMARK)
  const [confirmed, setConfirmed] = useState(false)
  const at = value === REMARK
  return (
    <div className="ws-stack">
      <Field
        block
        label="Access"
        description="From the customer's e-mail of 12 October."
        state={confirmed ? 'confirmed' : at ? 'suggested' : undefined}
        origin={at ? { source: 'customer', via: 'email' } : { source: 'staff', by: 'Anna' }}
        onConfirm={() => setConfirmed(true)}
        // Only while there is somewhere to go back to, and nobody has confirmed.
        onRevert={!at && !confirmed ? () => setValue(REMARK) : undefined}
      >
        <Textarea
          block
          rows={2}
          value={value}
          onChange={e => {
            setValue(e.target.value)
            setConfirmed(false)
          }}
        />
      </Field>
    </div>
  )
}

/**
 * Suggested from the customer's e-mail, wired as Field's Review recipe:
 * Ctrl+Enter (or ⌘ Enter) confirms, since Enter is a new line; typing
 * overrides it; Escape or ↺ brings the suggestion back. No `suggestion`
 * text on the Field: it would be ↺'s label, and a paragraph is not one.
 */
export const InField: Story = { name: 'In a field', render: () => <InFieldDemo /> }

function EnforcedDemo() {
  const [value, setValue] = useState(MESSAGE)
  // The app's verdict, counted the way the count is.
  const tooLong = countCharacters(value) > 160
  return (
    <Field
      label="Text message to the customer"
      error={tooLong ? 'A text message holds 160 characters. Shorten it before sending.' : undefined}
      description="Sent the day before the fitting."
    >
      <Textarea rows={2} characterLimit={160} value={value} onChange={e => setValue(e.target.value)} />
    </Field>
  )
}

/** The verdict is the app's: here it refuses to send past 160 characters, counted with `countCharacters`, so its error and the count agree. */
export const Invalid: Story = { render: () => <EnforcedDemo /> }

/** Required and empty: the Field's word and the caution edge, until something is typed. */
export const Required: Story = {
  render: () => (
    <Field label="Reason for the discount" required>
      <Textarea rows={2} />
    </Field>
  )
}

/** No actions on a field nobody may change: dimmed when disabled, the quiet ground when read-only. */
export const DisabledAndReadOnly: Story = {
  name: 'Disabled and read-only',
  render: () => (
    <div className="ws-stack">
      <Field label="Notes for the site" disabled description="Unlocked when the plan arrives.">
        <Textarea rows={2} />
      </Field>
      <Field label="Scope of work" readOnly state="suggested" origin="customer" onConfirm={fn()} description="The offer is sent and locked.">
        <Textarea rows={2} defaultValue={WORK} />
      </Field>
    </div>
  )
}

function InFormDemo() {
  const [posted, setPosted] = useState<string>()
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPosted(`${countCharacters(String(new FormData(e.currentTarget).get('note') ?? ''))} characters`)
  }
  return (
    <form className="ws-stack" onSubmit={onSubmit} onReset={() => setPosted(undefined)}>
      <Field label="Note" description="Forty characters at most, and longer is still saved.">
        <Textarea name="note" rows={2} characterLimit={40} defaultValue="Bring the long ladder and the dust sheets." />
      </Field>
      <div className="ws-row">
        <Button type="submit" size="sm">Save</Button>
        <Button type="reset" size="sm" variant="outline" color="secondary">Reset</Button>
        {posted && <output className="ws-label">Posted: {posted}</output>}
      </div>
    </form>
  )
}

/** A native textarea in a form: it posts under `name`, a reset puts it back, and past its limit it still submits. */
export const InForm: Story = { name: 'In a form', render: () => <InFormDemo /> }

/** Outside a Field it needs a name of its own: an `aria-label`, or a `<label for>`. Without one it warns in development. */
export const Bare: Story = {
  args: { 'aria-label': 'Notes for the site', rows: 2 }
}
