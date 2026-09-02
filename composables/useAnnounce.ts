/**
 * Say something to a screen reader that is not on the screen.
 *
 * Three components had already written this: Kanban announcing a moved
 * card, Calendar its month, Attachments a finished upload. Each with its
 * own ref, its own region and its own four lines of clipping CSS — and
 * each with the same two mistakes, because the mistakes are not obvious.
 *
 * THE REGION HAS TO EXIST BEFORE THE MESSAGE DOES. A live region that
 * arrives already holding text is usually not announced at all; what is
 * announced is a CHANGE inside a region that was already being watched.
 * So this one is created empty, up front, and filled afterwards.
 *
 * AND THE SAME SENTENCE TWICE IS NOT A CHANGE. Cancel a drag twice and
 * the second "Cancelled" is silence, because the text never differed.
 * Clearing first and filling on the next frame makes it a change again.
 *
 * One region for the document rather than one per component: a page with
 * a board, a calendar and an upload list has three of these otherwise,
 * and a screen reader watching three regions announces whichever wins.
 *
 * It is not a component on purpose. A component would have to be mounted
 * by the application before a board could speak, which is a dependency
 * nobody would remember until it was missing.
 */
let region: HTMLElement | null = null
let pending: number | undefined

function ensure(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  if (region?.isConnected) return region

  region = document.createElement('div')
  region.setAttribute('aria-live', 'polite')
  // atomic, so a message is read whole rather than as the words that
  // changed since the last one.
  region.setAttribute('aria-atomic', 'true')
  region.setAttribute('role', 'status')
  Object.assign(region.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap'
  })
  document.body.appendChild(region)
  return region
}

export function useAnnounce() {
  // Created now rather than at the first message, so that by the time
  // there is something to say, the region has been watched for a while.
  onMounted(() => { ensure() })

  return (message: string) => {
    const r = ensure()
    if (!r) return
    if (pending) cancelAnimationFrame(pending)
    r.textContent = ''
    pending = requestAnimationFrame(() => {
      r.textContent = message
      pending = undefined
    })
  }
}

/** For tests and for anything that tears the document down itself. */
export function _resetAnnouncer() {
  region?.remove()
  region = null
}
