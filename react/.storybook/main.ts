import type { StorybookConfig } from '@storybook/react-vite'

/**
 * The documentation IS the workshop: one docs page per component with
 * its props table read from the TypeScript, and one story per axis —
 * colours, variants, sizes, states — the way the SDK this follows lays
 * its pages out. The browser sweep loads every story (e2e/stories.spec.ts)
 * and every docs page (e2e/docs.spec.ts), so a story is also a test
 * fixture.
 */
const config: StorybookConfig = {
  stories: ['../src/docs/*.mdx', '../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  // The site's own files, served from the root: favicon.svg there is the
  // one file Storybook looks for by name to replace its own tab icon.
  // Relative to this directory, not to react/.
  staticDirs: ['./public'],
  // A documentation site, not a workbench: no onboarding checklist, no
  // "what's new" notices, no telemetry from visitors' builds.
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  features: { sidebarOnboardingChecklist: false, menuOnboardingChecklist: false },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      // Only our own props in the table — not the 250 a <button> inherits.
      propFilter: prop => !prop.parent || !/node_modules/.test(prop.parent.fileName),
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true
    }
  }
}
export default config
