import { clsx } from 'clsx'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import type { Color } from '../types'

export interface BadgeProps extends Omit<ComponentPropsWithRef<'span'>, 'color'> {
  /** What the status means. An app maps its own words onto it once. */
  color?: Color
  /** soft: tint and coloured text (default). solid: for the one status
   *  that must be seen from across the room. outline: on a busy ground. */
  variant?: 'soft' | 'solid' | 'outline'
  /** `sm` for a dense row, `md` everywhere else. */
  size?: 'sm' | 'md'
  /** A leading dot, for status lists where the colour does the work. */
  dot?: boolean
  /** An icon before the label, instead of the dot. */
  icon?: ReactNode
}

/**
 * Badge — a status marker, not a control.
 *
 * FULLY ROUNDED ON PURPOSE. Buttons are never capsules in this system
 * precisely so that a capsule means "this is a label, not a thing you
 * press". There is therefore no `pill` prop: every badge is one.
 *
 * A STATUS PICKS A MEANING, AND THE MEANING PICKS THE HUE. An app maps
 * its own words onto `color` once — draft → secondary, sent → info,
 * won → success, lost → danger, "Lizenz ungeklärt" → caution — and the
 * colour of "lost" is then the same in the offer list, the kanban and
 * the report, because none of them chose a hue.
 *
 * `caution` and `warning` are yellow and orange, which measure 3.2–3.3:1
 * as text on their own tint in light mode: chroma over contrast, since at
 * AA-legible lightness both turn brown. Above the 3:1 floor for UI, below
 * AA for body text — fine for a two-word status, not for a sentence.
 *
 * Not for counts that change while you watch, and not clickable. A
 * filter chip is a ToggleGroup.
 */
export function Badge({ color = 'secondary', variant = 'soft', size = 'md', dot, icon, className, children, ...rest }: BadgeProps) {
  return (
    <span {...rest} className={clsx('lcf-badge', className)} data-color={color} data-variant={variant} data-size={size}>
      {icon ?? (dot ? <span className="lcf-badge-dot" aria-hidden="true" /> : null)}
      {children}
    </span>
  )
}
