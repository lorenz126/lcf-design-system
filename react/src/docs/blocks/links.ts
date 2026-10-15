import { toId } from 'storybook/internal/csf'

/**
 * The address of a docs page, from the title its Meta gives it
 * ('Overview/Installation') or a component meta's `id`.
 *
 * The id is Storybook's own `toId`, not a kebab-case written here: a
 * second copy of the rule is the one that drifts, and this repository
 * has been bitten by a hand-written route once already.
 *
 * `./?path=` and not `/?path=`: the docs render inside iframe.html, so
 * the relative URL resolves to the manager beside it — localhost:6010/
 * in development, the Vercel root in production, and a subdirectory if
 * the site ever moves into one. Opened with target="_top", because the
 * iframe's <base target="_parent"> would otherwise decide, and a page
 * opened on its own (iframe.html without the manager) must still land
 * on the site, and cmd-click opens a tab.
 *
 * Cost, measured: a full load of the manager — about 230ms from click to
 * the page rendered on the static build (370ms on the dev server), where
 * the sidebar's in-app navigation takes about 90ms. Storybook's own
 * Markdown links avoid it by sending NAVIGATE_URL over the channel; that
 * would be the next step if the reload is felt.
 */
export function docsHref(titleOrId: string) {
  return `./?path=/docs/${toId(titleOrId, 'docs')}`
}
