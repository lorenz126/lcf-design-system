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

## Next — Priority 1 (the first Offerttool screen)

| # | component | the hard part |
|---|---|---|
| J3 | **Field**, **Input**, **NumberField** with unit | The text a person is typing is not a number yet. The field keeps the TEXT while focused and commits a number on blur, so "12," is not rejected mid-keystroke; min/max/step report through Field's error, never by silently clamping. Unit as a suffix that is part of the label for a screen reader (`aria-describedby`), not part of the value. |
| J4 | **Field state and origin** | One `state` (`empty-required` · `suggested` · `confirmed`) and one `origin` slot for a mark, on Field itself so every control gets it. "Suggested" is grey and italic and carries a "back to suggestion" button — which means the field must know the suggested value, not only that there was one. Origin is a mark with a name (Kunde, ergänzt von …, angenommen, fehlt), never colour alone. The price-driver hint is a third slot, not a fourth state. |
| — | Select, Combobox, Checkbox, Radio, Switch, Textarea | Ports. Select and Combobox on Radix's primitives where the Nuxt versions hand-rolled listbox keyboard handling. |

## Then — Priority 1 continued, and media

| # | component | the hard part |
|---|---|---|
| J5 | **DataGrid** (new; Table stays a display table) | Editing per cell with validation per cell and marked changes. A new component, not a Table prop: a grid has a cell cursor and Enter-to-edit, a table has rows you read, and one component with both keyboard models is neither. Columns per market = a column filter on the app's side, not a feature. |
| J6 | Table: **groups and totals** | Chapter rows with subtotals and a footer total. Totals through `useFormat().money`, and `numeric` columns in tabular figures — the place where the CH/AT separator pinning pays. |
| J7 | **AsyncCombobox** (new; Combobox stays local) | Server search: debounce, cancel the stale request, keep the selected item's label when it falls out of the results, announce the result count. Combobox's doc says it is not a remote picker; that stays true. |
| J19 | **MediaPanel** | Thumbnails, one main image (images only, never a PDF), favourites, reorder by drag *and by keyboard*, unlink. Knows no storage: preview URL, original URL, metadata. |
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
