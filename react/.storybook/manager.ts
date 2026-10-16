import { addons, type API } from 'storybook/manager-api'
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events'
import { darkTheme, theme } from './theme'

/**
 * The site, not the workbench.
 *
 * - The sidebar lists PAGES: overview, foundations, one entry per
 *   component. The individual stories are sections of the component's
 *   page, so listing them again in the sidebar was ten rows of noise per
 *   component. They still exist — the browser sweep loads every one by id.
 * - The toolbar keeps the two switches every component has to answer to,
 *   theme and locale, and drops the workbench tools (grid, measure,
 *   outline, zoom) a reader of the docs has no use for. So does every
 *   docs canvas (preview.tsx), and the sidebar's gear and tag filter
 *   (manager-head.html, which also takes Storybook's look off the
 *   sidebar: its icons, capitals and expand-all buttons).
 * - The chrome follows the theme switch, and the browser tab names the
 *   page and the site, not the tool.
 */

type Mode = 'light' | 'dark'
const themes = { light: theme, dark: darkTheme }

/* The theme lives in the preview's `theme` global, which Storybook keeps
   in the URL (`&globals=theme:dark`). Read here, synchronously, so a
   dark link opens on a dark sidebar instead of a white one that turns
   dark once the preview has loaded and reported its globals. */
const fromUrl = (): Mode =>
  /(?:^|;)theme:dark(?:;|$)/.test(new URLSearchParams(location.search).get('globals') ?? '') ? 'dark' : 'light'

/* manager-head.html scopes the "here" style and the page ground by this
   attribute; its inline script sets it before first paint, this keeps it. */
const mark = (mode: Mode) => {
  document.documentElement.dataset.theme = mode
}

const initial = fromUrl()
mark(initial)

addons.setConfig({
  theme: themes[initial],
  layout: { panelPosition: 'bottom', showPanel: false },
  ui: { enableShortcuts: false },
  sidebar: {
    showRoots: true,
    filters: {
      patterns: item => item.type !== 'story'
    }
  },
  toolbar: {
    zoom: { hidden: true },
    eject: { hidden: true },
    copy: { hidden: true },
    fullscreen: { hidden: true },
    'storybook/background': { hidden: true },
    'storybook/viewport': { hidden: true },
    'storybook/measure': { hidden: true },
    'storybook/outline': { hidden: true },
    'storybook/a11y': { hidden: true },
    'storybook/vision': { hidden: true },
    'storybook/grid': { hidden: true }
  }
})

const SITE = 'LCF Design System'

/* "Button – LCF Design System", "Introduction – LCF Design System": the
   last segment of the entry's title is the page's name — the component,
   or the overview page. A story opened on its own still names its
   component; the sidebar does not list stories, so a reader only gets
   there by a link. */
const pageTitle = (api: API) => {
  let page: string | undefined
  try {
    page = api.getCurrentStoryData()?.title.split('/').pop()?.trim()
  } catch {
    // Before the index has loaded there is no entry; the site name stands.
  }
  return page ? `${page} – ${SITE}` : SITE
}

addons.register('lcf/chrome', api => {
  /* Switched with setOptions, not setConfig. setConfig re-applies the
     whole config through SET_CONFIG, and Storybook answers that by
     resetting the layout to what it was at startup. Measured: a sidebar
     dragged from 299 to 358 px snapped back to 299 on setConfig; through
     setOptions it stayed at 358. */
  let current = initial
  const follow = (globals: Record<string, unknown> | undefined) => {
    const mode: Mode = globals?.theme === 'dark' ? 'dark' : 'light'
    mark(mode)
    if (mode === current) return
    current = mode
    api.setOptions({ theme: themes[mode] })
  }
  /* Both arrive on load carrying the URL's globals (measured on a dark
     link: theme "dark" in each), so a link the URL parse above misread
     still ends on the right theme; GLOBALS_UPDATED again on every switch. */
  api.on(SET_GLOBALS, ({ globals }: { globals?: Record<string, unknown> }) => follow(globals))
  api.on(GLOBALS_UPDATED, ({ globals }: { globals?: Record<string, unknown> }) => follow(globals))

  /* Storybook writes "Components / Button - Docs ⋅ Storybook" through
     react-helmet on every navigation, a frame after the route changes.
     Rather than race it, answer it: any change to <head> that leaves the
     title other than ours puts ours back. The guard on equality is what
     keeps this from answering itself. */
  const keepTitle = () => {
    const want = pageTitle(api)
    if (document.title !== want) document.title = want
  }
  new MutationObserver(keepTitle).observe(document.head, { childList: true, subtree: true, characterData: true })
  keepTitle()
})

/* The sidebar row the arrow keys are on. Storybook names it only on the
   tree (data-highlighted-item-id) and paints it from a generated style,
   15% of the text colour — 1.17:1 against the current page's ground
   beside it, measured. Copied onto the row as data-kbd, so
   manager-head.html can ring it while the list has keyboard focus. The
   observer watches the document because Storybook re-renders the rows; the
   attribute this writes is not one it watches, so it cannot answer
   itself. */
const markKeyboardRow = () => {
  const id = document.getElementById('storybook-explorer-tree')?.dataset.highlightedItemId
  for (const row of document.querySelectorAll<HTMLElement>('.sidebar-item[data-kbd]')) {
    if (row.dataset.itemId !== id) delete row.dataset.kbd
  }
  if (id) document.querySelector<HTMLElement>(`.sidebar-item[data-item-id="${CSS.escape(id)}"]`)?.setAttribute('data-kbd', '')
}
new MutationObserver(markKeyboardRow).observe(document.documentElement, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: ['data-highlighted-item-id']
})
