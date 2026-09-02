# What to build next

36 components, and the shapes of the gaps are now visible rather than
guessed: the demo application found some, a grep for duplication found
the rest, and three are things you asked for.

Ordered by the argument that has never been wrong here — **duplication
that already exists goes first**, because it is the only kind of work
whose value is already proven. Then the things that block others. Then
the rest.

Every entry names **the hard part**, because the name of a component is
the easy half and the decision inside it is the whole job.

---

## Found, not guessed

Three facts from the current tree, each of which decides a priority:

- ~~**There is no textarea.**~~ *Done.* It was found by the demo
  application, which collected an issue description in a single-line
  `Input`.
- ~~**The label / help / error / id-generation block is duplicated across
  five files**~~ — **four**, and the correction matters. Checkbox, Radio
  and Switch put the label BESIDE the control, so wrapping them would
  give a wrapper with a hole in the middle. What looked like one
  duplication is two: four fields that stack, and three controls in a
  row. Field covers the first. *Done.*
- ~~**Three components hand-roll their own `aria-live` region**~~ —
  **one**, and this is the second time a grep over this tree read too
  broadly. Calendar puts `aria-live` on its visible month label and
  Attachments on its visible file list; both are correct, and neither is
  a hidden announcer. Only Kanban had one, and it now uses
  `useAnnounce()`. *Done.*

---

## Phase 8 — Controls

### 8.1 Slider — *the volume one*

> **Built.**

Native `<input type="range">` first, for the same reason every other
control here is native: arrows, Home/End, Page Up/Down, touch and the
announcement all arrive free, and `appearance: none` is a price already
being paid by Checkbox, Radio and Switch.

**The hard part is that a two-thumb range cannot be a native input.**
That is the fork, and it should be taken deliberately rather than
discovered: single value is a range input, a *range* of values is a
custom control with pointer capture — the Kanban drag knowledge applies
directly. Build the single first, and say in the file that the second is
a different component wearing the same clothes.

The filled portion of the track has to be painted from the value, which
means a CSS custom property updated on input, or `background-size`. Both
work; one of them keeps working when the value changes from outside.

For volume specifically: a vertical orientation (`writing-mode` does it
now), a mute button beside it that is a *toggle*, not a second slider,
and `aria-valuetext` so it announces "40 percent" rather than "40" — a
number with no unit is a number nobody can act on.

Measure the thumb against the track and the filled track against the
empty one. Both are UI boundaries at 3:1, and neither is obvious by eye.

### 8.2 ToggleGroup — *the toggles one*

> **Built.**

**The hard part is that "toggles" is two components.** Choosing one of
several is a `radiogroup`: one tab stop, arrows move *and* select. Turning
several on independently is a group of buttons with `aria-pressed`: Tab
reaches the group, arrows move within it, Space toggles. Shipping one
behaviour under both names is the standard way this control goes wrong.

One component, one `type` prop, two roles — and the prop documented as
the semantic choice it is, not a styling flag.

Then the visual question, which is separate: a *segmented control* (a
filled track with a moving selection) and a *toolbar of icon toggles*
look nothing alike and behave identically. Both, from one component.

Icon-only toggles need names. Icon already refuses to be a label; this
should refuse too.

### 8.3 Textarea

> **Built.**

**The hard part is auto-growing.** `field-sizing: content` does it in one
line and is Chromium-only today; the fallback is measuring `scrollHeight`
on every input, or the hidden-mirror trick. This is the same shape as the
anchor-positioning decision in `useAnchored`: take the good path where it
exists, keep the fallback small enough to delete later, and write down
which is which.

A character counter is worth having and worth a rule: it **reports, it
does not block**. Truncating what somebody typed is the same lie as
refusing a kanban drop over a WIP limit.

### 8.4 Field — *and a tier problem*

> **Built.**

The wrapper five components duplicate: label, help text, error, the
generated id, the `aria-describedby` wiring that connects them.

**The hard part is not the code, it is the tier.** Field would naturally
be a molecule — but Input, Checkbox, Radio and Switch are *atoms*, and
`scripts/check-layers.mjs` forbids an atom from using a molecule. So
either Field is an atom that other atoms compose, or it stays duplicated,
or the tiers were wrong about one of these.

I think Field is an atom: it holds no data shape and composes nothing but
text. But this is the first time the structure has pushed back, and that
is worth deciding on purpose rather than by whichever answer compiles.

---

## Phase 9 — Surfaces

### 9.1 Drawer — *the side panel*

> **Built.**

**The hard part is modal or not, and it is not a styling choice.**

Modal is `<dialog>.showModal()`, and the argument is the one already
written down: the focus trap, Escape, the inert background, the top layer
and focus returning to the trigger are five things a hand-built panel
reimplements and usually gets one of wrong.

Non-modal is a different component wearing the same clothes: the page
behind stays live, focus must *not* be trapped, and Escape becomes
ambiguous because there are two things it could close. A settings panel
you keep open while working is non-modal; a confirmation flow is modal.

One component with `modal` defaulting to true, or two components. Decide
before the first line, because the two share paint and nothing else.

Edges: `inline-start`, `inline-end`, and `block-end` for the bottom sheet
a phone wants. Resizable is a later question, and when it comes the
pointer-capture work from Kanban answers most of it.

### 9.2 Toast

> **Built.**

**The hard part is the announcement, not the animation.** A live region
has to exist *before* the message arrives or nothing is read out, which
means the region is mounted with the app and empty. Polite and assertive
are two regions, not one with a switch. Timers pause on hover and on
focus, or a toast is a message you can lose by reading it slowly.

And the rule that keeps toasts honest: **never put an action in one that
exists nowhere else.** It is going to disappear.

This was also going to collapse "three hand-rolled `aria-live` regions"
into one `useAnnounce()`. Counted, there was one. Calendar and
Attachments put `aria-live` on an element that is *already on screen and
already says the thing* — the month heading, the file list — which is the
correct shape and not a region to be collected. Only Kanban was
announcing into a box it had built for the purpose.

### 9.3 Progress

> **Built.** `ui/atoms/Progress.vue`.

Out of Attachments and onto a real `<progress>`. Indeterminate turned out
to be the *absence* of a value rather than a flag — the state the browser
already understands, so there is no second one to keep in step. It costs
the paint: an indeterminate `<progress>` is unstyleable in WebKit, so a
rail underneath carries the sweep. Reduced motion slows that sweep rather
than stopping it, because a stopped bar is not a finished one.

### 9.4 Banner

> **Built.** `ui/molecules/Banner.vue`.

The rule that fell out: **a banner is usually not a live region.** One
that is on the page when the page loads has nothing to announce — it is
read in order, like the rest of the page. `announce` is for the other
case, and takes its urgency from the tone.

Tint ground, full-strength text, coloured mark. Colouring the words as
well is the same thing said twice, bought with legibility.

---

## Phase 10 — Navigation

### 10.1 Tabs

> **Built.** `ui/molecules/Tabs.vue`.

Three answers came out of it.

**Automatic versus manual activation is a prop, because both are right.**
Arrows that select as they move is the ARIA default and correct for
panels that are already there. For a panel that fetches, the same
behaviour fires a request per keypress. The consumer knows which it has;
the component cannot.

**Overflow scrolls, and that is the only one of the three that works.**
Wrapping keeps the keyboard model but turns Left and Right into a guess
about line breaks. Collapsing the extras into a "More" menu moves them
*out* of the tablist — the arrows can no longer reach them, the roving
tabindex spans two widgets, and `role="tablist"` stops containing its own
tabs. Scrolling changes neither the order nor the keys.

**If switching changes the URL, it is not a tablist.** It is navigation,
and it wants links with `aria-current`. So there is no `link` prop, and
the same line separates Tabs from ToggleGroup, which can be made to look
identical: choose by what it does, not by how it looks.

The original note read:

> **The hard part is automatic versus manual activation.** Arrow keys that
activate as they move is the ARIA default and it is right for cheap
panels; for anything that loads, it fires a request per keypress and the
answer is manual activation with Enter. Both exist in the spec, and the
choice belongs to the consumer, so it is a prop with a documented reason.

Then: roving tabindex, `aria-controls`, and the overflow problem when the
tabs do not fit — scroll, wrap, or collapse into a menu, and only one of
those keeps the keyboard model intact.

### 10.2 CommandPalette

> **Built.** `ui/molecules/CommandPalette.vue`, `composables/useCommands.ts`.

The registry was the whole job, and the three questions had one answer
each.

**What a command is:** a label, a way to find it, and a function.

**Where it comes from:** a module-level store, for the reason Toaster's
queue is one — a route guard or a plugin has commands and is not inside a
component. Registering does nothing when there is no window.

**How it disappears when its page does:** registration is bound to the
calling effect scope, so a page that registers "Close this issue" takes
it away by unmounting, with nothing to remember. Called outside a scope
it returns its own `off()` rather than warning.

Two things fell out of building it. **The palette ranks and SearchField
refuses to**, which looks like an inconsistency and is the opposite: a
component should rank exactly when it knows what it is ranking, and this
one owns its corpus. And **keywords are scored separately, never
joined** — joined, "theme dark light appearance" answered to "kan" and a
theme switch turned up under a search for Kanban.

The original note read:

> Half of it exists. SearchField already has the combobox model, the ⌘K
shortcut and the suggestion list; Dialog has the top layer and the focus
trap. What is missing is grouping, actions that are not navigations, and
a registry so any part of an app can contribute a command.

**The hard part is the registry**, not the palette: what a command *is*,
where it comes from, and how it disappears when its page does.

---

## Phase 11 — The ones that need a dependency decision

Each gets its own, as before. No blanket approval.

- **DatePicker.** *Built* — `ui/organisms/DatePicker.vue`,
  `composables/useDateText.ts`. **No dependency taken.**

  The hard part was the parsing, and the way out was to stop guessing:
  Intl has no parse API but `formatToParts` says which of day, month and
  year comes first in a locale, so the field order is *asked for* rather
  than kept in a table that goes stale. Everything ambiguous is decided
  by that order, with ISO winning everywhere above it and a named month
  above that.

  The rest is refusals. `31/02` is not a date, so every result is built
  and read back — `new Date(2025, 1, 31)` is the third of March and says
  nothing about it. `3 ma` is not a date, because "ma" is March and May.
  `04/2025` is not a date, it is a month, and filling in the first of it
  would be inventing data.

  Not `<input type="date">`, and that is a cost rather than a win — its
  popup is unstyleable, so it cannot show the events and the range
  Calendar already draws, and its segmented display cannot be pasted
  into. The price is owning the parsing, and it is paid in one file.
- **Combobox for forms.** *Built* — `ui/molecules/Combobox.vue`.
  **No dependency taken.**

  The value is an id, not the text: SearchField's model is the query
  someone typed, because a search box's value *is* what was typed, and a
  form submits a country rather than the letters "Germ".

  It filters where SearchField refuses to, by the palette's rule — a
  component should filter exactly when it knows what it is filtering.
  **But it looks up rather than searching:** a palette is a search, where
  fuzzy matching earns its keep on a half-remembered command; a form
  combobox is a lookup, and a fuzzy match there offers Denmark to
  somebody who mistyped Germany.

  Creating was the real question, and the answer is that the control
  stops at the edge of it: `creatable` offers the row, choosing it emits
  `create`, and nothing is written. A component that pushed the option
  into its own list would make one that exists until the page reloads.
- **TreeView.** *Built* — `ui/organisms/TreeView.vue`.
  **No dependency taken.**

  The part a flat roving tabindex gets wrong is that the list the arrows
  walk is not the list of nodes — it is the list of nodes you can
  currently *see*, and it changes on every open. So it is derived, never
  stored: an index into a list that has since changed is how a cursor
  ends up somewhere nobody pointed it.

  Right and Left each do two things — open or step in, close or step out
  — which is what lets a tree be walked with two keys instead of four,
  and it is the gesture everyone already has from a file browser.

  The level is *spoken*: `aria-level`, `aria-posinset` and `aria-setsize`
  are the only thing telling a screen reader that a row is the second of
  four, three deep. Indentation says it to an eye and to nothing else.

---

## Not building

Worth writing down, because a catalogue without refusals is a wish list.

- **A data grid.** Virtualised, editable, resizable, frozen columns. That
  is a product, not a component, and Table plus Pagination covers the
  cases that are not.
- **A rich text editor.** Same reason, more so.
- **More chart types.** Three series is a measured ceiling and the shapes
  that exist cover the shapes worth drawing. A fourth series is small
  multiples.
- **An animation library.** Four duration tokens and four easings, all
  collapsing under `prefers-reduced-motion`. Anything that needs more
  than that needs to justify itself first.

---

## Done

**Field, Textarea, Slider, ToggleGroup, Drawer, Toast, Progress, Banner.**

The tier question was answered in the building: Field is an atom, because
three of its four callers are atoms and an atom that cannot use it keeps
its own copy. That also exposed a rule check-layers documented but did
not enforce.

Slider took the longest and taught the most, all of it about **one value
wearing two meanings**. `step` was simultaneously what an arrow key
moves by, what the number reads as, and where the thumb may land — and
only the third wanted to be finer, so the pointer got its own grid.
Ticks were the same confusion one level up: a mark can be a *detent* (a
place you want back, like zero decibels) or a *gradation* (one reading of
a scale, like half volume), and only the first should catch a drag.

## Next

Nothing. Every entry in this catalogue is built, and the three dependency
decisions it reserved were all answered the same way: no dependency was
taken.

What is left is not a list of components. It is the habit that found the
last dozen defects — measuring instead of judging — and the second one is
no longer a habit.

**Playwright — taken.** Loading every page and reading what the browser
says was done by hand three times and found a hydration mismatch on all
fifty pages, a full-viewport blank block on all fifty, and eight workshop
defects. A check that lives in somebody's memory runs only when they
remember, so it is `pnpm test:e2e`: every route derived from the pages
directory, Chromium only, against the dev server because a hydration
mismatch is a dev-only warning. Proven the same way check-dialogs was —
the bug put back, the sweep naming it: `closed dialog.u-cp is 1280×900`,
`Property "pct" was accessed during render but is not defined`.

**`vue-tsc` — taken.** It is the only dependency this catalogue added,
and it earned it in the first run. The layer itself came back clean:
zero errors across `ui/`, `composables/` and `plugins/`. Everything it
found was around them, and five of those were real:

- Two `import type` paths broken by the page split. Invisible at runtime
  because types are erased and the components resolve globally.
- The Icon page documenting `size="inherit"`, which Icon did not have.
  Spinner had it; Icon not having it was an inconsistency, and the
  workshop had been describing a prop that was not there.
- A `variant="secondary"` on a Button, which silently rendered the
  default.
- The Attachments page carrying a hand-copied version of the component's
  own type, which had drifted: `id: number` where the component takes
  `string | number`.

And one API gap: **Table is generic over its row now.** With `rows:
Record<string, any>[]` every cell slot handed the caller a bag of unknown
keys, so a table given `Issue[]` could not give `Issue` back. The demo
app's typecheck said so the first time one ran, which is the half of
"prove the layer is consumable" a successful build does not cover.

What it costs: five seconds a run, and a resolution stack printed four
times because Nuxt asks for a Volar plugin at a path the installed
vue-router no longer exports. Overriding it from the extending config
does nothing — vue-tsc reads that option from the referenced project
files — so the noise stands until vue-router ships the subpath again. It
is written down here rather than filtered away: a grep that hides one
known-benign line is a grep that will hide the next real one.
