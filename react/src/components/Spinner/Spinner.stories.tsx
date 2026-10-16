import type { Meta, StoryObj } from '@storybook/react-vite'
import { Spinner } from './Spinner'

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    docs: {
      subtitle: 'Work is happening, and nobody knows for how long.',
      canvas: { layout: 'centered' }
    }
  },
  args: { labelled: true }
} satisfies Meta<typeof Spinner>
export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

/** The row under the title: the three sizes, and one beside the words. */
export const Showcase: Story = {
  tags: ['!autodocs'],
  render: () => (
    <div className="docs-showcase">
      <Spinner size="sm" labelled />
      <Spinner size="md" labelled />
      <Spinner size="lg" labelled />
      <span className="docs-showcase-pair"><Spinner size="sm" /> Loading offers…</span>
    </div>
  )
}

/** Three sizes, and `inherit`, which takes the font size around it — the size a button gives its spinner. */
export const Sizes: Story = {
  render: () => (
    <div className="ws-row">
      <Spinner size="sm" labelled />
      <Spinner size="md" labelled />
      <Spinner size="lg" labelled />
      <span style={{ fontSize: 28 }}><Spinner size="inherit" labelled /></span>
    </div>
  )
}

/** Beside text that says it, the spinner stays silent. */
export const BesideText: Story = {
  name: 'Beside text',
  render: () => (
    <div className="ws-row"><Spinner /> <span>Loading offers…</span></div>
  )
}
