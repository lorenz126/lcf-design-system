# Changelog — React

The Nuxt layer's history, `0.1.0` to `0.3.x`, is in the repository's
root `CHANGELOG.md`, and those tags stay installable. This file starts
where the library became React.

The version is a promise about the public surface: component names and
their import paths, props, the `color`/`variant`/`size` vocabulary,
semantic and intent tokens, the message keys, and the exports of
`i18n`, `theme` and `hooks`. Within `0.x`, a breaking change bumps the
minor.

## Unreleased

### Added

- **Select** (`@lcf/design/components/Select`) — one choice from a list
  the app hands over whole, sitting in Field unchanged as Input and
  NumberField do: suggested (grey italic), confirmed, required and
  empty, origin, hint, Enter to confirm, Escape back to the suggestion.
  A native `<select>`, not Radix Select: Field's Enter and its
  `validity` check, form participation and the phone's own picker come
  with it; the open list cannot be styled (the doc comment has the
  measurements). `options` with groups (`SelectOption`, `SelectGroup`),
  `value`/`defaultValue` with `null` for nothing chosen,
  `onValueChange`, `placeholder`, `readOnly`, `size`, `invalid`,
  `block`. A placeholder always comes first, so nothing is chosen until
  somebody chooses; a value the list does not offer is shown as itself
  with "Steht nicht zur Auswahl." and never replaced by the first
  option (React's own behaviour); the chosen option is always posted.
- Message keys `choose` ("Choose…" / "Bitte wählen…") and `notAChoice`
  ("Not one of the choices." / "Steht nicht zur Auswahl."), en and de.
- `lcf-check-contrast`: the Select's placeholder and chevron, on the
  page, on a card and on the read-only ground — 8 pairs.
- The sweep measures the choice a closed select shows, as it measures
  typed values: neither is a text node with a box.
- **Checkbox** and **CheckboxGroup** (`@lcf/design/components/Checkbox`).
  Checkbox is the native `<input type="checkbox">` drawn with
  `appearance: none`, its `label` beside the box and its `description`
  under the label; `checked`/`defaultChecked`/`onCheckedChange`,
  `indeterminate` (the DOM property, re-applied while the prop says so),
  `invalid`, `readOnly` (`aria-readonly`, a click that changes nothing),
  `size`. Every attribute but `className` and `style` lands on the
  `<input>`, as the Nuxt 0.2.0 change decided. CheckboxGroup is a
  `<fieldset>` and the one control a Field holds: `value` /
  `defaultValue` / `onValueChange` as a list in the order the boxes are
  rendered, `name` posted by each chosen box, `required` meaning at least
  one (a custom validity on the first box, in the table's words), the
  Field's label, words, state, origin, size, disabled and read-only.
  Root attributes `data-size`, `data-color`, `data-disabled`,
  `data-readonly` (Checkbox) and `data-size`, `data-empty`, `data-color`,
  `data-readonly` (CheckboxGroup) may be styled.
- **`chooseAtLeastOne`** message key, English and German: "Choose at
  least one option." / "Bitte mindestens eine Option wählen." An app
  that types a full table of its own fails to compile until it supplies
  it — the intended signal.
- **14 contrast pairs** for the checkbox: its edge (3.41:1 light, 3.66:1
  dark) and its ticked fill on the page and on a card, and the tick on
  its fill, invalid included. With Select's 8, 354 pairs, both themes.

### Changed

- **Field holds a group control.** With a CheckboxGroup as its child,
  Field's label names the fieldset (`aria-labelledby`) and has no `for`
  — a label pointing at a fieldset labels nothing; Enter and Escape in
  any box act for the field (measured: Enter on a checkbox submits a
  form in Chromium, so a confirmable group spends it); a confirm reads
  the boxes' validity, because a fieldset's own stays valid while a box
  inside it is not (measured); after ✓ or ↺ focus returns to the box
  that had it. No prop changed, and Input and NumberField behave as
  before. `useField()`'s contract gains the group clause.

## 0.4.0 — 2026-10-17

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

- **Releases carry the built package.** A tag points at a commit with
  `react/dist` and no `prepare` script (`scripts/release.sh`), so
  `#v0.4.0&path:/react` installs without a build step. Measured: pnpm
  12 fails a git dependency that builds itself
  (`ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`) unless the app allowlists it.
- **`lcf-check-strings`** — the check for visible text outside the
  message table, as a bin. Given paths, it checks an app's own
  templates: `npx lcf-check-strings src`.

- **Intent tokens** — `--<color>-solid`, `-on-solid`, `-soft`,
  `-on-soft`, `-text`, `-border` for all eight colours. Every value is a
  recipe already measured; this tier renames by meaning.
- **`--accent-solid-bg`** — the ground white text sits on. An app sets
  `--accent`, `--accent-text` and `--accent-solid-bg` and every `primary`
  follows.
- **`lcf-check-contrast app-theme.css`** — the contrast guard, run over an
  app's own colours. 332 pairs, both themes.
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
- **Field** (`@lcf/design/components/Field`) — label, description,
  error and required wired once for any control, through the public
  **`useField()`** context; the review state (`state`: `suggested`,
  `confirmed`), where a value came from (`origin`), the app's
  price-driver mark (`hint`, `hintIcon`), and confirm/revert
  (`onConfirm`, `onRevert`, `suggestion`). Enter and ✓ confirm only
  what the control does not call wrong (its `validity`); Escape in the
  control, or ↺, goes back; one Tab stop per field. "Required and
  empty" is derived from the control's `data-empty`, never a prop.
  `joinIds` is exported beside `useField` for an app's own control. Root
  attributes `data-state`, `data-origin`, `data-required`,
  `data-invalid`, `data-block` may be styled. (J3, J4)
- **Input** (`@lcf/design/components/Input`) — one line of text:
  `type` text/email/tel/url/password, `size`, `invalid`, `block`,
  `startAdornment`, `endAdornment`. `aria-invalid` is always written,
  `"false"` included, so Chrome never reports native validity the
  screen does not show.
- **NumberField** (`@lcf/design/components/NumberField`) — a number with
  its unit (`unit`: the i18n `Unit`), in the reader's separators;
  `value`/`defaultValue`/`onValueChange` on commit, `min`, `max`,
  `step`, `minimumFractionDigits`, `stepper`; posts the canonical number
  under `name`, and `form` reaches the visible box too; a form reset
  puts an uncontrolled field back to `defaultValue`. Never clamps, snaps
  or rounds what was typed. (J3)
- **Types** `FieldState`, `Origin`, `OriginSource`, `OriginChannel`, from
  `@lcf/design/components/Field` — the origin model media items will
  share.
- **29 message keys** for fields and units (`stateSuggested` …
  `unitEur`, `escapeReverts`), English and German; `unitChf` is
  "Franken" in de-CH and "Schweizer Franken" in de-DE and de-AT. Adding them to `Messages` makes
  an app that types a full table of its own fail to compile until it
  supplies them — the intended signal that there are new words to
  translate.
- **`t.lang(key)`** on what `useMessages()` returns, and the
  **`Translate`** type: the BCP 47 tag the resolved entry is written in
  (the provider's locale, or `'en'` where it fell back). `t(key)` is
  unchanged.
- **`--border-field`** (and Tailwind's `border-field`) — a text field's
  resting edge, 3.41:1 light and 3.66:1 dark, because an empty field is
  found by its edge alone (WCAG 1.4.11).
- **10 contrast pairs** for fields: the edge on the page and on a card,
  and a read-only and a suggested value.
- **The sweep asks six questions**: the layer's words under the wrong
  `lang` is new, and the text question now reads typed values and
  placeholders, which are not text nodes.

### Changed

- **`parseNumber` reads full-width digits** from an IME: "１２．５" is
  12.5, where it was null. Only the full-width forms are folded — a
  first version ran NFKC, which also read "5²" as 52.
- **`parseNumber` refuses what it would have to guess.** With both `.`
  and `,`, the rightmost is the decimal: "1.234,5" is 1234.5 and
  "12.500,00" is 12500 in every locale (de-CH read 1.2345 and 12.5).
  The other separator alone is grouping only where it is the locale's
  own group separator, never with a leading 0: in de-CH "2,450" is
  2.45 (was 2450) and "0,125" is 0.125 everywhere (was 125). Space and
  apostrophe groups are three digits: "12 5" and "10'41.50" are no
  longer numbers. Every caller sees it.
- **A solid primary is `#0070ef`, was `#007aff`.** White on `#007aff` is
  4.02:1, under AA; the solid ground is now `--accent-solid-bg`, which
  defaults to the blue already measured at 4.60:1. Rings, borders and
  marks keep `--accent`.
- The neutral outline (`--secondary-border`, `--border-strong`) is listed
  in the contrast output as what it always was — a hairline at 1.48:1
  light, 1.91:1 dark, beside a label that names the control.

### Fixed

- **Alert and Spinner mark the language of their own words.** Under an
  English `<html lang>` with a de-CH provider, "Ausblenden" and "Wird
  geladen" were read with English rules. The dismiss button and a
  labelled Spinner now carry `lang` from the table; an app's own
  `label` is never marked.
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
