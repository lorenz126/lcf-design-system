/**
 * Say something to a screen reader that is not on the screen — the Nuxt
 * layer's useAnnounce, carried over with its two measured rules.
 *
 * - THE REGION HAS TO EXIST BEFORE THE MESSAGE DOES. A live region that
 *   arrives already holding text is usually not announced at all; what
 *   is announced is a change inside a region already being watched. So
 *   it is created empty, in an effect (never during render, so a server
 *   render has nothing to disagree with), before there is anything to say.
 * - THE SAME SENTENCE TWICE IS NOT A CHANGE. It is cleared first and
 *   filled on the next frame, so "Bestätigt." after "Bestätigt." is
 *   still heard.
 *
 * One region per document: a page with forty fields would otherwise
 * have forty, and a screen reader watching several announces whichever
 * wins. Each message is a <span lang> in the language its words are in.
 *
 * Internal, not under src/hooks (which build.mjs makes public): it moves
 * there as `useAnnounce` when Toast needs it.
 */
let region: HTMLElement | null = null
let pending: number | undefined

export function ensureAnnouncer(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  if (region?.isConnected) return region
  region = document.createElement('div')
  region.setAttribute('role', 'status')
  region.setAttribute('aria-live', 'polite')
  // Read whole, not as the words that changed since the last message.
  region.setAttribute('aria-atomic', 'true')
  region.setAttribute('data-lcf-announcer', '')
  Object.assign(region.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    border: '0'
  })
  document.body.appendChild(region)
  return region
}

/** Speak `message`, marked as written in `lang` (from `t.lang(key)`). */
export function announce(message: string, lang: string): void {
  const r = ensureAnnouncer()
  if (!r) return
  if (pending !== undefined) cancelAnimationFrame(pending)
  r.textContent = ''
  pending = requestAnimationFrame(() => {
    pending = undefined
    const span = r.ownerDocument.createElement('span')
    span.lang = lang
    span.textContent = message
    r.replaceChildren(span)
  })
}

/** For tests, and for anything that tears the document down itself. */
export function _resetAnnouncer(): void {
  if (pending !== undefined) cancelAnimationFrame(pending)
  pending = undefined
  region?.remove()
  region = null
}
