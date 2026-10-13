import { clsx } from 'clsx'
import { useMessages } from '../../i18n/context'

export interface SpinnerProps {
  /** `inherit` takes the surrounding font size — inside a button. */
  size?: 'sm' | 'md' | 'lg' | 'inherit'
  /** Announce it, with the locale's "Loading". Omit beside text that says it. */
  labelled?: boolean
  /** A label of its own, when "Loading" is not the right word. */
  label?: string
  className?: string
}

/**
 * Spinner — work is happening and nobody knows how long it will take.
 *
 * REDUCED MOTION SLOWS IT, IT DOES NOT STOP IT. Everything else in the
 * system collapses to 1ms under prefers-reduced-motion, which is right
 * for a transition — the end state is the point. A stopped spinner is
 * not a finished spinner, it is a frozen one, and it says the opposite
 * of what it is there to say. Two seconds a turn is calm and still
 * clearly alive.
 *
 * Decorative by default: it usually sits beside the word that says what
 * is loading. `labelled` gives it a name of its own — the app's word for
 * "Loading", from the message table — for when it stands alone.
 *
 * Not a progress bar. When the share done is known, show the share.
 */
export function Spinner({ size = 'md', labelled, label, className }: SpinnerProps) {
  const t = useMessages()
  const name = label ?? (labelled ? t('loading') : undefined)
  return (
    <span
      className={clsx('lcf-spinner', className)}
      data-size={size}
      data-motion="essential"
      role={name ? 'status' : undefined}
      aria-label={name}
      aria-hidden={name ? undefined : true}
    />
  )
}
