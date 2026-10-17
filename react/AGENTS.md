# Working in react/

The React library. The Nuxt layer at the repository root is `0.3.x`, in
maintenance; this directory is `0.4.0` onward. Read the root
`CONTRIBUTING.md` for how a change gets in.

## The one command

```bash
pnpm test
```

In order, failing on the first: contrast (340 pairs, both themes) ·
stories (every component has stories with a `Showcase`, a doc comment
on every example, a public path and its CSS in `src/css/index.css`) ·
strings (no visible text outside the message table) · vitest · tsc ·
build · Playwright in three passes (light/en-GB, dark/de-CH, reduced
motion) over every story (`e2e/stories.spec.ts`) and every docs page —
each MDX page and each component's page around its stories
(`e2e/docs.spec.ts`) — at 1280 and 390 (docs pages at 320 too), asking
each the same six questions (`e2e/audit.ts`): sideways scroll, hidden
things taking room, duplicate ids, controls with no name, text (typed
values and a closed select's choice included) too faint where it
landed, and the layer's words under the wrong `lang`.
`e2e/fields.spec.ts` drives Field, Input, NumberField and Select by
keyboard in a real engine. The story pass never renders
the page around a story; the docs pass is what sees the headings, the
props table, every example's code opened, and the focus rings. Once,
in the dark/de-CH pass, `e2e/chrome.spec.ts` loads the site itself —
sidebar, toolbar, tab title, "On this page" — which nothing else runs.
`SB_PORT` sets the Storybook port, so two checkouts can sweep at once.

Before anything is tagged: `pnpm verify:consumer` — packs the library,
installs it into an empty Vite + React + Tailwind app, typechecks,
builds, serves it statically and reads it in a browser.

Tags are made by `bash scripts/release.sh <version>` and nothing else:
it runs both of the above, then tags a commit of its own that carries
the built `dist` and no `prepare` script, so an app installs the tag
without building (pnpm 12 refuses a git dependency's build unless the
app allowlists it). The branch never carries `dist`. Write the
`## <version> — <date>` section in CHANGELOG.md first; the script
refuses without it. Only the owner pushes a tag.

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

Every `X.stories.tsx` starts with `Base` — the primary example, shown
with its code open — and exports `Showcase` with `tags: ['!autodocs']`:
the bare row under the title of the docs page, which the tag keeps out
of Examples and off the primary canvas.
`.storybook/DocsPage.tsx` says why it is built that way.

## The vocabulary

`color` (eight intents) · `variant` (`solid` `soft` `outline` `ghost`) ·
`size` (`sm` `md` `lg`) · `block` · `loading` · `disabled` · `selected`
· `uniform` · `invalid` (a control shows it, never decides it) ·
`description` (the guidance under a thing, which feeds
`aria-describedby`). A prop that means one of these things is spelled
this way.
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
- **`--fld-*` is the Field↔control contract, not a token family.** The
  frame sets `--fld-h`, `--fld-fs`, `--fld-pad` from its own `data-size`;
  a Field sets `--fld-value-fg` and `--fld-value-style` on itself while
  suggested, and the value text reads them. Nothing reaches down with a
  descendant selector, and nothing reports up: Field reads a control's
  emptiness only from `data-empty` (and uncommitted text from
  `data-dirty`) on the box directly inside its control slot, with
  `:has()`.
- **A React 19 `useId` id is not a CSS selector.** Join ids into
  `aria-*` attributes and look them up with `getElementById` or a ref.
- **A description is one flat string, spoken in the focused element's
  language.** A `lang` on a hidden description sentence serves browse
  mode and braille, not the focused announcement — which is why apps
  must set `<html lang>` to the provider locale.
- **A Radix Dialog listens for Escape in the capture phase.** NumberField
  spends an Escape on undoing an edit (`[data-dirty]` on its box), and
  a Field with ↺ spends the next one on going back to the suggestion
  (`[data-action="revert"]` in the field); a Dialog built on Radix must
  leave those Escapes alone, or it closes the dialog with the edit.
- **React collects an event's listeners before any runs.** A parent's
  handler is the closure of the render before a child's `flushSync`:
  Field read a stale `onConfirm` on Enter and confirmed 118 while the
  box said 120. A callback read after a child's flush goes through a ref
  set in a layout effect.
- **Vitest's module cache bakes `import.meta.glob` results in.** Vitest 5
  caches transforms by the file's own content, so a glob over the tree
  (the Introduction's catalogue) kept the old file list when stories
  were added. `fsModuleCache` is off in `vitest.config.ts`.

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
reads — and it is rendered as **Markdown** on the public site, so a
list is a `- ` list, never columns aligned with spaces (indented lines
become code blocks). A commit message says what was found and how.

Every element whose text, `aria-label` or `title` comes from the message
table carries `lang={t.lang(key)}` on the smallest element that holds
only those words — always, never read from `<html lang>`. The app's own
text (labels, descriptions, errors, values) is never marked; the
formatter's own writing carries `format.locale`.

## The documentation site

https://lcf-design-system.vercel.app — the Storybook, built by Vercel on
every push to `react` (production) and to any branch that has a
`react/` directory (preview). The settings live in the Vercel project,
not in a file, because the project root is the repository root:

| setting | value |
|---|---|
| install | `pnpm --dir react install --frozen-lockfile` |
| build | `pnpm --dir react build-storybook` |
| output | `react/storybook-static` |
| ignored build step | `test ! -f react/package.json` — skips `main` while it is the Nuxt layer. Not `test ! -d react`: Vercel restores the build cache (`react/node_modules`) before this runs, so the directory exists on `main` too — measured on the 0.3.4 push, which built and failed. |
| production branch | `react` |

When `react/` reaches `main`, switch the production branch to `main`
and nothing else changes.
