# flechtenmacher-font

Typography foundation for a personal design framework. SF Pro, systematised.

## What's here

- **`tokens/type.css`** — the artifact. An 11-step type ramp where each step
  couples size + line-height + weight + tracking as one bundle, plus weights,
  families, a tracking formula for off-ramp sizes, and tabular-numeral and
  measure utilities.
- **`ui/`** — the components, in atomic tiers. Auto-imported as `<UiButton>`,
  `<UiInput>`, `<UiBadge>` — the folder never appears in the name, so components
  can move between tiers without breaking a single consumer.

  | tier | may use | holds |
  |---|---|---|
  | `atoms/` | nothing from `ui/` | a single primitive |
  | `molecules/` | atoms | a small composition with one job |
  | `organisms/` | molecules, atoms | anything owning a **data shape** |
  | `templates/` | anything | page skeletons of slots, no data |

  Which tier a component belongs in is partly judgement. The **dependency
  direction** is not, and it is the part that rots — so `scripts/check-layers.mjs`
  enforces it and nothing else.
- **`.playground/`** — the workshop. A Nuxt app that consumes this layer
  exactly the way a real project does, so anything broken about the layer's
  public surface breaks here first. Not shipped.
- **`demo/`** — an issue tracker that consumes the layer from outside, the
  way an installed copy would. Not shipped either.
- **`scripts/check-*.mjs`** — five guards, each for something no build and
  no test would notice: colour contrast, the tier dependency direction, a
  closed dialog that an author's `display` un-hid, a component with no page
  (or a page with no component), and what `files` would actually install.
  All run in CI without a browser.

`tokens/` stays framework-agnostic on purpose: plain CSS custom properties with
no Nuxt dependency, usable from any stack.

## Using it

```
pnpm add -D @lf/design lucide-vue-next
```

`lucide-vue-next` is listed twice on purpose. The layer depends on it for its
own glyphs, but **you** need it declared too if your pages import icons
directly:

```vue
import { Plus } from 'lucide-vue-next'
<UiIcon :is="Plus" />
```

Skipping it appears to work under pnpm's default hoisting and then fails under
npm, yarn, or `hoist=false` — the worst kind of missing dependency, because it
passes locally.

```ts
// nuxt.config.ts
export default defineNuxtConfig({ extends: ['@lf/design'] })
```

That brings the tokens, the `Ui*` components and the pre-paint theme script.

## Principles

The design principles live in `.playground/app/data/principles.ts` and
render on the Principles page.

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
pnpm test        # all six: contrast, layers, dialogs, pages, package,
                 # behaviour, and both typechecks
pnpm test:watch  # the behaviour tests, while you work
```

### What the tests are for

Most of the checks look at what a component *is* — its contrast, where it
sits in the tiers, whether a closed dialog stays closed, whether it would
install. Only the behaviour suite looks at what it **does**, and that is
the part nothing else can see: an
arrow key that stops moving, a mode that stops clearing, a highlight that
takes the focus with it. None of those changes a colour or a file list.

So the behaviour tests cover the keyboard contracts and nothing else.
They do not assert padding or check that a class is present; a test that
pins the styling makes the styling harder to change, which is the
opposite of the point. They run against real components with the real
ones they depend on — `tests/setup.ts` reproduces what Nuxt provides
rather than stubbing it away, because a Menu that has never met a Popover
is not the Menu anyone ships.

Every stub in that file says what it stands in for. `happy-dom` has no
Popover API, no `ResizeObserver` and no `matchMedia`, and this framework
leans on all three deliberately. A stub is a place where a test stops
testing reality, so none of them decides an outcome: the popover stubs
only remember whether they were opened.

### Proving it is consumable

The playground resolves everything from disk, so it cannot tell you
whether an *installed* copy works. `pnpm test:package` covers the part
that fails silently — whether `files` would ship every component, token
and composable, and whether Nuxt and Vue are peers rather than bundled
copies. It runs on every commit.

The rest needs a real project, which is worth doing whenever the public
surface changes:

```bash
npm pack                                   # a tarball, not a symlink —
                                           # a link ignores `files`
mkdir /tmp/consumer && cd /tmp/consumer
npm init -y && npm pkg set type=module
npm i ../path/to/lf-design-0.1.0.tgz
npm i -D nuxt vue
echo 'export default defineNuxtConfig({ extends: ["@lf/design"] })' > nuxt.config.ts
```

Then write one page that uses a spread of components — including the ones
with the least ordinary needs: Diagram measures the DOM, Kanban teleports,
Calendar leans on `Intl`, the overlays live in the top layer. Build it,
open it, and check three things the build will not tell you: the tokens
resolved, `styles/base.css` applied them, and the theme script arrived in
the `<head>` ahead of the first stylesheet.

Last run: 36 components, both themes, no console errors — which was
before the layer grew to 49 and before Combobox, TreeView, DatePicker and
the palette existed. It is due again.

## For an agent working here

`AGENTS.md` has the part that is not obvious from the code: what each
check protects, where a new component's files go, and the traps that have
already cost somebody an afternoon.
