import { create } from 'storybook/theming'

/**
 * Storybook's own chrome, in the system's own face and neutrals, so the
 * site reads as part of the design system rather than as a tool around
 * it — in both themes, because the docs follow the toolbar's theme
 * switch and a white sidebar beside a dark page reads as a tool again.
 *
 * Values are the tokens, written out: the manager is a separate document
 * and cannot read the custom properties. They are copied from
 * src/tokens/color.css by ROLE, once per theme, and every slot of the
 * Storybook theme is filled from a role — none from Storybook's own
 * palette. Left to `create()`, the slots this does not name fall back to
 * Storybook's blues: the sidebar's hover measured #DBECFF in light, and
 * Storybook's dark default for it is #233952. Naming the five extra
 * slots changed nothing else in light: the docs pages, which take this
 * theme too, shot byte-identical before and after in both themes.
 */
interface Roles {
  fg: string
  fgMuted: string
  bg: string
  /** --fill-quiet flattened onto --bg. Opaque on purpose: Storybook also
   *  paints the button that floats over a hovered row in this colour, to
   *  cover the label under it (sidebar/ContextMenu.tsx in its source), and
   *  a translucent ground would let the label show through. */
  hover: string
  border: string
  borderStrong: string
}

/* color.css, :root — gray-900, gray-600, gray-0, gray-200, gray-300;
   hover is rgb(0 0 0 / .04) over #fff = #f5f5f5. */
const light: Roles = {
  fg: '#171717',
  fgMuted: '#525252',
  bg: '#ffffff',
  hover: '#f5f5f5',
  border: '#e5e5e5',
  borderStrong: '#d4d4d4'
}

/* color.css, [data-theme="dark"] — gray-50, gray-400, gray-950, gray-800,
   gray-700; hover is rgb(255 255 255 / .05) over #0a0a0a = #161616. */
const dark: Roles = {
  fg: '#fafafa',
  fgMuted: '#a3a3a3',
  bg: '#0a0a0a',
  hover: '#161616',
  border: '#262626',
  borderStrong: '#404040'
}

const sans = 'system-ui, "Segoe UI", Roboto, Inter, "Helvetica Neue", sans-serif'
const mono = 'ui-monospace, Menlo, Consolas, monospace'

const build = (base: 'light' | 'dark', r: Roles) =>
  create({
    base,
    brandTitle: 'LCF Design System',
    brandUrl: 'https://github.com/lorenz126/lcf-design-system',
    brandTarget: '_blank',

    fontBase: sans,
    fontCode: mono,

    colorPrimary: r.fg,
    colorSecondary: r.fg,

    appBg: r.bg,
    appContentBg: r.bg,
    appPreviewBg: r.bg,
    appHoverBg: r.hover,
    appBorderColor: r.border,
    appBorderRadius: 8,

    textColor: r.fg,
    textMutedColor: r.fgMuted,
    textInverseColor: r.bg,

    barBg: r.bg,
    barTextColor: r.fgMuted,
    barSelectedColor: r.fg,
    barHoverColor: r.fg,

    buttonBg: r.bg,
    buttonBorder: r.borderStrong,
    booleanBg: r.border,
    booleanSelectedBg: r.bg,

    inputBg: r.bg,
    inputBorder: r.borderStrong,
    inputTextColor: r.fg,
    inputBorderRadius: 6
  })

/** The light chrome. Also the docs blocks' theme (preview.tsx). */
export const theme = build('light', light)
export const darkTheme = build('dark', dark)
