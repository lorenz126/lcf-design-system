import { addons } from 'storybook/manager-api'
import { theme } from './theme'

/**
 * The site, not the workbench.
 *
 * - The sidebar lists PAGES: overview, foundations, one entry per
 *   component. The individual stories are sections of the component's
 *   page, so listing them again in the sidebar was ten rows of noise per
 *   component. They still exist — the browser sweep loads every one by id.
 * - The toolbar keeps the two switches every component has to answer to,
 *   theme and locale, and drops the workbench tools (grid, measure,
 *   outline, zoom) a reader of the docs has no use for.
 */
addons.setConfig({
  theme,
  panelPosition: 'bottom',
  showPanel: false,
  enableShortcuts: false,
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
