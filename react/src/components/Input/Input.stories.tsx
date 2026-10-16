import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtSign, Eye, EyeOff, Search } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '../Button/Button'
import { Field } from '../Field/Field'
import { Input } from './Input'

const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: { docs: { subtitle: 'One line of text. Its label and its words belong to Field.' } },
  args: { placeholder: 'Anna Muster' }
} satisfies Meta<typeof Input>
export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  render: args => (
    <Field label="Contact person" description="Who signs the offer.">
      <Input {...args} />
    </Field>
  )
}

/** The row under the title: the three sizes, each beside the Button it lines up with. */
export const Showcase: Story = {
  tags: ['!autodocs'],
  render: () => (
    <div className="docs-showcase">
      {(['sm', 'md', 'lg'] as const).map(size => (
        <span key={size} className="ws-row" style={{ gap: 'var(--s-3)' }}>
          <Input size={size} aria-label={`Offer number, ${size}`} placeholder="2026-0142" />
          <Button size={size} variant="outline" color="secondary">Find</Button>
        </span>
      ))}
    </div>
  )
}

/** 22, 26 and 32 pixels, as Button. In a Field the control takes the Field's size; the label does not change. */
export const Sizes: Story = {
  render: () => (
    <div className="ws-stack">
      <Field label="Small" size="sm"><Input /></Field>
      <Field label="Medium"><Input /></Field>
      <Field label="Large" size="lg"><Input /></Field>
    </div>
  )
}

function PasswordToggle() {
  const [shown, setShown] = useState(false)
  return (
    <Field label="Portal password">
      <Input
        type={shown ? 'text' : 'password'}
        endAdornment={
          <Button size="sm" variant="ghost" color="secondary" uniform aria-label={shown ? 'Hide password' : 'Show password'} onClick={() => setShown(s => !s)}>
            {shown ? <EyeOff /> : <Eye />}
          </Button>
        }
      />
    </Field>
  )
}

/** Before and after the text. A click on a mark lands in the text; a button in an adornment stays a button. */
export const Adornments: Story = {
  render: () => (
    <div className="ws-stack">
      <Field label="Search offers"><Input startAdornment={<Search />} placeholder="Number or customer" /></Field>
      <Field label="Website"><Input type="url" startAdornment="https://" /></Field>
      <PasswordToggle />
    </div>
  )
}

/** The text types. Numbers, dates and search have components of their own, so they are not here. */
export const Types: Story = {
  render: () => (
    <div className="ws-stack">
      <Field label="Name"><Input type="text" autoComplete="name" /></Field>
      <Field label="E-mail address"><Input type="email" autoComplete="email" startAdornment={<AtSign />} /></Field>
      <Field label="Phone"><Input type="tel" autoComplete="tel" /></Field>
      <Field label="Website"><Input type="url" /></Field>
      <Field label="Password"><Input type="password" autoComplete="current-password" /></Field>
    </div>
  )
}

function InvalidBare() {
  const id = useId()
  return (
    <div className="ws-stack">
      <Input aria-label="Order reference" invalid defaultValue="2026-01" aria-describedby={id} />
      <p id={id} className="ws-label" style={{ margin: 0 }}>Row 3: an order reference has four digits after the year.</p>
    </div>
  )
}

/**
 * In a Field, the Field's `error` makes the control invalid. Bare — a
 * table cell with a summary elsewhere — `invalid` does, and the app
 * places its own words and points at them.
 */
export const Invalid: Story = {
  render: () => (
    <div className="ws-stack">
      <Field label="E-mail address" error="This address has no @." description="The offer is sent here.">
        <Input type="email" defaultValue="anna.muster.example.com" />
      </Field>
      <InvalidBare />
    </div>
  )
}

/** Dimmed, and not focusable. Say why beside it; a disabled field that does not is a dead end. */
export const Disabled: Story = {
  render: () => (
    <Field label="Customer number" disabled description="Assigned when the offer is sent.">
      <Input />
    </Field>
  )
}

/** Read, selected and copied, never changed: a locked offer. The quiet ground says so; the edge stays a field's. */
export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => (
    <Field label="Offer number" readOnly>
      <Input defaultValue="2026-0142" />
    </Field>
  )
}

/** Outside a Field it needs a name of its own: an `aria-label`, or a `<label for>`. Without one it warns in development. */
export const Bare: Story = {
  args: { 'aria-label': 'Search offers', startAdornment: <Search />, placeholder: 'Number or customer' }
}
