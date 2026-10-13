# Working in react/

The React library. The Nuxt layer at the repository root is `0.3.x`, in
maintenance; this directory is `0.4.0` onward. Read the root
`CONTRIBUTING.md` for how a change gets in.

## The one command

```bash
pnpm test
```

In order, failing on the first: contrast (322 pairs, both themes) ·
stories (every component has stories, a public path and its CSS in
`src/css/index.css`) · strings (no visible text outside the message
table) · vitest · tsc · build · Playwright over every story in three
passes (light/en-GB, dark/de-CH, reduced motion).

Before anything is tagged: `pnpm verify:consumer` — packs the library,
installs it into an empty Vite + React + Tailwind app, typechecks,
builds, serves it statically and reads it in a browser.

## Where a thing goes

```
src/tokens/       values. Primitives, roles, intents. Never read a primitive in a component.
src/css/          index.css (the one import), base.css, intent.css, tailwind.css
src/components/X/ X.tsx · X.css · X.stories.tsx · index.ts — all four, or check-stories fails
src/i18n/         messages, format, provider. Every sentence a component says lives here.
src/theme/        data-theme helpers and the pre-paint script
src/hooks/        one file per hook; each is a public path
src/docs/         the Overview and Foundations pages
```

## The vocabulary

`color` (eight intents) · `variant` (`solid` `soft` `outline` `ghost`) ·
`size` (`sm` `md` `lg`) · `block` · `loading` · `disabled` · `selected`
· `uniform`. A prop that means one of these things is spelled this way.
A component renders them as `data-color`, `data-variant`, `data-size`,
and its CSS reads only the `--c-*` roles that `intent.css` sets — never
a hue, never an intent token by name.

## Traps, measured

- **`!important` in cascade layers runs backwards.** An earlier layer's
  `!important` beats a later one's. base.css is earlier than components,
  so a component cannot override base with `!important` — it is
  silently overridden. That is how the Nuxt spinner stopped under reduced
  motion. Opt out with an attribute (`data-motion="essential"`).
- **A custom property holding `var()` is computed where it is declared.**
  Declared on `:root` only, a derived colour is worked out once and
  inherited as a finished value, so a nested `data-theme` island would
  show the outer theme's colour. Derived tiers are declared on
  `:root, [data-theme]`.
- **Local properties never reuse a token name.** `--c-*` inside a
  component. Redefining `--bg` locally once rendered white on white.
- **Intl is not deterministic across runtimes.** de-CH groups with `’`
  in ICU 77 and `'` elsewhere; de-AT groups numbers and money
  differently in the same ICU. Format through `useFormat()`, never
  `toLocaleString()`.
- **Storybook reads `vite.config.ts`.** The vitest config is
  `vitest.config.ts` so it does not.
- **Playwright is pinned `~1.62`** to the Chromium build installed here.
  Bumping it needs `playwright install`.

## Verifying

The build passing is not evidence. For anything visible: run
`pnpm storybook`, open it in light and dark and in de-CH, drive it with
the keyboard only, read the console. If a colour looks wrong, measure
before judging — `pnpm test:contrast` for tokens, the sweep for what was
rendered.

## What is a breaking change here

Removing or renaming: a component or its import path, a prop or one of
its values, a `data-*` attribute a consumer may style, a token, a message
key, an export of `i18n`, `theme` or `hooks`. Changing a default that
changes what renders. Adding is not breaking. Record it in
`CHANGELOG.md` under *Unreleased* in the same change.

## Writing it down

Each component begins with a doc comment that says what was decided,
what it cost, and what the component **refuses** to be. Storybook shows
it as the component's description, so it is the first thing a consumer
reads. A commit message says what was found and how.
