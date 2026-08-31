# flechtenmacher-font

Typography foundation for a personal design framework. SF Pro, systematised.

## What's here

- **`tokens/type.css`** — the artifact. An 11-step type ramp where each step
  couples size + line-height + weight + tracking as one bundle, plus weights,
  families, a tracking formula for off-ramp sizes, and tabular-numeral and
  measure utilities.
- **`ui/`** — the components. Auto-imported as `<UiButton>`, `<UiInput>`,
  `<UiBadge>`.
- **`.playground/`** — the workshop. A Nuxt app that consumes this layer
  exactly the way a real project does, so anything broken about the layer's
  public surface breaks here first. Not shipped.
- **`scripts/check-contrast.mjs`** — resolves the colour tokens and asserts
  every foreground/background pair against WCAG. Runs in CI without a browser.

`tokens/` stays framework-agnostic on purpose: plain CSS custom properties with
no Nuxt dependency, usable from any stack.

## Using it

```
pnpm add -D @lf/design
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({ extends: ['@lf/design'] })
```

That brings the tokens, the `Ui*` components and the pre-paint theme script.

## Principles

The design principles live in `app/data/principles.ts` and render on the
Principles tab. Currently empty — groups are scaffolded, rules are not yet
written.

House style for writing them: start with *Always* or *Never*, one rule per
entry, and always give the reason. A rule you can't justify is a habit, not a
principle.

## Fonts

No font files are shipped. `-apple-system` resolves to real SF Pro on Apple
devices, with Inter as the cross-platform fallback. Note that Apple's SF
license covers development for Apple platforms, not general webfont
redistribution — self-hosting SF for a public site falls outside it.

## Developing it

```
pnpm install
pnpm dev     # the playground
pnpm test    # contrast check
```
