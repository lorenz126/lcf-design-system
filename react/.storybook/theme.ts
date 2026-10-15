import { create } from 'storybook/theming'

/**
 * Storybook's own chrome, in the system's own face and neutrals, so the
 * site reads as part of the design system rather than as a tool around
 * it. Values are the tokens' light theme, written out: the manager is a
 * separate document and cannot read the custom properties.
 */
const sans = 'system-ui, "Segoe UI", Roboto, Inter, "Helvetica Neue", sans-serif'
const mono = 'ui-monospace, Menlo, Consolas, monospace'

export const theme = create({
  base: 'light',
  brandTitle: 'LCF Design System',
  brandUrl: 'https://github.com/lorenz126/lcf-design-system',
  brandTarget: '_blank',

  fontBase: sans,
  fontCode: mono,

  colorPrimary: '#171717',
  colorSecondary: '#171717',

  appBg: '#ffffff',
  appContentBg: '#ffffff',
  appPreviewBg: '#ffffff',
  appBorderColor: '#e5e5e5',
  appBorderRadius: 8,

  textColor: '#171717',
  textMutedColor: '#525252',
  textInverseColor: '#ffffff',

  barBg: '#ffffff',
  barTextColor: '#525252',
  barSelectedColor: '#171717',
  barHoverColor: '#171717',

  inputBg: '#ffffff',
  inputBorder: '#d4d4d4',
  inputTextColor: '#171717',
  inputBorderRadius: 6
})
