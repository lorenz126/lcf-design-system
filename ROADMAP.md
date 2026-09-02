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
- **Three components hand-roll their own `aria-live` region** — Kanban,
  Calendar, Attachments. A fourth is coming with Toast.

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

**The hard part is the announcement, not the animation.** A live region
has to exist *before* the message arrives or nothing is read out, which
means the region is mounted with the app and empty. Polite and assertive
are two regions, not one with a switch. Timers pause on hover and on
focus, or a toast is a message you can lose by reading it slowly.

And the rule that keeps toasts honest: **never put an action in one that
exists nowhere else.** It is going to disappear.

This is also where the three hand-rolled `aria-live` regions in Kanban,
Calendar and Attachments should collapse into one `useAnnounce()`.

### 9.3 Progress

Already written, inside Attachments, on a real `<progress>` element.
Extract it, add the indeterminate state that Attachments does not need
and everything else does.

### 9.4 Banner

An inline message with a tone — the thing a page says about itself, as
opposed to a toast, which is what happened. Small, and it stops every app
inventing its own. The tones are measured already.

---

## Phase 10 — Navigation

### 10.1 Tabs

**The hard part is automatic versus manual activation.** Arrow keys that
activate as they move is the ARIA default and it is right for cheap
panels; for anything that loads, it fires a request per keypress and the
answer is manual activation with Enter. Both exist in the spec, and the
choice belongs to the consumer, so it is a prop with a documented reason.

Then: roving tabindex, `aria-controls`, and the overflow problem when the
tabs do not fit — scroll, wrap, or collapse into a menu, and only one of
those keeps the keyboard model intact.

### 10.2 CommandPalette

Half of it exists. SearchField already has the combobox model, the ⌘K
shortcut and the suggestion list; Dialog has the top layer and the focus
trap. What is missing is grouping, actions that are not navigations, and
a registry so any part of an app can contribute a command.

**The hard part is the registry**, not the palette: what a command *is*,
where it comes from, and how it disappears when its page does.

---

## Phase 11 — The ones that need a dependency decision

Each gets its own, as before. No blanket approval.

- **DatePicker.** Calendar exists and is fully keyboard-driven; what is
  missing is the pairing with a text field that accepts typed dates. The
  hard part is parsing — a typed date is locale-shaped, ambiguous, and
  the place where `Intl` stops being enough.
- **Combobox for forms.** SearchField is a combobox for chrome. A form
  one has different needs: a value that is an id rather than a string,
  multiple selection, creation of new options.
- **TreeView.** Sidebar explicitly refused to become one. When something
  actually needs arbitrary depth, this is the component — roving tabindex,
  arrows that expand and collapse, level announcements.

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

**Field, Textarea, Slider, ToggleGroup, Drawer.** The tier question was
answered in the building: Field is an atom, because three of its four
callers are atoms and an atom that cannot use it keeps its own copy. That
also exposed a rule check-layers documented but did not enforce.

## Next

**Toast**, and with it the `useAnnounce()` that collapses the three
hand-rolled live regions in Kanban, Calendar and Attachments into one.
Then **Progress** out of Attachments, **Banner**, and **Tabs**.
