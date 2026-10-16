import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShieldQuestion } from 'lucide-react'
import { Badge } from './Badge'
import { COLORS, type Color } from '../types'

const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    docs: {
      subtitle: 'A status marker. A status picks a meaning; the meaning picks the colour.',
      canvas: { layout: 'centered' }
    }
  },
  argTypes: { children: { description: 'The status, in the app\'s own word for it. Two words, not a sentence.' } },
  args: { children: 'Sent', color: 'info' }
} satisfies Meta<typeof Badge>
export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

/** The app's statuses and what each means — StatusMap says why. */
const OFFER_STATUS: Record<string, { label: string; color: Color }> = {
  draft: { label: 'Draft', color: 'secondary' },
  approved: { label: 'Approved', color: 'primary' },
  sent: { label: 'Sent', color: 'info' },
  won: { label: 'Won', color: 'success' },
  lost: { label: 'Lost', color: 'danger' }
}

/** The row under the title: the offer statuses, as an app maps them. */
export const Showcase: Story = {
  tags: ['!autodocs'],
  render: () => (
    <div className="docs-showcase">
      {Object.entries(OFFER_STATUS).map(([k, s]) => <Badge key={k} color={s.color} dot>{s.label}</Badge>)}
    </div>
  )
}

/**
 * Every colour in every variant. `caution` and `warning` measure 3.2–3.3:1
 * as text on their own tint in light: above the 3:1 floor, fine for a
 * two-word status and not for a sentence.
 */
export const Colors: Story = {
  render: () => (
    <div className="ws-grid" style={{ ['--cols' as string]: 3 }}>
      <span />
      {(['soft', 'solid', 'outline'] as const).map(v => <span key={v} className="ws-label">{v}</span>)}
      {COLORS.map(c => (
        <div key={c} style={{ display: 'contents' }}>
          <span className="ws-label">{c}</span>
          {(['soft', 'solid', 'outline'] as const).map(v => <Badge key={v} color={c} variant={v}>{c}</Badge>)}
        </div>
      ))}
    </div>
  )
}

/**
 * How an app gives its statuses a fixed meaning: one map, written once,
 * and every list, board and report reads it.
 */
export const StatusMap: Story = {
  name: 'Status map',
  render: () => (
    <div className="ws-row">
      {Object.entries(OFFER_STATUS).map(([k, s]) => <Badge key={k} color={s.color} dot>{s.label}</Badge>)}
    </div>
  )
}

/** Two sizes: `sm` for a dense row, `md` everywhere else. */
export const Sizes: Story = {
  render: args => (
    <div className="ws-row">
      <Badge {...args} size="sm">Small</Badge>
      <Badge {...args} size="md">Medium</Badge>
    </div>
  )
}

/** An icon in place of the dot, when the status has to be told apart without its colour. */
export const WithIcon: Story = {
  name: 'With icon',
  args: { color: 'caution', icon: <ShieldQuestion />, children: 'Licence unresolved' }
}
