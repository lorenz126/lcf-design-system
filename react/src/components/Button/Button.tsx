import { clsx } from 'clsx'
import { useEffect, type ComponentPropsWithRef, type ReactNode } from 'react'
import { useLcf } from '../../i18n/context'
import { Spinner } from '../Spinner/Spinner'
import type { Color, Size, Variant } from '../types'

export interface ButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'color'> {
  color?: Color
  variant?: Variant | 'floating' | 'glass'
  size?: Size
  /** Full width of its container. */
  block?: boolean
  /** Work in progress: a spinner in the leading place, and not pressable. */
  loading?: boolean
  /** Square, for a single icon. Needs `aria-label` — enforced in development. */
  uniform?: boolean
  /** A toggle's state. Renders aria-pressed; omit for an ordinary button. */
  selected?: boolean
  /** Before the label. Replaced by the spinner while loading, so the
   *  button keeps its width. */
  startIcon?: ReactNode
  endIcon?: ReactNode
  /** Navigates instead: rendered through the provider's linkComponent. */
  href?: string
}

/**
 * Button — the first control, and the one every other one is measured
 * against.
 *
 * `color` says what it means, `variant` how loud it is:
 *
 * - `solid` — one per view. The thing you want pressed. White text, always.
 * - `soft` — secondary actions that still carry a colour.
 * - `outline` — neutral secondary: a hairline and the colour as text.
 * - `ghost` — tertiary. Reads as a link with a hit area.
 * - `floating` — solid, lifted off the surface: for actions that sit ON
 *   content rather than in the layout — a sticky bar, an overlay.
 * - `glass` — translucent over a backdrop. Its contrast is whatever is
 *   behind it, so it is for photographs and maps, never a page.

 *
 * NEVER A CAPSULE. The radius is capped at 40% of the height, whatever
 * --r-control says, so that a capsule keeps meaning "a label, not a thing
 * you press" — Badge is fully round, and the two must stay told apart.
 * That is why there is no `pill` here, though the SDK this vocabulary
 * follows has one.
 *
 * Hover on the quiet variants moves the BORDER, not the ground: a ground
 * that shifts toward its own label costs contrast exactly where the
 * pointer is guaranteed to be, and a soft primary at rest is 4.51:1 with
 * nothing to spare.
 *
 * Refuses: a disabled button that does not say why. Disable it and put
 * the reason beside it, or leave it enabled and say the reason on press.
 */
export function Button({
  color = 'primary',
  variant = 'solid',
  size = 'md',
  block,
  loading,
  uniform,
  selected,
  startIcon,
  endIcon,
  href,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const { linkComponent: Link } = useLcf()
  const inert = disabled || loading

  // Enforced rather than documented: an icon-only button with no name is
  // announced as "button" and nothing else.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && uniform && !rest['aria-label'] && !rest['aria-labelledby']) {
      console.warn('[lcf] Button: `uniform` needs an aria-label — the glyph gives a screen reader nothing to announce.')
    }
  }, [uniform, rest])

  const cls = clsx('lcf-button', className)
  const data = {
    'data-color': color,
    'data-variant': variant,
    'data-size': size,
    'data-block': block || undefined,
    'data-uniform': uniform || undefined
  }
  const inner = (
    <>
      {loading ? <Spinner size="inherit" /> : startIcon}
      {children}
      {endIcon}
    </>
  )

  if (href !== undefined) {
    // A link cannot be disabled; it can only stop being a link. So a
    // disabled one renders as a span that says so, not as an <a> that
    // still navigates on middle-click.
    if (inert) {
      return <span className={cls} {...data} aria-disabled="true" aria-busy={loading || undefined}>{inner}</span>
    }
    return <Link href={href} className={cls} {...data}>{inner}</Link>
  }

  return (
    <button
      {...rest}
      type={type}
      className={cls}
      {...data}
      disabled={inert}
      aria-busy={loading || undefined}
      aria-pressed={selected}
    >
      {inner}
    </button>
  )
}
