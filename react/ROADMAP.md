# What to build next

The React library starts with its foundation and four components. The
rest is two lists merged into one order: the 49 components of the Nuxt
layer that have to come across, and the requirements from kustik
Offerttool and art orchestration (Jonathan, 2026-10-13). Their order
wins where they overlap, because a requirement with a screen waiting for
it is the only kind of priority whose value is already proven.

Every entry names **the hard part**. The name of a component is the easy
half.

## Done — the foundation

| | what | where |
|---|---|---|
| ✓ | Intent colours: eight meanings × six roles, nested themes, `--accent-solid-bg` | `src/tokens/color.css`, `src/css/intent.css` |
| ✓ | Contrast guard over every pair, and over an **app's own accent** (`lcf-check-contrast app.css`) | `scripts/check-contrast.mjs` |
| ✓ | **J1** Language and texts centrally: `LcfProvider locale`, message table per language, app overrides | `src/i18n/messages.ts`, `context.tsx` |
| ✓ | **J1** `check-strings`: visible text outside the table fails the build | `scripts/check-strings.mjs` |
| ✓ | **J2** One formatter per market, separators pinned where ICU versions disagree, replaceable | `src/i18n/format.ts` |
| ✓ | **J14** Status colours with fixed meaning — intents, and the status-map pattern | `Colors.mdx`, Badge `StatusMap` |
| ✓ | **J15** Findings as a list — one Alert with a list body, not a stack | Alert `Findings` |
| ✓ | Theme helpers and the pre-paint script, verified on a static build | `src/theme/index.ts`, `verify-consumer.sh` |
| ✓ | Button, Badge, Alert (was Banner), Spinner | `src/components/` |
| ✓ | **J3** NumberField with unit: the reader's separators, min, max, step, commit on blur/Enter/arrows, never clamped or rounded; Input for text; Field for label, description, error and required | `src/components/NumberField`, `Input`, `Field` |
| ✓ | **J4** Field state (`suggested`, `confirmed`; required-and-empty derived), origin (customer, staff by name, assumed, missing; by e-mail or form), the price-driver `hint`, Enter to confirm and ↺ back to the suggestion | `src/components/Field` |
| ✓ | The layer's words carry their language (`t.lang`), Alert and Spinner included; the sweep checks it | `src/i18n/context.tsx`, `e2e/audit.ts` |
| ✓ | Select: the platform's `<select>` in the field frame, in Field unchanged — a placeholder that is never a value, groups, disabled options, a value the list does not offer shown and called wrong, read-only as one option | `src/components/Select` |

### J3 and J4: where the build departs from the request, for Jonathan to confirm

1. **"Pflicht leer" is not a `state` value.** It is derived from
   `required` and the control's emptiness, so it cannot disagree with
   the value. `state` is `suggested` or `confirmed`.
2. **The unit is part of the field's accessible NAME** ("Fläche
   Quadratmeter", through `aria-labelledby`), not its description:
   VoiceOver reads descriptions late, if at all.
3. **"help" is spelled `description`**, as Alert spells it.
4. **The "slot for a mark" is a typed `origin`** from the layer's
   vocabulary — consistent across fields and, later, media items. The
   free third slot is `hint` (a string, and `hintIcon`).

Open questions:

1. Enter confirms and never submits in a field the app makes
   confirmable, and does not move to the next field. Agreed?
2. Is a value a person typed "bestätigt" by itself, or only after Enter
   or ✓? The Review story's recipe assumes Enter or ✓.
3. Should "Pflichtfeld" with its caution edge show on pristine required
   fields outside review screens (a "create offer" form)?
4. A required, empty field with origin "missing" shows both
   "Pflichtfeld" and "Fehlt". Keep both?
5. Sign-off on the darker field edge, `--border-field`, 3.41:1 where
   the Nuxt edge was 1.48:1.
6. In de-CH, a lone comma is now the decimal comma: "2,450" in a metre
   field is 2.45, where it was read as 2450 (`format.test.ts` pinned
   `1,500` → 1500 and now pins 1.5). Swiss usage writes the comma on
   quantities and the apostrophe for thousands; an English-trained
   hand writing "1,500" for fifteen hundred now gets 1.5. Agreed?
7. Escape in a field with ↺ goes back to the suggestion (↺ itself left
   the Tab order: as a Tab stop it sat in the forward path of the field
   above it). Agreed as the keyboard way back?

### Select: for Jonathan to confirm

1. **Native, so the open list is the platform's**: options are text —
   no icons, no second line, no search — and on a phone it is the
   phone's own picker. Enough for market, product line and unit? Lists
   that need more go to Combobox.
2. **A suggestion the list does not offer** ("LI" from an e-mail, a
   withdrawn product line) is shown as itself and called wrong ("Steht
   nicht zur Auswahl."), and Enter refuses to confirm it. Should the app
   map such values before they reach the field instead?
3. **An optional Select is cleared by choosing its placeholder**
   ("Bitte wählen…"); a required one cannot go back to it. Agreed, or
   should optional fields show "Keine Angabe" as a choice of its own?

Before tagging: a manual pass with NVDA, JAWS and VoiceOver (macOS and
iOS) over Enter-to-confirm, the blur and step announcements, the voice
switching on `lang`, and a Select's value, placeholder and problem —
no screen reader was available to the build.

## Next — Priority 1 (the first Offerttool screen)

| # | component | the hard part |
|---|---|---|
| — | Combobox, Textarea | Ports, each sitting in Field unchanged through `useField()` — the contract is in its doc comment; Select follows it. Combobox takes what Select refuses — search, icons and a second line in options, several choices — on Radix's primitives where the Nuxt version hand-rolled listbox keyboard handling. Its trigger is not a `<select>`, so Field's Enter-to-confirm and its `validity` check need a way in (Select needed none: Field already treats a `<select>` as a one-line control). A Radix Dialog must leave alone an Escape spent by a NumberField (`[data-dirty]`) or by a Field with ↺ (`[data-action="revert"]`). |
| — | Checkbox, Radio, Switch | Ports. Not in Field: their label sits beside a control that comes first. |

## Then — Priority 1 continued, and media

| # | component | the hard part |
|---|---|---|
| J5 | **DataGrid** (new; Table stays a display table) | Editing per cell with validation per cell and marked changes. A new component, not a Table prop: a grid has a cell cursor and Enter-to-edit, a table has rows you read, and one component with both keyboard models is neither. Columns per market = a column filter on the app's side, not a feature. |
| J6 | Table: **groups and totals** | Chapter rows with subtotals and a footer total. Totals through `useFormat().money`, and `numeric` columns in tabular figures — the place where the CH/AT separator pinning pays. |
| J7 | **AsyncCombobox** (new; Combobox stays local) | Server search: debounce, cancel the stale request, keep the selected item's label when it falls out of the results, announce the result count. Combobox's doc says it is not a remote picker; that stays true. |
| J19 | **MediaPanel** | Origin per item (customer, staff, e-mail, form) with Field's `Origin` type and words — `originWords` in `Field/origin.tsx` becomes public then. Thumbnails, one main image (images only, never a PDF), favourites, reorder by drag *and by keyboard*, unlink. Knows no storage: preview URL, original URL, metadata. |
| J20 | **MediaUpload** (new, beside Attachments) | Several files, drop, progress, camera on a phone (`capture`), and category, licence and author REQUIRED per file before save. A new component rather than Attachments with props: Attachments is "choose files", this is a form per file. |
| J21 | **TagInput** | Suggestions from the app, free tags allowed, spaces to underscores as the app's rule, not the component's. |
| J22 | **MediaGallery** | List ↔ tiles, filter bar (category, licence, type, object), search. |
| J23 | **MediaViewer** | Page through images; PDF pages; link to the original. PDF needs a renderer — a dependency decision (pdf.js is ~1 MB), to be argued before it is taken. |
| J24 | **MediaCell** | Main image small plus count, for a table column. |
| J25 | Licence as a badge | Already possible: a map from licence to `color`, documented. A `LicenceBadge` only if two apps write the same map. |

## After — Priority 2

| # | component | the hard part |
|---|---|---|
| J8 | **Steps** with status per step | Done / open / error per step, and which one is current — a list of links or a tablist depending on whether the step is a route. |
| J9 | **Workspace**: three resizable panes | Resizing by keyboard as well as drag; collapsing below `md`; remembering sizes is the app's job. SplitView stays list-beside-detail. |
| J10 | **DocumentPreview** | HTML in a sandboxed iframe, zoom, A4 pages with breaks, print. Page breaks are CSS paged media inside the frame; the component provides the frame and the zoom, the document provides the pages. |
| J11 | **Timeline** | Event, date, person, reason — dates through the formatter, relative where recent. |
| J12 | **Compare** | Two versions side by side, changes marked by more than colour. |
| J13 | Charts: stacked bar, waterfall, highlighted line | Chart's three-colour ceiling stays for categorical series. A highlighted line in front of grey others is ONE colour, which is how eight scenarios become readable — so that is a new chart kind, not a fourth colour. |

## Later — Priority 3

| # | | |
|---|---|---|
| J16 | **SaveStatus** ("gespeichert vor 3 s") | Relative time that updates without re-rendering the page every second. |
| J17 | Comment on an element | Later, by agreement. |
| J18 | Diagram with fixed layout and highlighted path | Likely stays in the app; revisit when Diagram is ported. |

## The rest of the Nuxt catalogue

Avatar, Divider, Icon, Progress, Slider · Breadcrumb, Card, CommandPalette,
Dialog, Drawer, EmptyState, FormSection, Menu, Pagination, Popover, Prose,
SearchField, Tabs, Toaster, ToggleGroup, Tooltip, TopBar · Attachments,
Calendar, Chart, DatePicker, Diagram, Form, Kanban, List, Sidebar, Table,
Toc, TreeView · AppShell, DocLayout, SplitView.

Ported in the order the screens above need them. Each port carries its
doc comment across — the decisions are the part that took the time —
and drops what React or Radix now does for it.

Calendar, DatePicker and the date parser follow the provider's locale
when they are ported (J1); they no longer default to `en-GB` on their
own.
