# flechtenmacher-font

Typography foundation for a personal design framework. SF Pro, systematised.

## What's here

- **`tokens/type.css`** — the artifact. An 11-step type ramp where each step
  couples size + line-height + weight + tracking as one bundle, plus weights,
  families, a tracking formula for off-ramp sizes, and tabular-numeral and
  measure utilities.
- **`app/data/principles.ts`** — the design principles, as typed data. The
  rules behind the tokens. Adding one is a one-line object.
- **`app/`** — a Nuxt 4 site for viewing the system: **Principles** and
  **Type**. Scaffolding for judging the system, not part of it.

`tokens/` stays framework-agnostic on purpose — the Nuxt app consumes it the
same way any consuming project would, so the CSS never grows a Nuxt dependency.

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

## Running it

```
pnpm install
pnpm dev
```
