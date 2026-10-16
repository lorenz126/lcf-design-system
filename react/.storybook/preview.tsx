import type { Preview } from '@storybook/react-vite'
import { useEffect, type ComponentProps } from 'react'
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events'
import { addons } from 'storybook/preview-api'
import '../src/css/index.css'
import './workshop.css'
import { LcfProvider } from '../src/i18n/context'
import { DocsPage, Lead } from './DocsPage'
import { theme as docsTheme } from './theme'

/* A page with no story on it — every MDX page — runs no decorator, so
   the theme never reached it: measured by the docs sweep, Introduction,
   Installation, Locale and Colors loaded with theme:dark had no
   data-theme at all and rendered light, and for the same reason the
   toolbar switch could not reach them. The preview announces its
   globals on start and on every change, whatever is showing, so the
   theme is set from that too — checked on the built site: loaded dark,
   switched to light, <html> followed both times.
   `ready()`, because this module runs before the channel exists. */
addons.ready().then(channel => {
  const apply = ({ globals }: { globals: Record<string, unknown> }) => {
    if (typeof globals.theme === 'string') document.documentElement.dataset.theme = globals.theme
  }
  channel.on(SET_GLOBALS, apply)
  channel.on(GLOBALS_UPDATED, apply)
})

/* Every docs heading with an id carries Storybook's copy-link button
   INSIDE it, before the text: <a aria-label="Copy heading URL to address
   bar">. Measured with Playwright's aria snapshot: the headings were
   named "Copy heading URL to address bar Usage", "… Reference", "…
   Colors" — on Button thirteen of them, each also a Tab stop — so a
   screen reader's list of headings began every entry with the same 31
   characters. The button stays for the pointer (it shows on hover);
   it leaves the accessibility tree and the Tab order, which "On this
   page" already covers: it links every h2 and h3 and sets the same
   #hash. Storybook renders that button from blocks the docs.components
   override cannot reach without rewriting them (Heading, Subheading,
   the MDX h1–h6 all go through its internal HeaderMdx), so this answers
   the DOM instead. Any link inside a docs heading is that button — no
   heading of ours holds one — so it is matched by place, not by
   Storybook's label, and a reworded label cannot slip past. */
const quietHeadingLinks = () => {
  for (const a of document.querySelectorAll('.sbdocs-content :is(h1, h2, h3, h4, h5, h6) a:not([aria-hidden])')) {
    a.setAttribute('aria-hidden', 'true')
    a.setAttribute('tabindex', '-1')
  }
}
new MutationObserver(quietHeadingLinks).observe(document.documentElement, { childList: true, subtree: true })

/* A link a story renders goes nowhere. The iframe has <base
   target="_parent">, so Button's Link example — href="#offers", no target
   — replaced the whole site with the bare iframe.html#offers (measured:
   no sidebar, tab title "components-button--docs"). An app's router link
   handles the click itself; so does this one, by not following it. It is
   still a real <a href> with every attribute the component gives it,
   so the example shows what the component renders.
   And the click ends here: "On this page" (tocbot) listens on the whole
   document for in-page links and scrolls to their target — measured,
   "#offers" names nothing on the page, and it threw "Cannot read
   properties of null (reading 'offsetTop')". */
function StayLink({ children, ...rest }: ComponentProps<'a'> & { href: string }) {
  return (
    <a
      {...rest}
      onClick={e => {
        rest.onClick?.(e)
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {children}
    </a>
  )
}

/**
 * Two toolbar switches, because the two questions every component has to
 * answer are "does it hold in dark?" and "does it hold in German?". The
 * theme is set on <html> the way an app sets it, so what renders here is
 * what an app renders; the locale goes through LcfProvider, the same way.
 */
const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Theme',
      // Titled, not the raw values: the button read "light" in lower case
      // beside the chrome's sentence case.
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' }
        ],
        dynamicTitle: true
      }
    },
    locale: {
      description: 'Locale',
      // BCP 47 codes, as a developer writes them on LcfProvider.
      toolbar: { icon: 'globe', items: ['en-GB', 'de-CH', 'de-AT', 'de-DE', 'fr-CH'], dynamicTitle: true }
    }
  },
  initialGlobals: { theme: 'light', locale: 'en-GB' },
  decorators: [
    (Story, ctx) => {
      const theme = ctx.globals.theme as string
      useEffect(() => {
        document.documentElement.dataset.theme = theme
      }, [theme])
      return (
        <LcfProvider locale={ctx.globals.locale as string} linkComponent={StayLink}>
          <Story />
        </LcfProvider>
      )
    }
  ],
  parameters: {
    /* No project-wide `layout`. A story's `parameters.layout` outranks
       `docs.canvas.layout` in the docs Canvas (addon-docs 10.6.2,
       CanvasImpl), so the 'padded' that was set here — Storybook's
       default anyway, in story mode and in docs — kept every meta from
       centring its examples on the docs page alone. Story mode is
       unchanged: no layout means 'padded' there (WebView.applyLayout). */
    docs: {
      page: DocsPage,
      theme: docsTheme,
      // Storybook's own Subtitle is an <h2>: a one-sentence lead sat in
      // the heading outline as a section. This one is a paragraph.
      components: { Subtitle: Lead },
      toc: { headingSelector: 'h2, h3', title: 'On this page' },
      /* No canvas toolbar anywhere. It is reload, zoom in, zoom out,
         reset zoom and "Open canvas in new tab" — workbench tools, the
         ones manager.ts hides from the site's own toolbar — and the last
         opened the bare iframe.html, light from a dark page, titled with
         the story id. DocsStory reads this before the `withToolbar` that
         <Primary> passes it, so it holds there too. */
      canvas: { withToolbar: false },
      codePanel: true
    },
    controls: { expanded: true, sort: 'requiredFirst' },
    options: {
      storySort: { order: ['Overview', ['Introduction', 'Installation', 'Locale and format'], 'Foundations', 'Components'] }
    }
  }
}

export default preview
