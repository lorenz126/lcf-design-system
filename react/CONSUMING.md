# Using @lcf/design (React)

For the agent working in an app that consumes this library. Paste it
into that app's `AGENTS.md` or `CLAUDE.md`.

## The one rule

**Never build what exists.** Import by path:

```tsx
import { Button } from '@lcf/design/components/Button'
```

Available now: Alert, Badge, Button, Spinner, LcfProvider — and the
`i18n`, `theme` and `hooks/useBreakpoint` modules. `ROADMAP.md` in the
package's repository lists what is next and in which order. If what you
need is not here yet, build it in the app and say so — do not copy a
component to add a prop; ask for the prop upstream.

## Set up once

```tsx
import '@lcf/design/css'                      // first, before any component
import { LcfProvider } from '@lcf/design/components/LcfProvider'

<LcfProvider locale="de-CH" linkComponent={Link}>…</LcfProvider>
```

And the theme script in `<head>` (`themeScript` from
`@lcf/design/theme`), or the first paint of a dark-mode user is white.

## The vocabulary

`color`: `primary` (the app's colour) · `secondary` (neutral) · `info` ·
`success` · `warning` · `caution` · `danger` · `discovery`.
`variant`: `solid` · `soft` · `outline` · `ghost`. `size`: `sm` · `md` · `lg`.

**A status picks a meaning; the meaning picks the hue.** Write one map
per status type in the app — `{ won: 'success', lost: 'danger' }` — and
use it everywhere. Never pick a colour because it looks right.

## Numbers, money, dates

Always `useFormat()`: `f.number`, `f.money`, `f.unit(12.5, 'm2')`,
`f.date('2026-10-13')`, `f.parseNumber(text)`. **Never
`toLocaleString()`** — it differs between Node, Deno and browsers. Dates
in and out are ISO `yyyy-mm-dd` strings, never `Date`.

## Text

Components say their own words through the message table. To change
one, or to supply French: `<LcfProvider messages={{ … }}>`. Never wrap a
component to replace its text.

## Colour and space

Use the semantic tokens only — `--fg`, `--fg-muted`, `--bg`,
`--bg-raised`, `--border`, `--fill`, the intent tokens
`--<color>-text/-soft/-solid`, spacing `--s-1…12`, radii `--r-*`, type
`--fs-*`. With Tailwind, `@lcf/design/tailwind` gives the same as
utilities. Never a hex value, never `--gray-*` or `--blue-*`.

The app's own colour is three tokens — `--accent`, `--accent-text`,
`--accent-solid` — in the app's theme file, checked in CI with
`npx lcf-check-contrast src/theme.css`.

## What the design refuses, and you must too

- A control that does nothing, or is disabled without saying why.
- Saying a thing twice in colour: tint ground, full-strength text, a
  coloured mark.
- "Here" in the accent: the current row, the open tab, the chosen chip
  are a neutral ground and heavier text.
- Restyling a component from outside. If it looks wrong, that is a
  finding for the library.

## Verify

The build passing is not evidence. Open it, drive it with the keyboard,
read the console, check dark and 390px. Measure a colour before judging
it.
