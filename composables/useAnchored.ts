/**
 * Positions a floating element against a trigger.
 *
 * Deliberately JavaScript rather than CSS anchor positioning. Anchor
 * positioning is the better answer and needs none of this — but it is
 * Chromium-only today, and supporting both paths doubles the surface that
 * has to be tested for one of them to be dead code. When support is
 * broad, this whole file is deletable and the components keep their API.
 *
 * The floating element is expected to be in the TOP LAYER (via popover or
 * <dialog>), so viewport coordinates are all that is needed — no offset
 * parent to walk, no z-index to fight, no clipping from an ancestor's
 * overflow.
 */
export type Placement = 'top' | 'bottom' | 'left' | 'right'

/** Keeps the panel this far from the viewport edge and the trigger. */
const EDGE = 8
const GAP = 6

export function useAnchored(
  trigger: Ref<HTMLElement | null | undefined>,
  floating: Ref<HTMLElement | null | undefined>,
  placement: Ref<Placement> | Placement = 'bottom'
) {
  const place = () => {
    const t = unref(trigger)
    const f = unref(floating)
    if (!t || !f) return

    const want = unref(placement)
    const a = t.getBoundingClientRect()
    const b = f.getBoundingClientRect()
    const vw = document.documentElement.clientWidth
    const vh = document.documentElement.clientHeight

    // Flip to the opposite side when the preferred one does not fit, but
    // only if the opposite actually has more room — flipping into an even
    // tighter space is worse than overflowing slightly.
    const room = {
      top: a.top,
      bottom: vh - a.bottom,
      left: a.left,
      right: vw - a.right
    }
    const need = { top: b.height + GAP, bottom: b.height + GAP, left: b.width + GAP, right: b.width + GAP }
    const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const

    let side: Placement = want
    if (room[want] < need[want] && room[opposite[want]] > room[want]) {
      side = opposite[want]
    }

    let x: number
    let y: number
    if (side === 'top' || side === 'bottom') {
      x = a.left + a.width / 2 - b.width / 2
      y = side === 'top' ? a.top - b.height - GAP : a.bottom + GAP
    } else {
      x = side === 'left' ? a.left - b.width - GAP : a.right + GAP
      y = a.top + a.height / 2 - b.height / 2
    }

    // Clamp along the cross axis so a panel near the edge stays on screen.
    x = Math.min(Math.max(EDGE, x), vw - b.width - EDGE)
    y = Math.min(Math.max(EDGE, y), vh - b.height - EDGE)

    f.style.position = 'fixed'
    f.style.left = `${Math.round(x)}px`
    f.style.top = `${Math.round(y)}px`
    f.style.margin = '0'
    f.dataset.side = side
  }

  /** Re-place while open: scrolling or resizing moves the trigger. */
  let stop: (() => void) | undefined
  const track = () => {
    place()
    const opts = { passive: true, capture: true } as const
    addEventListener('scroll', place, opts)
    addEventListener('resize', place, opts)
    stop = () => {
      removeEventListener('scroll', place, opts)
      removeEventListener('resize', place, opts)
    }
  }
  const untrack = () => { stop?.(); stop = undefined }

  onBeforeUnmount(untrack)

  return { place, track, untrack }
}
