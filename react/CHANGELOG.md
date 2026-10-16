# Changelog — React

The Nuxt layer's history, `0.1.0` to `0.3.x`, is in the repository's
root `CHANGELOG.md`, and those tags stay installable. This file starts
where the library became React.

The version is a promise about the public surface: component names and
their import paths, props, the `color`/`variant`/`size` vocabulary,
semantic and intent tokens, the message keys, and the exports of
`i18n`, `theme` and `hooks`. Within `0.x`, a breaking change bumps the
minor.

## Unreleased — 0.4.0

### Breaking

- **React, not Nuxt.** `@lcf/design` is a React 18/19 component library.
  Install from `react/` in this repository; import each component by
  path (`@lcf/design/components/Button`) and the stylesheet once
  (`@lcf/design/css`). There is no `extends`, no `Ui` prefix, no
  auto-import.
- **One vocabulary.** `tone` is `color`, and colours are named for what
  they mean: `primary` (the app's own), `secondary` (neutral), `info`,
  `success`, `warning`, `caution`, `danger`, `discovery`. Variants are
  `solid`, `soft`, `outline`, `ghost` everywhere; Button keeps
  `floating` and `glass`.
  | was | is |
  |---|---|
  | `tone="accent"` | `color="primary"` |
  | `tone="neutral"` | `color="secondary"` |
  | blue / green / orange / yellow / red / purple | info / success / warning / caution / danger / discovery |
  | `variant="tinted"` | `variant="soft"` |
  | `variant="plain"` | `variant="ghost"` |
  | `iconOnly` | `uniform` |
  | Banner | Alert |
- **`--success`, `--warning`, `--danger` changed meaning.** They were
  fill aliases; they are now the intent prefixes (`--success-soft`,
  `--success-text`, …). Code reading the old names gets nothing.

### Added

- **Intent tokens** — `--<color>-solid`, `-on-solid`, `-soft`,
  `-on-soft`, `-text`, `-border` for all eight colours. Every value is a
  recipe already measured; this tier renames by meaning.
- **`--accent-solid-bg`** — the ground white text sits on. An app sets
  `--accent`, `--accent-text` and `--accent-solid-bg` and every `primary`
  follows.
- **`lcf-check-contrast app-theme.css`** — the contrast guard, run over an
  app's own colours. 322 pairs, both themes.
- **Nested themes** — `data-theme="light"` inside a dark page is a light
  island; the derived tokens recompute on every theme root.
- **`LcfProvider`** — locale, message overrides, formatter overrides,
  separators, link component. Everything works without it.
- **Message table** (`en`, `de`; `de-DE`/`de-AT` with ß) and
  **`check-strings`**, which fails on visible text in a component that
  bypasses it.
- **`useFormat()`** — number, money, percent, unit (m², mm, km, …),
  date, `parseNumber`. Separators pinned for de-CH, fr-CH, it-CH (`'` and
  `.`) and de-AT (`.` and `,`), where ICU versions disagree.
- **`@lcf/design/tailwind`** — the tokens as Tailwind 4 utilities.
  Optional; the components do not use Tailwind.
- **`@lcf/design/theme`** — `applyDocumentTheme`, `getDocumentTheme`,
  `useDocumentTheme`, `setThemePreference`, `followSystemTheme`,
  `themeScript`.
- **`useBreakpoint()`** — the same breakpoints the Tailwind preset uses.
- Storybook as the documentation: a docs page per component with its
  props from the types, a story per axis.

### Changed

- **A solid primary is `#0070ef`, was `#007aff`.** White on `#007aff` is
  4.02:1, under AA; the solid ground is now `--accent-solid-bg`, which
  defaults to the blue already measured at 4.60:1. Rings, borders and
  marks keep `--accent`.
- The neutral outline (`--secondary-border`, `--border-strong`) is listed
  in the contrast output as what it always was — a hairline at 1.48:1
  light, 1.91:1 dark, beside a label that names the control.

### Fixed

- **The spinner spun under reduced motion.** In the Nuxt layer base.css
  collapsed every animation to 0.01ms with `!important`, which beat the
  spinner's own slower rule: measured, `animation-duration: 1e-05s ×1`,
  a stopped spinner. Here an element opts out with
  `data-motion="essential"` and slows to 2s a turn instead.
- **Native controls followed the OS, not `data-theme`.** base.css set
  `html { color-scheme: light dark }` in `@layer lcf.base`, which comes
  after the tokens' `color-scheme: light` / `dark` and so won on
  `<html>`: a dark page computed `light dark`, and with the OS in light
  its scrollbars, inputs and selects were drawn light. The rule is gone;
  the theme's own `color-scheme` applies. An app that sets no
  `data-theme` gets `light`, as its tokens are.
