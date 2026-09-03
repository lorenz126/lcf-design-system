# Changelog

The version is a promise about the public surface — component names,
props, slots, events, `v-model` names, semantic tokens, and the exports
of `composables/`. `AGENTS.md` says exactly what counts as breaking.
Within `0.x`, a breaking change bumps the minor.

Record a change here under *Unreleased* as you make it, not when you
tag. Before a tag, `pnpm verify:consumer`.

## Unreleased

## 0.3.0 — 2026-09-03

The layer is the **LCF Design System** now, and the repository is public.
Nothing in a component changed: no name, no prop, no slot, no event, no
token name, no behaviour. What changed is what the package is called and
where it lives — which is breaking all the same, because every consumer
imports it by name.

### Breaking

- **The package is `@lcf/design`**, was `@lf/design`. In a consumer,
  change `extends: ['@lf/design']` to `extends: ['@lcf/design']`, and
  any import from the package path.
- **The repository is `lorenz126/lcf-design-system`**, was
  `flechtenmacher-font`. GitHub redirects the old URL, so an existing
  `github:lorenz126/flechtenmacher-font#v0.2.0` keeps resolving — but
  the dependency spec for this version is
  `github:lorenz126/lcf-design-system#v0.3.0`.
- The `Ui` component prefix is **unchanged** on purpose. It is in every
  consumer template, and renaming it would be a breaking change with no
  gain.

### Changed

- **The font stack uses standard keywords.** `system-ui`, `ui-rounded`,
  `ui-monospace` and `ui-serif`, with named fallbacks, instead of vendor
  family names. The keywords resolve to the platform's own interface
  face on every OS, so on the platforms the old stack targeted the same
  face renders as before; on others, the platform's native face instead
  of the previous generic fallback. Measured in Chrome on macOS: sans,
  mono and serif resolve to pixel-identical faces. **`--font-rounded`
  does not** — `ui-rounded` is honoured by Safari only, so in other
  engines it now falls through to `system-ui` where the vendor name used
  to resolve. Nothing in the layer or the workshop references that
  token, so no rendered pixel changed; it is a defined-but-unused token
  whose resolution narrowed, recorded here because the sentence above
  would otherwise overclaim. The tracking formula is untouched — it was
  fitted to that face's optical curve and still applies to it.
- **The colour tokens carry no vendor attribution.** Comments describe
  what the tones are graded against; **every value is unchanged.** The
  hues remain what they were, so this is a change of description, not of
  colour, and the contrast guard is green because nothing it measures
  moved.
- The README and the workshop prose describe what the layer does rather
  than what it was modelled on.
- **The hue fills are opaque.** `--blue-fill` and the other five are the
  same 14% (17% dark) wash they were, flattened onto the page with
  `color-mix` instead of left translucent. On the page nothing changes;
  on a card, a panel, or the current row of a sidebar a badge or a tinted
  button is now the same colour it is on the page, where before it took
  the ground's tone and lost contrast doing it — a blue badge at 2.87:1
  on a sidebar's current row, fifteen such pairs across both themes.
  Token names are unchanged, so this is not breaking by the rule; a
  consumer who stacked a badge on a translucent surface of their own will
  see it stop tinting.
- `check-contrast` now stacks grounds (`on: ['--fill', '--bg-raised']`)
  and reads `calc()` weights in `color-mix`; 174 pairs.
- The page sweep measures rendered text contrast, in all three passes.

## 0.2.0 — 2026-09-02

The catalogue is complete: every entry `ROADMAP.md` reserved is built,
and of the four dependency decisions it reserved, three were refused and
one taken. Forty-nine components, each with its own page.

### Breaking

- **Table is generic over its row.** `rows: Row[]` instead of
  `Record<string, any>[]`, so a table handed `Issue[]` gives `Issue` back
  out of its cell slots. Code that typed a slot's `row` as
  `Record<string, any>` now gets the inferred type; code that cast it
  keeps working. Breaking at the type level only.
- **Checkbox and Radio forward unmatched attributes to their `<input>`,**
  not to the wrapper `<div>`. `aria-label`, `name`, `required`, `form`,
  `data-*` all land on the control now. Anything that relied on them
  landing on the wrapper changes behaviour.
- **Table names its selection checkboxes.** Each row's box is labelled by
  its first cell via `aria-labelledby`; the header box takes a new
  `selectAllLabel` prop (default `Select all rows`) and the loose
  visually-hidden span beside it is gone.
- **List names its selection controls** the same way, by the row's label.
  A caller replacing the row with the `item` slot takes the naming with
  it.

### Added

- **Field** — label, help, error and the id wiring between them, as an
  atom, because three of its four callers are atoms.
- **Textarea**, growing with `field-sizing: content` where it exists and a
  measured fallback where it does not; a counter that reports and never
  blocks.
- **Slider** — a real range input. Marks under the rail (`ticks`), which
  are reference points until `snap` makes them detents, and then only for
  the pointer. `precision` gives the pointer a finer grid than the
  keyboard; the value reads at `step`.
- **ToggleGroup** — one component, two semantics: `single` is a
  radiogroup, `multiple` is a group of `aria-pressed` buttons.
- **Drawer** — a `<dialog>` from an edge, modal or not, same element.
- **Toaster** and `useToast()` — two live regions mounted empty, timers
  paused for the whole stack on hover.
- **Progress**, out of Attachments, with indeterminate as the absence of a
  value.
- **Banner** — what the page says about itself; not a live region unless
  `announce`.
- **Tabs** — `activation` automatic or manual; overflow scrolls; one panel
  rendered from the slot.
- **CommandPalette** and `useCommands()` — a registry bound to the calling
  effect scope, so a page's commands leave with it. Ranks, where
  SearchField refuses to.
- **DatePicker** and `parseDate`/`formatDate`/`fieldOrder`/`dateHint` —
  a text field paired with Calendar. Field order asked of `Intl`; ISO wins
  everywhere; a named month wins above that; `31/02` refused.
- **Combobox** — a form combobox whose value is an id. Filters by lookup,
  not search. `creatable` offers a row and emits `create`; it writes
  nothing.
- **TreeView** — arbitrary depth, roving tabindex over the *visible*
  rows, Right and Left each doing two things.
- **`useAnnounce()`** — one document-level live region, cleared and
  refilled on the next frame so the same sentence twice is still a change.
- **`plugins/link.ts`** — provides `uiLink` (NuxtLink) app-wide, so
  Sidebar and Breadcrumb take a component and never a string.
- **Icon** accepts `size="inherit"` (1em), as Spinner always did.
- **`types/platform.d.ts`** — the popover methods and CSS anchor
  positioning, ahead of the DOM library. Ships with the layer.
- Menu's trigger props type `aria-haspopup` as the literal `'menu'`.

### Fixed

- Calendar put out-of-range days out of the focus order with `disabled`,
  so the roving tabindex could not land on them. Now `aria-disabled`.
- CommandPalette rendered "No matching commands" on the server — the
  registry is knowably empty there — and the client replaced it on
  hydration, a mismatch on every page. Its contents wait for a client.
- Dialog and CommandPalette set `display` on the `<dialog>` root, which
  beats the UA's `display: none` and left the closed one as a
  full-viewport block in the flow. Gated on `[open]`.
- Table's flexible column was crushed by fixed ones; `minWidth` added.
- Slider's fill and marks disagreed about where half was: both now
  account for the thumb travelling inside the track.
- `parseDate` split "März" into "M" and "rz" (`\W` is ASCII-only).

### Workshop and tooling

Not part of the version promise, listed so the diff makes sense.

- One page per component at `/<tier>/<name>`; routes derived from the
  tier and name.
- `scripts/check-dialogs.mjs`, `scripts/check-pages.mjs`,
  `scripts/verify-consumer.sh`.
- `vue-tsc` on the workshop and the demo; `typescript` pinned to `^5`
  because vue-tsc dies on 7.
- Playwright: every page in Chromium, against the dev server.
- `AGENTS.md`, and `CLAUDE.md` pointing at it.
- The `demo/` issue tracker, consuming the layer from outside.

## 0.1.0

The type ramp, the two-tier colour tokens, and the first eight
components: Icon, Button, Input, Select, Checkbox, Radio, Switch, Badge.
A contrast check that runs without a browser, and the conversion of the
repo into a consumable Nuxt layer.
