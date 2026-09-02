# Working in this repo

A personal design framework: a Nuxt layer of tokens and components, a
workshop that consumes it, and a demo app that consumes it from outside.
`README.md` says what it is. This file is the part that is not obvious
from reading the code, written down because every entry below cost
somebody an afternoon first.

## The one command

```bash
pnpm test
```

Five static guards, the tests, both typechecks, then every page in a
real browser — ordered so the cheapest failure is reported first:

| step | what it protects | how it fails |
|---|---|---|
| `test:contrast` | every foreground/background pair against WCAG | a ratio, so you can see how close |
| `test:layers` | no tier reaches upward | names the component and the import |
| `test:dialogs` | a closed `<dialog>` stays invisible | names the class that sets `display` |
| `test:pages` | every component has a page, every page a component | both directions |
| `test:package` | what `files` would actually install | lists what would be missing |
| `test:unit` | the keyboard contracts and the behaviour | ordinary test output |
| `test:types` | the workshop and the demo app, `vue-tsc` | file, line, and what was expected |
| `test:e2e` | every page loaded in Chromium: console, overflow at 390px, duplicate ids, unnamed controls, closed dialogs taking room | the page, and the sentence |

Run one on its own with `pnpm test:contrast`, `pnpm test:layers` and so
on. The static part takes about twelve seconds and the browser sweep
another forty; there is no reason to skip either. CI runs the same steps
in the same order, plus the build.

`pnpm dev` is the workshop, `pnpm demo` the consumer app, `pnpm build`
builds the workshop.

`typescript` is pinned to `^5` on purpose: `vue-tsc` reads
`typescript/lib/tsc`, which TypeScript 7 no longer exports, and it dies
on it with a stack that names neither. Found by installing the tarball
into an empty project, where a fresh `npm i -D typescript` brought 7.

On a fresh clone the `.nuxt` directories do not exist yet, so an editor
will report every auto-import as undefined until something generates
them. `pnpm test:types` does it on its own; so does `pnpm dev`. There is
deliberately no `postinstall` doing it for you — this package is
installed by other projects, and their install should not run our
workshop's prepare step.

`.claude/settings.json` pre-approves exactly these — the checks, the
build, and read-only git. Nothing that writes, nothing that installs
beyond `pnpm install`, nothing that reaches the network. Delete it if you
would rather be asked every time.

## Where a thing goes

- **A component** → `ui/<tier>/Name.vue`, auto-imported as `<UiName>`. The
  folder never appears in the name, so a component can change tier without
  breaking a consumer.
- **Its page** → `.playground/app/pages/<tier>/name.vue`, kebab-cased, and
  add it to `.playground/app/data/nav.ts`. `test:pages` fails otherwise —
  in both directions.
- **Its tests** → `tests/name.test.ts`. Keyboard contracts and behaviour
  only; a test that pins padding makes the padding harder to change.
- **A pure helper** → `composables/`, even when it is not a composable.
  `useCommands.ts` exports `score` and `match`; `useDateText.ts` exports
  `parseDate`. That directory is what Nuxt auto-imports.
- **A colour** → `tokens/`, and it comes with its pair in
  `scripts/check-contrast.mjs`. Every one, no exceptions.

**Which tier is partly judgement; the dependency direction is not.** An
atom may not use a molecule. If a component reaches upward, the answer is
usually that it belongs a tier higher, not that the rule is wrong — that
is how Field ended up an atom and Select a molecule.

## Traps, all of them measured

**`defineModel` does not apply a write locally** when the parent binds
`v-model`. It emits, and the value returns as a prop on the parent's next
render. Reading it back in the same tick gives you the old one — which is
why Kanban held arrow keys, SearchField refused to open, and
announcements ran a move behind. Use `nextTick`, or a local shadow.

**Vue stamps the parent's scope id onto a child component's root
element.** So `.u-invalid .u-input` resolves across the Field/Input
boundary in scoped CSS. `:deep()` is the wrong tool there: it looks
*down*, and this looks up.

**An author's `display` beats the UA stylesheet.** Setting it on a
`<dialog>` root un-hides the closed one — measured at 982×1358 in the
normal flow of every page. Gate it on `[open]`; `test:dialogs` checks.

**A link component is a component, not a string.** `link="NuxtLink"`
renders a literal `<nuxtlink>` element: right shape, right highlight, not
clickable. It happened three times before `plugins/link.ts` started
providing it app-wide.

**Module state must no-op on the server.** `useToast` and `useCommands`
both do: a server-side store is shared between requests, and a command is
a thing a person invokes. The corollary bit once — CommandPalette
rendered "No matching commands" on the server, because the registry is
knowably empty there, and the client replaced it on hydration. Anything
whose content depends on client-only state renders nothing until
`onMounted`.

**`\w` is ASCII-only, so `\W` contains `ä`.** `[^\W\d_]+` split "März"
into "M" and "rz". Use `\p{L}` with the `u` flag.

**Fake timers stub `setTimeout`,** and Vue's scheduler runs on
microtasks. Flush with `nextTick`, not by advancing the clock.

**Clearing `document.body` is not unmounting.** `tests/setup.ts` calls
`enableAutoUnmount`, which is also the assertion that components clean up
their window listeners.

## Verifying

**"It builds" is not evidence, and neither is a passing test.** The last
three sessions found, in this order: a hydration mismatch on every page,
a full-viewport blank block at the bottom of every page, and eight
defects across the workshop — none of which the build or the suite could
see. What found them was loading each page and reading what the browser
said.

That sweep is `pnpm test:e2e` now — every route, derived from the pages
directory, loaded in Chromium against the dev server, asked four
questions. It is against the dev server on purpose: a hydration mismatch
is a dev-only warning and production Vue says nothing about it.

It does not replace looking. For anything visible: open it, drive it
with the keyboard, and read the console yourself. The sweep asks four
questions; a person asks the fifth.

**Measure rather than judge.** "The slider feels notchy" became three
findings only after counting pixels per step. Report the number.

## What this framework refuses

- **A control that does nothing.** A collapsed sidebar keeps its icons; a
  breadcrumb's last crumb is not a link; a fold you cannot open is a trail
  with a hole in it.
- **Saying the same thing twice in colour.** Tint ground, full-strength
  text, coloured mark — accent-on-accent-tint fell under AA twice.
- **Inventing data.** `04/2025` is a month, not a date; filling in the
  first of it would be making something up.
- **A dependency without its own decision.** Four have been taken so far
  and three were refused. `ROADMAP.md` records each with its reason.
- **Building the thing next to the thing asked for.** A range with two
  thumbs is not Slider with a prop; a remote picker is not Combobox with a
  flag. Say so instead of growing into it.

## Writing it down

Component files carry their reasoning in the doc comment at the top — not
what the code does, but what was decided and what it cost. `ROADMAP.md`
records the same at the level of the catalogue. A commit message says
what was found and how, because "fix slider" is not a record of anything.

The design principles live in `.playground/app/data/principles.ts` and
render on the Principles page. House style: start with *Always* or
*Never*, one rule per entry, and always give the reason. **A rule you
cannot justify is a habit, not a principle.**
