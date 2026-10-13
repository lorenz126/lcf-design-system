import type { StorybookConfig } from '@storybook/react-vite'

/**
 * The documentation IS the workshop: one docs page per component with
 * its props table read from the TypeScript, and one story per axis —
 * colours, variants, sizes, states — the way the SDK this follows lays
 * its pages out. The page sweep (e2e/stories.spec.ts) loads every story
 * in a real browser, so a story is also a test fixture.
 */
const config: StorybookConfig = {
  stories: ['../src/docs/*.mdx', '../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
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
