import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Alert } from './Alert'
import { Button } from '../Button/Button'
import { COLORS } from '../types'

const meta = {
  title: 'Components/Alert',
  component: Alert,
  parameters: { docs: { subtitle: 'What the page says about itself — a condition, not an event.' } },
  args: {
    color: 'caution',
    title: 'Price for Acoboard is open',
    description: 'The offer can be saved, but not sent, until a price is set.'
  }
} satisfies Meta<typeof Alert>
export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

/** The row under the title: one that is done, one that is in the way. */
export const Showcase: Story = {
  tags: ['!autodocs'],
  render: () => (
    <div className="docs-showcase" data-fill>
      <Alert color="success" title="Offer saved" />
      <Alert color="caution" title="Price for Acoboard is open" description="Set it before the offer is sent." />
    </div>
  )
}

/**
 * Every colour. The ground says it and the mark keeps it, held to 3:1; the
 * words stay full-strength, because coloured text on its own tint fell
 * under AA in dark mode.
 */
export const Colors: Story = {
  render: args => (
    <div className="ws-stack">
      {COLORS.map(c => <Alert key={c} {...args} color={c} title={c} />)}
    </div>
  )
}

/** A hairline on the page in place of the tint: the same alert, quieter, for a page that is already tinted around it. */
export const Outline: Story = { args: { variant: 'outline' } }

/** What to do about it, inside it. Small, soft buttons, so the alert stays a statement and does not become a dialog. */
export const Actions: Story = {
  args: { actions: <Button size="sm" variant="soft" color="secondary">Set price</Button> }
}

/** The close label comes from the message table: switch the locale. */
export const Dismissible: Story = { args: { onDismiss: fn() } }

/** Several findings are one alert with a list, not a stack of boxes. */
export const Findings: Story = {
  args: {
    color: 'warning',
    title: 'Two things block sending',
    children: (
      <ul>
        <li>Price for Acoboard is open.</li>
        <li>Express delivery cannot be combined with a discount.</li>
      </ul>
    )
  }
}

/** A title alone, when the condition is the whole message. */
export const TitleOnly: Story = { name: 'Title only', args: { description: undefined, color: 'success', title: 'Saved' } }
