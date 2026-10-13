import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { LcfProvider } from '../i18n/context'
import { Alert } from './Alert/Alert'
import { Badge } from './Badge/Badge'
import { Button } from './Button/Button'
import { Spinner } from './Spinner/Spinner'

const de = ({ children }: { children: ReactNode }) => <LcfProvider locale="de-CH">{children}</LcfProvider>

describe('Button', () => {
  it('renders the vocabulary as data attributes, which is all its CSS reads', () => {
    render(<Button color="danger" variant="soft" size="lg">Delete</Button>)
    const b = screen.getByRole('button', { name: 'Delete' })
    expect(b).toHaveAttribute('data-color', 'danger')
    expect(b).toHaveAttribute('data-variant', 'soft')
    expect(b).toHaveAttribute('data-size', 'lg')
    expect(b).toHaveAttribute('type', 'button')
  })

  it('loading is busy and not pressable, and keeps its label', async () => {
    const onClick = vi.fn()
    render(<Button loading onClick={onClick}>Save</Button>)
    const b = screen.getByRole('button', { name: 'Save' })
    expect(b).toBeDisabled()
    expect(b).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(b)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('is a toggle only when told: aria-pressed appears with `selected`', () => {
    const { rerender } = render(<Button>Plain</Button>)
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed')
    rerender(<Button selected>On</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('warns when a uniform (icon-only) button has no name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<Button uniform>×</Button>)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('aria-label'))
    warn.mockRestore()
  })

  it('with href, renders the provider link component', () => {
    const Link = ({ href, children, className }: { href: string; children?: ReactNode; className?: string }) =>
      <a href={href} className={className} data-router="yes">{children}</a>
    render(<LcfProvider linkComponent={Link}><Button href="/offers">Offers</Button></LcfProvider>)
    expect(screen.getByRole('link', { name: 'Offers' })).toHaveAttribute('data-router', 'yes')
  })

  it('a disabled link stops being a link rather than navigating on middle-click', () => {
    render(<Button href="/offers" disabled>Offers</Button>)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('Offers')).toHaveAttribute('aria-disabled', 'true')
  })
})

describe('Alert', () => {
  it('is not a live region unless it announces, and danger interrupts', () => {
    const { rerender } = render(<Alert title="Locked" />)
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    rerender(<Alert title="Saved" color="success" announce />)
    expect(screen.getByRole('status')).toHaveTextContent('Saved')
    rerender(<Alert title="Failed" color="danger" announce />)
    expect(screen.getByRole('alert')).toHaveTextContent('Failed')
  })

  it('names its close button in the app language, with the title', async () => {
    const onDismiss = vi.fn()
    render(<Alert title="Preis offen" onDismiss={onDismiss} />, { wrapper: de })
    await userEvent.click(screen.getByRole('button', { name: 'Ausblenden: Preis offen' }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})

describe('Spinner', () => {
  it('is silent by default and speaks the locale when labelled', () => {
    const { container, rerender } = render(<Spinner />, { wrapper: de })
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    rerender(<Spinner labelled />)
    expect(screen.getByRole('status', { name: 'Wird geladen' })).toBeInTheDocument()
  })
})

describe('Badge', () => {
  it('defaults to a neutral soft status', () => {
    render(<Badge>Draft</Badge>)
    const b = screen.getByText('Draft')
    expect(b).toHaveAttribute('data-color', 'secondary')
    expect(b).toHaveAttribute('data-variant', 'soft')
  })
})
