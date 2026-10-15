import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowRight, Plus, Trash2 } from 'lucide-react'
import { Button } from './Button'
import { COLORS } from '../types'

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: { docs: { subtitle: 'Actions, from the one you want pressed to the ones you do not.' } },
  args: { children: 'Save offer', color: 'primary', variant: 'solid', size: 'md' }
} satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

const VARIANTS = ['solid', 'soft', 'outline', 'ghost'] as const

/** Every colour in every variant. The grid the contrast check measures. */
export const Colors: Story = {
  render: () => (
    <div className="ws-grid">
      <span />
      {VARIANTS.map(v => <span key={v} className="ws-label">{v}</span>)}
      {COLORS.map(c => (
        <div key={c} style={{ display: 'contents' }}>
          <span className="ws-label">{c}</span>
          {VARIANTS.map(v => <Button key={v} color={c} variant={v}>{c}</Button>)}
        </div>
      ))}
    </div>
  )
}

export const Sizes: Story = {
  render: args => (
    <div className="ws-row">
      <Button {...args} size="sm">Small</Button>
      <Button {...args} size="md">Medium</Button>
      <Button {...args} size="lg">Large</Button>
    </div>
  )
}

export const Icons: Story = {
  render: args => (
    <div className="ws-row">
      <Button {...args} startIcon={<Plus />}>New position</Button>
      <Button {...args} variant="soft" endIcon={<ArrowRight />}>Continue</Button>
      <Button {...args} variant="ghost" color="danger" uniform aria-label="Delete position"><Trash2 /></Button>
    </div>
  )
}

/** The spinner takes the leading icon's place, so the width does not move. */
export const Loading: Story = {
  render: args => (
    <div className="ws-row">
      <Button {...args} startIcon={<Plus />}>Save offer</Button>
      <Button {...args} loading startIcon={<Plus />}>Save offer</Button>
    </div>
  )
}

export const Disabled: Story = { args: { disabled: true } }

/** A toggle that is on takes the neutral "here", not the colour. */
export const Selected: Story = {
  render: () => (
    <div className="ws-row">
      <Button variant="outline" color="secondary" selected={false}>Net</Button>
      <Button variant="outline" color="secondary" selected>Gross</Button>
    </div>
  )
}

export const Block: Story = { args: { block: true } }

/** Rendered through the provider's linkComponent. */
export const Link: Story = { args: { href: '#offers', children: 'All offers', variant: 'soft' } }

/** Floating lifts off the surface; glass needs something behind it. */
export const OnContent: Story = {
  render: () => (
    <div className="ws-backdrop ws-row">
      <Button variant="floating" startIcon={<Plus />}>Add</Button>
      <Button variant="glass" color="secondary">Glass</Button>
    </div>
  )
}
