import type { MouseEvent } from 'react'
import { NAVIGATE_URL } from 'storybook/internal/core-events'
import { toId } from 'storybook/internal/csf'
import { addons } from 'storybook/preview-api'

/**
 * The address of a docs page, from the title its Meta gives it
 * ('Overview/Installation') or a component meta's `id`.
 *
 * The id is Storybook's own `toId`, not a kebab-case written here: a
 * second copy of the rule is the one that drifts, and this repository
 * has been bitten by a hand-written route once already.
 */
export function docsPath(titleOrId: string) {
  return `?path=/docs/${toId(titleOrId, 'docs')}`
}

/**
 * The page as an href. `./?path=` and not `/?path=`: the docs render
 * inside iframe.html, so the relative URL resolves to the manager beside
 * it — localhost:6010/ in development, the Vercel root in production,
 * and a subdirectory if the site ever moves into one. Opened with
 * target="_top", because the iframe's <base target="_parent"> would
 * otherwise decide, and a page opened on its own (iframe.html without
 * the manager) must still land on the site, and cmd-click opens a tab.
 */
export function docsHref(titleOrId: string) {
  return `./${docsPath(titleOrId)}`
}

/**
 * A plain click on a link to a docs page, followed inside the site.
 *
 * The href alone reloaded the manager from a URL without the reader's
 * `&globals=`: measured, a reader on theme:dark;locale:de-CH who
 * followed an Introduction card landed on a light, en-GB page, while
 * the sidebar's links kept both. So a plain left click asks the manager
 * to navigate, over the channel, as Storybook's own Markdown links do —
 * the URL keeps its globals, and the ~230ms reload of the whole manager
 * becomes an in-app navigation. A click with a modifier, a middle click,
 * and iframe.html opened on its own (no manager above it) keep the href.
 */
export function followInSite(event: MouseEvent<HTMLAnchorElement>, titleOrId: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  if (window.parent === window) return
  event.preventDefault()
  addons.getChannel().emit(NAVIGATE_URL, docsPath(titleOrId))
}
