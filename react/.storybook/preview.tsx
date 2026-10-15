import type { Preview } from '@storybook/react-vite'
import { useEffect } from 'react'
import '../src/css/index.css'
import './workshop.css'
import { LcfProvider } from '../src/i18n/context'
import { DocsPage } from './DocsPage'
import { theme as docsTheme } from './theme'

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
      toolbar: { icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true }
    },
    locale: {
      description: 'Locale',
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
        <LcfProvider locale={ctx.globals.locale as string}>
          <Story />
        </LcfProvider>
      )
    }
  ],
  parameters: {
    layout: 'padded',
    docs: {
      page: DocsPage,
      theme: docsTheme,
      toc: { headingSelector: 'h2, h3', ignoreSelector: '.sbdocs-subtitle', title: 'On this page' },
      codePanel: true
    },
    controls: { expanded: true, sort: 'requiredFirst' },
    options: {
      storySort: { order: ['Overview', ['Introduction', 'Installation', 'Locale and format'], 'Foundations', 'Components'] }
    }
  }
}

export default preview
