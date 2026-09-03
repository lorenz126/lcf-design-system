# Using @lf/design

For the agent working in an application that consumes this layer. Paste
this into that app's `AGENTS.md` or `CLAUDE.md`, or hand it over as the
first message. `AGENTS.md` in this repository is for working *on* the
layer; this is for working *with* it.

## The one rule

**Never build what exists.** These forty-nine are auto-imported as
`<UiName>` — no import statement, ever, and never from the package path.

| tier | components |
|---|---|
| atoms | Avatar Badge Button Checkbox Divider Field Icon Input Progress Radio Slider Spinner Switch Textarea |
| molecules | Banner Breadcrumb Card Combobox CommandPalette Dialog Drawer EmptyState FormSection Menu Pagination Popover Prose SearchField Select Tabs Toaster ToggleGroup Tooltip TopBar |
| organisms | Attachments Calendar Chart DatePicker Diagram Form Kanban List Sidebar Table Toc TreeView |
| templates | AppShell DocLayout SplitView |

Before reaching for a `<div>` with a class, check the table. A modal is
Dialog. A side panel is Drawer. A dropdown of actions is Menu. A
notification is `useToast()`. A "which view" strip is Tabs; a "which
value" strip is ToggleGroup. A picker you type into is Combobox. A date
is DatePicker. If it is genuinely not here, say so and build it in the
app — do not fork a layer component to add a prop; ask for the prop
upstream.

## Where the documentation is

**The doc comment at the top of each component file** —
`node_modules/@lf/design/ui/<tier>/<Name>.vue`. Read it before using a
component for the first time. It does not describe the props; it says
what was decided, what it costs, and what the component *refuses* to be.
That last part is the one you need: Slider says it will never grow a
second thumb, Combobox says it is not a remote picker, Tabs says it is
not for routes.

## Installing

```
pnpm add -D github:lorenz126/flechtenmacher-font#v0.2.0 lucide-vue-next
```

`lucide-vue-next` is declared twice on purpose. The layer depends on it,
and the app must too, because pages import icons directly:

```vue
import { Plus } from 'lucide-vue-next'
<UiIcon :is="Plus" />
```

Skipping it works under pnpm's hoisting and fails under npm. Then:

```ts
// nuxt.config.ts
export default defineNuxtConfig({ extends: ['@lf/design'] })
```

That brings the tokens, the components, `styles/base.css`, the
pre-paint theme script, and a plugin that gives Sidebar and Breadcrumb a
real link component. Do not pass `link="NuxtLink"` as a string anywhere:
it renders a literal `<nuxtlink>` element that looks right and does not
navigate.

For typechecking: `typescript@^5` and `vue-tsc`, then `nuxt typecheck`.
TypeScript 7 breaks vue-tsc with an unhelpful stack.

## Mount once, use anywhere

In the root layout, once:

```vue
<UiToaster />
<UiCommandPalette />
```

Then from any component or composable: `useToast().success('Saved')`,
and `useCommands(() => [...])` to contribute commands that leave with the
page that registered them. `useAnnounce()` speaks to a screen reader
without a visible element. `parseDate`, `formatDate`, `fieldOrder` and
`dateHint` are the locale-aware date helpers DatePicker itself uses.

## Colour and spacing: semantic tokens only

Components and app CSS may reference these and only these:

- ground: `--bg`, `--bg-raised`, `--bg-sunken`
- text: `--fg`, `--fg-muted`, `--fg-subtle`, `--fg-on-accent`
- fills: `--fill-quiet`, `--fill`, `--fill-strong`
- edges: `--border`, `--border-strong`, `--rule-faint`
- accent: `--accent`, `--accent-text`, `--accent-subtle`
- hues: `--<blue|green|yellow|orange|red|purple>-text`, `-fill`,
  `-badge-bg`, `-badge-fg`
- space `--s-1`…`--s-12`, radii `--r-*`, type `--fs-*`/`--lh-*`/`--w-*`,
  motion `--dur-*`/`--ease-*`, focus `--focus-color`/`--focus-width`

Never `--gray-*`, `--blue-rgb`, or any hex. Primitives exist so the
semantic tier can be re-derived; a component that touches one is a
component the theme cannot move.

## Contracts that bite

- **Tabs are not routes.** If switching changes the URL, use links with
  `aria-current`, not a tablist. The same line separates Tabs from
  ToggleGroup: choose by what it does, not how it looks.
- **DatePicker's model is ISO** `yyyy-mm-dd`, in every locale. The text
  in the box is the locale's business; the value is not.
- **Combobox's value is an id**, never the label. `creatable` emits
  `create` and writes nothing — make the option where the others live.
- **Table is generic**: hand it `Issue[]`, get `Issue` in the cell slots.
  Numeric columns declare `numeric: true` and get tabular figures.
- **Every form control goes through Field's wiring** — Input, Textarea,
  Select, Slider, Combobox, DatePicker all take `label`, `help`, `error`.
  Do not put a bare `<label>` beside them.
- **Dialog and Drawer** are `v-model:open`. Drawer is modal by default;
  `:modal="false"` keeps the page interactive (bound — the string `"false"` is true).
- **A disabled tab, tree node, or option still takes focus.** That is by
  design; do not work around it with `pointer-events`.
- **Sidebar is one level deep** and will refuse a second. Arbitrary
  depth is TreeView.

## What the design refuses, and you must too

- **A control that does nothing.** No link to the current page, no
  disabled button that gives no reason, no chevron that does not open.
- **Saying a thing twice in colour.** Tint ground with full-strength text
  and a coloured mark — never coloured text on its own tint. It fell
  under AA in dark mode every time it was tried.
- **"Here" is neutral.** The current row, the open tab, the chosen chip:
  a neutral ground and heavier text, not the accent.
- **A fill that is read against is opaque.** The hue fills already are;
  do not put a Badge on a translucent surface of your own.
- **Restyling a component from outside** with `:deep()` or by overriding
  its tokens locally. If it looks wrong, that is a finding for the layer.

## Verify what you built

The build passing is not evidence. For anything visible: open it, drive
it with the keyboard only, and read the console — a Vue warning is a
defect that has not become an error yet. Check it in dark
(`localStorage.theme = 'dark'`), and at 390px wide. If a colour looks
wrong, measure the ratio before judging it.

## Versions

The tag is the promise. Before bumping it, read *Breaking* in
`node_modules/@lf/design/CHANGELOG.md` — within `0.x` a breaking change
bumps the minor.
