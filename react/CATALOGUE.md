# LCF component catalogue: what joloco needs, in build order

Source of truth: the joloco web app frontend (`joloco-webite/apps/smart-demo-2/frontend/src`, React 19, Tailwind 4, @openai/apps-sdk-ui 0.2.2). It is merged with Jonathan's kustik Offerttool list (2026-10-13) and the 49-component Nuxt catalogue on `main`. Paths without a prefix are relative to joloco's `src/`. `main:` paths are Nuxt files on branch main. `react/` paths are in this repo.

## Summary

- **57 components.** 11 already exist on branch `react` (batch 0). The other 46 are built in 7 batches of at most 8. A batch depends only on earlier batches, so one agent per component can build a batch in parallel.
- **About 415 reader candidates were merged.** The same thing found in several features is one component, with every call site listed. App plumbing, dead code and domain screens are in *Excluded*, each with a reason.
- **joloco decides behaviour and API wherever it has the component.** Nuxt decisions carry over where joloco is silent. LCF vocabulary always applies: `color` (primary … discovery), `variant` (solid|soft|outline|ghost), `size` (sm|md|lg), tokens only, every visible word in the message table, and every component documents what it refuses.
- **Order follows ROADMAP Priority 1.** Combobox, Radio and Switch are in batch 1, so ROADMAP's order is kept, not overridden.
- **Owner** means who builds the component. **requestedBy** records who asked for it. Jonathan's team owns AppShell, TopBar, Sidebar and Card. LCF owns everything else on his list, including EmptyState: its refusal set is a library decision, and Table, List, SearchField and Combobox render it from batch 2 on. His request is still recorded in `requestedBy: jonathan`.
- **Icons:** lucide-react only, with no wrapper component (see the Icons decision).
- **Tailwind:** the LCF preset is the only class vocabulary. joloco migrates through a codemod table, and the preset gains the few mappings it is missing (see the Tailwind decision).

### Batch plan

| batch | theme | components |
|---|---|---|
| 0 | exists (fixes land in batch 1, one extra agent) | LcfProvider, Button, Badge, Alert, Spinner, Field, Input, NumberField, Select, Checkbox, Textarea |
| 1 | controls and primitives | Icon, Radio, Switch, Combobox, DateField, Avatar, Splitter, Count |
| 2 | primitives and surfaces | InlineEdit, ToggleGroup, Disclosure, Progress, Skeleton, EmptyState, DescriptionList, Card |
| 3 | overlays and interaction contracts | Dialog, Sheet, Popover, Menu, Tooltip, Toaster, Reorder, CopyField |
| 4 | composites I | Table, List, SearchField, Timeline, DocumentPreview, Breadcrumb, Toolbar, Tabs |
| 5 | composites II and pickers | Board, FilterBar, AsyncCombobox, Calendar, PropertyList, Attachments, NavTabs, Pagination |
| 6 | pickers and layout | DatePicker, Page, TopBar, Sidebar, Prose |
| 7 | shell | AppShell |

ROADMAP items that are not in this catalogue keep their place in ROADMAP: DataGrid J5, Table groups and totals J6, MediaPanel and MediaUpload J19–J24, Steps J8, Compare J12, Charts J13, SaveStatus J16.

## Component table

| name | status | batch | owner | source | requested by |
|---|---|---|---|---|---|
| LcfProvider | exists | 0 | lcf | react/src/i18n, theme, hooks; sdk AppsSDKUIProvider, useBreakpoint, theme | joloco, sdk-coverage |
| Button | exists | 0 | lcf | react/src/components/Button; sdk Button/ButtonLink (375+22 uses) | joloco, sdk-coverage |
| Badge | exists | 0 | lcf | react/src/components/Badge; tasks/status.tsx, inbox/ui.tsx | joloco, sdk-coverage |
| Alert | exists | 0 | lcf | react/src/components/Alert; 108 uses | joloco, sdk-coverage |
| Spinner | exists | 0 | lcf | react/src/components/Spinner; sdk LoadingIndicator | joloco, sdk-coverage |
| Field | exists | 0 | lcf | react/src/components/Field; ui/Field.tsx | joloco |
| Input | exists | 0 | lcf | react/src/components/Input; sdk Input (38 uses) | joloco, sdk-coverage |
| NumberField | exists | 0 | lcf | react/src/components/NumberField | joloco |
| Select | exists | 0 | lcf | react/src/components/Select; ui/NativeSelect.tsx | joloco, jonathan |
| Checkbox | exists | 0 | lcf | react/src/components/Checkbox; sdk Checkbox (21 uses) | joloco, jonathan, sdk-coverage |
| Textarea | exists | 0 | lcf | react/src/components/Textarea; sdk Textarea | joloco, jonathan, sdk-coverage |
| Icon | new | 1 | lcf | sdk Icon (102 glyphs, 614 refs) | joloco, sdk-coverage |
| Radio | port | 1 | lcf | onboarding/parts.tsx, ProjectLinks.tsx:237, ConnectDialog.tsx:350; main:Radio.vue | joloco, sdk-coverage |
| Switch | port | 1 | lcf | settings rows (5 files); main:Switch.vue | joloco, sdk-coverage |
| Combobox | port | 1 | lcf | ui/ValuePicker.tsx, ui/MultiPicker.tsx, ReferenceSelect, PersonValue, LanePicker, RolesCell; main:Combobox.vue | joloco |
| DateField | new | 1 | lcf | ui/DateField.tsx, project-room/sheets.tsx, tasks/MyTasks.tsx | joloco |
| Avatar | port | 1 | lcf | 8 inline copies + MembersPage + sdk Avatar; main:Avatar.vue | joloco, sdk-coverage |
| Splitter | extract | 1 | lcf | ui/ResizablePanel.tsx, shell/ResizableSidebar.tsx | joloco |
| Count | new | 1 | lcf | ui/CountBadge.tsx | joloco |
| InlineEdit | extract | 2 | lcf | ui/BareInput.tsx, PanelValue, FieldCell, NumberValue, RoleInput, BareText | joloco |
| ToggleGroup | port | 2 | lcf | CollectionPage SegmentedControl, toggle buttons; main:ToggleGroup.vue | joloco, jonathan, sdk-coverage |
| Disclosure | new | 2 | lcf | 8 files with details, MessageHead, show-more toggles | joloco |
| Progress | port | 2 | lcf | PhasePlanPage, ProjectFiles, DraftAttachments; main:Progress.vue | joloco |
| Skeleton | new | 2 | lcf | inbox Feed/Conversation, tasks/MyTasks, agents/AgentsPage | joloco |
| EmptyState | port | 2 | lcf | ui/EmptyBox.tsx (22 files), project-room/parts.tsx Empty; main:EmptyState.vue | joloco, jonathan |
| DescriptionList | new | 2 | lcf | AgentDetail Fact, ProcessDetails, ModelVersionPage, ActivationReview | joloco |
| Card | port | 2 | jonathan | ui/SettingsPage.tsx, project-room/parts.tsx Section, FactPanel, RecordCards; main:Card.vue | joloco, jonathan |
| Dialog | port | 3 | lcf | ui/ConfirmDialog.tsx (24 files), agents/ConnectDialog.tsx; main:Dialog.vue | joloco, jonathan |
| Sheet | extract | 3 | lcf | master-records/RecordPanel.tsx, shell/Sheet.tsx, ui/Dialog.tsx; main:Drawer.vue | joloco |
| Popover | port | 3 | lcf | sdk Popover (5 files); main:Popover.vue | joloco, sdk-coverage |
| Menu | port | 3 | lcf | ui/DropdownItem.tsx, 36 menus; main:Menu.vue | joloco, jonathan, sdk-coverage |
| Tooltip | port | 3 | lcf | ProjectRoom, process-pages, PhasePlan, ui/ButtonLabels.tsx; main:Tooltip.vue | joloco, jonathan, sdk-coverage |
| Toaster | port | 3 | lcf | ui/Toast.tsx; main:Toaster.vue | joloco, jonathan |
| Reorder | new | 3 | lcf | shapes/ShapeDetail.tsx, processes/DraftWorkspace.tsx, RecordCards.tsx, ProjectPageEditor, AreaEditor | joloco |
| CopyField | new | 3 | lcf | agents/ConnectDialog.tsx:265-298, DeliveryNotice, WebhookPanels | joloco, jonathan |
| Table | port | 4 | lcf | ui/DataTable.tsx, ui/table-sort.ts, 6 tables; main:Table.vue | joloco, jonathan |
| List | port | 4 | lcf | ThreadList, Feed, SettingsRow, project-room List/Row, RunList, TaskRow; main:List.vue | joloco |
| SearchField | port | 4 | lcf | shell/GlobalSearch.tsx, ToolbarSearch, PageSearch; main:SearchField.vue | joloco, jonathan |
| Timeline | new | 4 | lcf | history/HistoryList.tsx, approval history, ActivationHistory, ChangesFeed | joloco, jonathan |
| DocumentPreview | new | 4 | lcf | records/file-source.tsx, ProjectFiles FilePreview, AttachmentCard | joloco, jonathan |
| Breadcrumb | port | 4 | lcf | shell/Breadcrumbs.tsx, BackLink; main:Breadcrumb.vue | joloco |
| Toolbar | new | 4 | lcf | shell/ToolbarActions.tsx, EmbeddedActions.tsx | joloco |
| Tabs | port | 4 | lcf | main:Tabs.vue only (joloco has no tablist) | jonathan |
| Board | new | 5 | lcf | list-presentations/RecordCards.tsx, tasks/TaskCards.tsx; main:Kanban.vue | joloco, jonathan |
| FilterBar | new | 5 | lcf | tasks/MyTasks, ProcessCatalog, ProjectsList, CollectionPage, InboxPage | joloco, jonathan |
| AsyncCombobox | new | 5 | lcf | locations/PlaceSearch.tsx, PlaceCell.tsx; ROADMAP J7 | joloco |
| Calendar | port | 5 | lcf | tasks/MyTasks TaskCalendar; main:Calendar.vue | joloco |
| PropertyList | new | 5 | lcf | ui/PanelField.tsx (21 files), FormPanel, ui/ContactLink.tsx | joloco |
| Attachments | port | 5 | lcf | inbox/AttachmentCard, Attachments, DraftAttachments, AttachmentField, ProjectFiles; main:Attachments.vue | joloco |
| NavTabs | new | 5 | lcf | ProjectRoom AreaIconNav, process-pages, InboxPage view links | joloco |
| Pagination | port | 5 | lcf | Announcements pager, ThreadList/Feed/Conversation load-more; main:Pagination.vue | joloco |
| DatePicker | port | 6 | lcf | main:DatePicker.vue; ui/DateField.tsx rejection list | jonathan |
| Page | new | 6 | lcf | ui/SettingsPage.tsx, shell/PageToolbar.tsx, ui/section-heading.ts | joloco |
| TopBar | port | 6 | jonathan | shell/WorkspaceShell.tsx GlobalHeader and mobile TopBar; main:TopBar.vue | joloco, jonathan |
| Sidebar | port | 6 | jonathan | shell/WorkspaceShell.tsx rail and context sidebar, ResizableSidebar; main:Sidebar.vue | joloco, jonathan |
| Prose | port | 6 | lcf | sdk Markdown (2 files); main:Prose.vue | joloco, sdk-coverage |
| AppShell | port | 7 | jonathan | shell/WorkspaceShell.tsx, main.tsx; main:AppShell.vue | joloco, jonathan |

## Cross-cutting decisions

- **Three-way write outcome.** Every write in joloco has three possible outcomes: done, refused (nothing written) or unconfirmed (unknown). The message table gets this vocabulary once ('Ob … gespeichert wurde, ist unklar'). Alert, Toaster, Board.onMove, InlineEdit and CopyField all use it. A component never says 'not saved' when the outcome is unknown, and never retries on its own.
- **Never colour alone.** Status is a word plus a dot, an icon or a weight. The colour goes on the graphic, and the text stays in the base colour.
- **State held by the app, often in the URL.** Every component with selection, sort, filter, open panel or month takes `value` and `onChange`. LCF stays router-agnostic and documents a react-router adapter (replace:true, defaults left out of the URL, the field leads and the URL follows).
- **Escape yields.** Dialog and Sheet leave alone an Escape already spent by NumberField (`[data-dirty]`), Field ↺ (`[data-action=revert]`), InlineEdit, Combobox or a Menu. Sheet also yields while a modal dialog is open.
- **Breakpoints.** LCF md and lg sit at 860 and 1100, where the SDK had 768 and 1024. joloco moves its JS switches, Tailwind prefixes and the 767/1023 media queries in index.css in one commit.

## Batch 0: exists, with required changes

### LcfProvider (exists)
Fixes, landing in batch 1:
- (a) **useFormat additions.** `dateCompact` (time today, else day and month, with the year only if it is not this year), `dayLabel` (Heute, Gestern, weekday), `relative`, `bytes`, `list`, a collator for sort and search folding, and plural messages. `list` uses Intl.ListFormat with the locale's quotes and replaces joinTitles.
- (b) **linkComponent props.** `linkComponent` receives every extra prop (`{href, className, children, ...rest}`), so a react-router adapter can pass `to` and `state`. The docs ship that adapter.
- (c) **Breakpoints.** A migration note (see Cross-cutting decisions).

Theme maps 1:1 to the SDK's (applyDocumentTheme, useDocumentTheme), plus 'system' and themeScript. themeScript replaces joloco's hand-written index.html script. A ThemeToggle stays in the app.

Refuses: knowing about a router.

### Button (exists)
Blocker fix: the `href` branch forwards `...rest` (aria-label, title, onClick, data-*). An icon-only link loses its name today. `uniform` works on links, which removes the 'aspect-square p-0' hack.

New `disabledReason`: rendered as aria-describedby text, replacing joloco's title-only reasons ('Nichts geändert', 'Zuerst speichern').

Decisions, to be confirmed with the owner:
- joloco's pills (SDK pill default, darkPill, outlinePill) become LCF's rounded rectangle. That is a visible change.
- SDK sm (28px, 200 uses) has no LCF height. It maps to md (26). The 40px touch target comes from a `pointer: coarse` minimum hit area, not from an xl size.
- `selected` alone renders aria-pressed. Drop the hand-written aria-pressed.

Refuses: capsules, pointer-events-none on disabled, colour as the only meaning.

### Badge (exists)
Fix: a `dotColor` independent of `color`. The joloco status recipe is a neutral secondary badge with an intent dot and the word (StatusBadge, StateBadge, ConnectionState, RunStatusBadge). That cannot be expressed today, because `dot` is currentColor.

Keeps refusing counts (see Count) and clickability.

### Alert (exists)
Fixes:
- The action row wraps at 390px. joloco had to wrap actions itself in compose-parts.tsx.
- Ship the three-way outcome messages.

Refuses variant `solid` (joloco's 4 danger/solid uses become danger/soft). Refuses auto-dismissal (that is Toaster).

Convention to document: a load error is a neutral (primary or secondary) outline Alert with one named retry, never a red block.

### Spinner (exists)
Maps 1:1 to LoadingIndicator, decorative beside words. Document the loading-row recipe: role=status, Spinner and 'X wird geladen …'.

### Field (exists)
Replaces ui/Field.tsx and wires aria-describedby and aria-invalid itself, which joloco left to callers. Carry over one decision to compare: joloco puts the danger colour on the icon and keeps the error text in the base colour (AA in dark).

The side-panel label|value grid is not Field; it goes to PropertyList.

### Input (exists)
- type search moves to SearchField, type date to DateField, type number to NumberField.
- joloco's 11 maxLength uses on names get Textarea's count model: it reports and never blocks. A paste is never truncated silently.

Refuses: pill shape, silent truncation.

### NumberField (exists)
Covers NumberValue and toCents: the reader's separators, so 1'250.50 parses in de-CH. In cells it is used through InlineEdit.

### Select (exists)
Replaces NativeSelect (8 files) 1:1, and joloco's reasons for rejecting the SDK Select are met. PanelSelect (borderless) is Select inside PropertyList through the `--fld-*` contract. Lists that need search, icons or a second line go to Combobox.

### Checkbox (exists)
Fixes for its 21 uses:
- a bare mode with aria-label for table cells;
- a description under the label for gate checkboxes ('Ich bestätige …');
- `appearance=card`, matching Radio, for the ConnectDialog and ConsentPage rights cards.

The table's 'details open' checkbox is Table's leading-column concern.

### Textarea (exists)
`autoResize` and `maxRows` map to `rows`/`maxRows`. Borderless body text (ComposeCard BodyField) goes through InlineEdit. JSON editing is not a mode.

## Batch 1

### Icon (new)
See the Icons decision. It is `@lcf/design/icons`: a type `IconComponent` (any lucide icon, `ComponentType<LucideProps>`), semantic aliases for joloco's domain words, and Tailwind utilities `icon-sm` / `icon-md` / `icon-lg` (14/16/20) with stroke `--icon-stroke`.

There is no rendering wrapper, and LCF components import lucide directly. Decorative by default (aria-hidden). An informative icon needs a label.

### Radio (port)
RadioGroup sits in a Field the way CheckboxGroup does (a fieldset named by the label), with ONE Tab stop and arrow keys. That fixes LinkPicker and ClientPicker, where every pill was a Tab stop.

Appearances:
- `default`: a visible dot, surviving the CSS reset.
- `card`: label, hint and an icon or logo, with the native radio stretched over the card (onboarding ChoiceCards, ShapeCreate, ClientPicker).
- `pill`: the LinkPicker form chooser.

`direction` is col or row; values are typed.

Single-choice values that are form data belong here, not in ToggleGroup.

Refuses: a role=radio button without arrow keys.

### Switch (port)
- Applies at once, with no confirm.
- A lone Switch is not in a Field; its label sits beside it.
- `labelPosition=start` gives the justify-between settings row joloco hand-builds.
- disabled comes with a reason.

Refuses:
- acting as a link. IntegrationsPage's switch opens settings; that becomes a Button.
- a state-dependent name. The checked state is announced already.

### Combobox (port)
One listbox picker that takes what Select refuses. It replaces ValuePicker (19 files), MultiPicker, ReferenceSelect, PersonValue, LanePicker, RolesCell, ProjectLabelButton and the icon picker. It is built on Radix, sits in Field through useField(), and its own Enter-to-confirm and validity hook come with it.

Behaviour kept from joloco:
- options `{value, label, icon?, description?, muted?}`;
- search appears from 8 options, as a folded case-insensitive substring for the locale;
- the query clears on close;
- 'Nichts gefunden';
- picking the current value is a no-op;
- an explicit clear option ('—');
- a value missing from the options is shown as 'Nicht mehr vorhanden' or 'Ehemalig', never as empty;
- `appearance=bare`: the cell look, no frame until hover or focus, with a visible focus ring (joloco had none);
- `iconOnly` trigger.

Multiple mode:
- removable chips followed by an add trigger;
- removing a chip moves focus to the next chip or to the input;
- order of insertion.

Creatable: `onCreate`, with a 'Neue … …' row, mapping a differently spelled duplicate to the existing value. The created value is entered in place, with no setTimeout focus trick.

Semantics: role=listbox and option with aria-selected, not menu items with an sr-only 'Ausgewählt'. Typing in the search input never triggers menu typeahead.

Refuses:
- server search (AsyncCombobox);
- actions (Menu);
- free tags (TagInput, J21).

### DateField (new)
joloco's real date control: a native `type=date` in the field frame, with a value in ISO yyyy-mm-dd or ''. The browser gives format, week start and calendar in the user's language. Phones get their picker.

The clear button is its own named Button BESIDE the field, never inside it, only when there is a value and the field is enabled. Its label comes from the message table.

It is in Field like Input, so describedBy is wired.

Refuses: a calendar popover (DatePicker, batch 6), a non-ISO value, a clear button nested in the trigger.

### Avatar (port)
Replaces eight inline initials copies: inbox ThreadList, ComposeCard, MessageCard, Feed/feed-model, ConversationNotes, Conversation MessageHead, history/HistoryList ActorMark, and processes/phase-plan/PhasePlan OwnerMark. It also replaces the members/MembersPage and project-room/ProjectMembers copies and the SDK Avatar in MailboxControl, WorkspaceShell and RecordCards.

- `name` gives initials: split on whitespace, @, '.', '_' and '-'; two letters; locale upper-case; '?' as fallback.
- `src` for an image; `icon` for 'me', outgoing or system.
- Sizes sm/md/lg (20 / 28 / 36). joloco's 24 maps to sm.
- Colour is neutral by default. `colorKey` gives a stable intent from a key, for mailbox stacks.
- Decorative (aria-hidden) unless `label` is given.
- AvatarGroup has a max, an overflow '+N' with the full count in its name, and a surface ring cut-out.

Refuses: photos fetched by the component, any palette other than intents.

### Splitter (extract)
A resize handle for Sheet, Sidebar and Workspace (J9). It is controlled: `value`, `onChange`, `min`, `max`, `defaultValue` for double-click reset, `unit` px|rem, `step` and `shiftStep`, and `grow` (which arrow grows the pane, because a right-anchored pane grows with ArrowLeft).

- role=separator with aria-orientation, aria-valuemin/max/now and aria-valuetext from messages, and aria-controls.
- Home and End go to min and max.
- The pointer drag takes the primary button with pointer capture. rem drags scale with the root font size.
- `data-dragging` on the document turns transitions off.
- A visible focus ring. joloco only filled the background; check 2.4.7 and 1.4.11.

Refuses: remembering sizes (localStorage stays the app's job), hiding the affordance from keyboard users.

### Count (new)
A number of unseen items on an icon (`corner`) or at the end of a row.

- Renders nothing at 0.
- '99+' above 99.
- aria-hidden. The count reaches screen readers as the host's aria-description ('n neu', from messages), so the name stays unchanged. The host gets the description through `useCountDescription(n)`.
- Ground chosen for at least 4.5:1 at its size. LCF's floor is 11px, so the 10px text grows.

Refuses: being clickable, zero badges, status words (Badge).

## Batch 2

### InlineEdit (extract)
'Text that looks like text and saves when you leave it.' One contract for BareInput and BareTextarea (19 files), PanelValue, FieldCell, NumberValue, RoleInput, BareText, InlineField and BodyField, and the PlaceCell display.

Contract:
- local draft re-synced from `value`;
- `onCommit(value): Promise` on blur and Enter, only if changed;
- a rejection resets the draft, unless `preserveOnError`;
- Escape reverts, blurs, stopPropagations and marks itself for the Escape-yield rule;
- `onEnter` preventDefaults, so the keypress cannot hit a button in a dialog that onEnter opens;
- `live` commits per keystroke, for drafts;
- `flush` aligns to the column edge;
- textarea autosizes up to a cap;
- `kind` text|textarea|number|date|select, reusing Input, Textarea, NumberField and Select inside;
- required `label`, as aria-label;
- a visible focus ring;
- error display slot.

Refuses: being a Field (no visible label or description; use Field), owning autosave timers (the app's 600ms debounce stays outside).

### ToggleGroup (port)
View state and modes, not form values.

- `type=single`: role=group of aria-pressed Buttons. Covers the Tabelle/Karte switch, layout switchers when there are 2–3 layouts, LaneSwitch-style column choice and the archive view toggle.
- `type=multiple`: independent aria-pressed toggles (pin, match filter).
- Variants segmented|toolbar.
- iconOnly with labels from messages.

Design rule kept from shell/LaneSwitch.tsx, which is dead code but has the right reasoning: the group WRAPS at 200% text on 390px and never becomes a horizontal scroller.

Single-choice FORM values go to Radio (pill or card). Choosing a pattern per meaning keeps the ARIA honest.

Refuses: horizontal scroll, panels (Tabs), navigation (NavTabs).

### Disclosure (new)
Built on the native details/summary, which joloco uses in 8 files: ui/PanelField.tsx, announcements/Announcements.tsx, project-room/NotesEditor.tsx, project-room/InformationArea.tsx, business-areas/AreaEditor.tsx, model-versions/ModelComparison.tsx, model-versions/ModelSnapshotContent.tsx and skills/SkillList.tsx.

- An always-visible chevron that rotates. SkillList hid it, so nothing showed the row could expand.
- `open` controlled or uncontrolled.
- A header with actions follows MessageHead's rule: when the header holds controls, the row is not a button. A separate chevron button carries aria-expanded and an aria-label from messages. Never a button inside a button.
- `Disclosure.Toggle` for show-more ('Alle n zeigen' / 'Weniger zeigen', aria-expanded), used in OverviewArea, HistoryList and AgentDetail AssignedTasks.

Refuses: accordion exclusivity (one-open-at-a-time is app state).

### Progress (port)
A determinate bar: role=progressbar, value and max, a required label, and an optional 'n von m' text from format. Color is an intent, and the phase colour comes from the app.

A segmented variant shows step counts (SetupFlow's 3 segments) and is aria-hidden when a live text carries the step. Upload progress (sent of total) uses the same bar, fixing DraftAttachments, which had no progressbar role.

Kept from joloco (processes/model.ts): no invented totals. If the total is unknown, use Spinner, never a percentage.

Refuses: indeterminate bars (Spinner), colour as the only value.

### Skeleton (new)
Placeholder shapes for a loading region. The container is role=status, aria-busy and a label from messages ('… wird geladen'). The bars are aria-hidden. The pulse stops under prefers-reduced-motion; joloco had no guard.

Presets: `rows` and `block`.

Refuses: standing in for an error or empty state.

### EmptyState (port)
joloco's rule wins over Nuxt's. One short grey sentence, centred in a rounded frame, role=status.

- Optional quiet follow-up actions are underline-on-hover links or buttons through linkComponent ('Suche und Filter zurücksetzen').
- Variants `block` (EmptyBox) and `inline` (dashed, left-aligned section note: project-room/parts.tsx Empty).
- The empty text must say WHY: never had items, filtered out, or wrong view. Docs show the three sentences.

Used by Table, List, SearchField, Board and Combobox, so it is built in batch 2.

Refuses an icon, a title and a primary button. Creating belongs in the page toolbar. ProjectStart's one primary action is an app composition of Card and Button.

### DescriptionList (new)
A semantic dl of label and value pairs (AgentDetail Fact, ProcessDetails, ModelVersionPage, information-model FormSummary, AddrList recipients).

- The label column is max-content from sm and stacks below.
- dd breaks words, and `preserveLines` keeps line breaks.
- An empty value is spoken ('—' or a given word from messages), never blank.
- `variant=stats` gives a 2-column grid of label and large number (ActivationReview).

Refuses: editing (PropertyList), tables of records (Table).

### Card (port, owner jonathan)
A surface with an optional header (title at the heading level from context, count, hint, action), body and footer.

- `variant=list` is SettingsCard: a bordered rounded list with rows divided by rules, filled edge-to-edge when selected.
- `interactive`: a stretched link or button with inner controls lifted above it (relative z), a selected state and a hover shadow from `--shadow-*`, replacing raw rgb shadows.
- `HeadingLevel` context replaces section-heading.ts, so a card in a panel says h3.

Sources include project-room/parts.tsx Section, ProjectRoom FactPanel, ProjectStart, QuickActionCards and the RecordCards card anatomy. shell/Lanes.tsx CardShell is dead code and is not evidence.

Refuses: a nested interactive inside a whole-card link, raw shadows, a fixed h2.

## Batch 3

### Dialog (port)
Modal only. joloco keeps modality in code for ConfirmDialog (24 files) and ConnectDialog. processes/StartSheet.tsx still says 'native dialog with showModal' in its doc comment, but it renders RecordPanel, so it is a Sheet. ui/Dialog.tsx and shell/Sheet.tsx were formerly modal and are now non-modal: Sheet.

Built on Radix with the Escape-yield rule:
- `open`, `onOpenChange`, title (aria-labelledby) and body (aria-describedby);
- initial focus ALWAYS on Cancel;
- Escape and a backdrop click cancel;
- `tone` confirm (Cancel outline + Confirm success solid) | lossy (Confirm secondary outline + Cancel primary solid: the safe choice is the loud one);
- buttons stack reversed on mobile;
- `dismissible={false}` for SecretReveal steps: Escape shows a hint and moves focus to the Done button;
- steps, through children.

The leave-guard copy ('Ungespeicherte Änderungen verwerfen?' / 'Verwerfen und verlassen' / 'Weiter bearbeiten') ships as messages.

Refuses a danger tone: red outline text is 2.9:1 in dark mode.

### Sheet (extract)
The one non-modal, right-anchored side panel: RecordPanel (33 importers), shell/Sheet, ui/Dialog, StartSheet. It has no backdrop.

- An `<aside>` named by `label`.
- A close X named from messages ('{label} schließen').
- Focus goes to the close button on mount (or `focusClose=false` lets content focus). On unmount focus returns only if it was lost to body.
- Escape closes unless the event was spent or a modal dialog is open.
- `header`, and a fixed `footer` slot that content fills through `Sheet.Footer` (portal); the footer hides when empty.
- `front` stacks above another sheet.
- Resizable through Splitter with `width` and `onWidthChange` (the app persists it).
- Publishes `--lcf-sheet-width` and `data-sheet-dragging` so Page pushes content aside.
- Slides in over --dur-slow with --ease-out, and not at all under reduced motion.
- Full width below lg.

Refuses: a backdrop or modality (Dialog), an agent prop (that is the app's footer content), remembering widths.

### Popover (port)
A floating, non-menu panel: the new-area form, the legend, members, the Info explainer, demo tools.

- `open` and `onOpenChange` controlled (a form submit closes it).
- `align` start|end, `side`, `offset`, `width`, `padding` none|md, a scrollable body up to 70vh.
- Autofocus into the content.
- z from --z-dropdown, replacing joloco's global z-index fix.

Refuses: hover-only opening, menus (Menu).

### Menu (port)
Compound API, because joloco puts avatars, a search input, section labels, notes and groups inside menus. Parts: Menu, Trigger, Content (align, side, width, minWidth, maxHeight), Item (icon, description, disabled, danger), CheckboxItem, RadioGroup/RadioItem (aria-checked replaces the CheckCircle plus sr-only 'Ausgewählt' convention of DropdownItem, 71 uses), Label, Separator, Sub/SubTrigger/SubContent (ConversationMenu 'Gehört zu'), and LinkItem through linkComponent.

- `onSelect` with preventDefault keeps the menu open (multi-toggle).
- A disabled trigger.
- A search input inside the content keeps its keys away from typeahead.
- Labels ending in ' …' open a further step (document it).

Acceptance test: MailboxControl and the account menu with tenant switch.

Refuses: value selection as a form control (Combobox), items as data only.

### Tooltip (port)
A short label on hover AND keyboard focus, after 150ms. side top|right|bottom|left. compact (single line). It works on non-button triggers that are focusable.

Decision: a `uniform` Button shows its aria-label as a Tooltip by default (opt-out). This replaces ui/ButtonLabels.tsx, which set title on every button through a DOM mutation, and the native title tooltips (82 titles). Because the content equals the accessible name, no aria-describedby is added, so there is no double announcement.

Never on touch.

Refuses: interactive content (Popover), disabled-reason text (Button.disabledReason).

### Toaster (port)
`toast(text, {tone: 'done'|'info'})` can be called from anywhere. `<Toaster/>` is mounted once beside the router.

- role=status, polite.
- At most 3.
- A close X labelled from messages.
- Pauses on hover and focus.
- Lifetime at least 5s and growing with text length (WCAG 2.2.1); joloco used a fixed 4s.
- Positioned above the mobile tab bar through `--lcf-bottom-inset`.
- Icons: done CircleCheck (success colour on the icon), info Info.

joloco's alternative, inline status or flash Alerts with an explicit 'Ausblenden', stays the recommendation for anything that needs reading.

Refuses errors (they stay where they arise, as inline hints). Refuses action buttons.

### Reorder (new)
One contract for every reorder, because joloco reorders in three ways:
- ShapeDetail: drag by an armed handle, ArrowUp and ArrowDown, then save;
- DraftWorkspace PhaseEditor, ProjectPageEditor and AreaEditor: move buttons or menu items;
- RecordCards: drag between columns, plus a Menu 'Verschieben nach'.

`useReorder({items, getKey, groups?, onMove(key, {index, group}) => Promise})` returns:
- handle props: pointer drag only while the handle is pressed, arrows move by one on the focused handle, Escape cancels;
- drop indicator data attributes;
- `moveUp`/`moveDown`/`moveTo` helpers for the REQUIRED non-drag path (buttons disabled at the ends, or a Menu);
- a lock while a move is saving, with aria-busy;
- a live announcement ('„X“ nach „Y“ verschoben.' / 'Verschieben wird gespeichert …' / the unconfirmed message);
- revert on failure.

All modes call one placeAt (Nuxt Kanban's decision).

Refuses: drag as the only way, moving between groups by keyboard arrows alone without saying where.

### CopyField (new)
A read-only value with a label and a copy button. It is in Field: a single line (Input readOnly, select-all on focus) or `block` (Textarea, rows = min(14, number of lines)). `mono`, `hint`, `inputRef`.

- Copy says 'Kopiert' only when the clipboard promise resolves.
- On failure it says how to copy by hand.
- It resets after 2.5s.
- An always-mounted role=status line shares the hint line, and the control is aria-describedby that line (joloco missed the link).
- The button text is hidden below sm, with the name kept.

Recipe 'show once' (SecretReveal: MCP token, webhook secret):
- CopyField focused and selected on mount;
- a caution Alert ('wird nur jetzt angezeigt');
- an explicit acknowledgement button;
- Dialog dismissible=false, plus the app's leave guard.
Both joloco variants are brought to that rule.

Also replaces the copy buttons in DeliveryNotice and AgentHandoff.

Refuses: a 'copied' state without confirmation, editing.

## Batch 4

### Table (port)
A display table, with editing through InlineEdit cells. DataGrid is J5.

API: `label`, `rows`, `rowKey`, `columns {key, label, icon?, numeric?, cell, value?, sortValue?, headerExtra?}`, `leading {label, cell}` (a narrow selection column), `selected`, `columnMenu` (a Menu slot), `onAddRow`, `count`, `status`, `summary`, `leadingRows` (suggestions above real rows), `busy` (keep previous rows visible while reloading).

Sorting:
- controlled `sort` and `onSortChange`, or uncontrolled;
- an optional URL adapter;
- a header button cycles ascending, descending, then back to the page's order;
- aria-sort;
- empties always last, stable;
- Intl.Collator from the provider locale, numeric, base sensitivity ('NORD-10' after 'NORD-9');
- booleans true first;
- `sortValue` sorts by rank.
joloco's table-sort.test.ts is the acceptance spec, and its de-CH locale is no longer hard-coded.

Summary footer:
- per column 'Summe n' (all numbers, via format) or 'Befüllt n';
- pinned to the viewport bottom with measured widths and mirrored scroll, because the page scrolls, not the table; joloco's reason holds;
- `summary=false` for several tables on one page.

Clickable rows are a pointer convenience only. The keyboard path is a real link or button in a cell; onRowClick ignores clicks on interactive targets.

Words come from messages ('Summe', 'Befüllt', 'Spalten', 'Zeile hinzufügen', 'Nach … sortieren').

Refuses: cell cursor and Enter-to-edit (DataGrid), groups and totals (J6), being sorted by a hard-coded locale.

### List (port)
The row list.

Navigation mode: links with aria-current. Used by ThreadList, DraftList, Feed rows, MyWork, TaskRow and RunList.

Row anatomy:
- leading Avatar, icon or tile;
- title with trailing meta (time, count);
- subtitle, a 1–2 line clamped preview, and a meta line joined through `format.list`;
- a trailing control outside the hit area (Switch, Menu, Count).

Options:
- `variant` plain | bordered | card (SettingsCard);
- groups with sticky headings (day groups via format.dayLabel);
- `muted` and `selected` (opened in a Sheet: aria-current on the link, not on the li);
- hover-revealed actions that stay in the Tab order, show on focus-within and are ALWAYS visible on a coarse pointer;
- an optional roving arrow-key mode (Feed);
- load-more through Pagination's loadMore mode;
- reorder through Reorder;
- loading (Skeleton), error (Alert) and empty (EmptyState) slots.

Refuses: multi-select checkboxes as navigation, nested links.

### SearchField (port)
The search pill. It specifies the async results contract ONCE, so AsyncCombobox reuses it.

Field: `type=search` with a leading glyph and a clear button named 'Suche leeren' (from messages) when non-empty. The glyph is at the start, as in joloco; the Nuxt end-glyph is dropped. `value` is controlled, so the app holds it, often in ?q=.

Results (optional): `useAsyncSearch(query, fetcher, {debounce: 200, minLength, signal})`.
- The stale request is aborted, and results are tied to the query they answer.
- status idle | loading | error | empty | ready.
- Loading and empty are announced through role=status ('Suche läuft …' / 'Keine Treffer'), error through role=alert.
- A results popover (Popover) of links, ArrowUp and ArrowDown cycling input → results, Escape closes, pointerdown outside closes.
- `shortcut` opt-in for Cmd/Ctrl+K, mounted once by the shell.
- A source caption and attribution slot (OpenStreetMap).

The page-filter mode is controlled (PageSearch, ToolbarSearch): the shell's single field drives the page's list.

Refuses: ranking results, picking a value (AsyncCombobox), combobox roles on a link list.

### Timeline (new, J11)
A vertical event list: event, date, person, reason. Avatar or system mark per actor kind (person, agent with client logo, system). The verb comes from a verb table the app can override. Dates via format, relative when recent.

- First 5, with Disclosure.Toggle for the rest.
- The previous list stays visible while reloading the same key; nothing from another record shows.
- Unknown actors are never invented ('Jemand' / 'Ein Agent').
- An optional link and note per event.

Sources: HistoryList, model-version Freigabeverlauf, ActivationHistory, ChangesFeed. MilestoneCard's prerequisite list is a `variant=checklist` (done mark plus state word).

Refuses: percentages, diffs (Compare, J12).

### DocumentPreview (new, J10 + joloco)
Viewer mode (J10): HTML in a sandboxed iframe, zoom, A4 pages with breaks (paged media inside the frame), print.

Thumbnail mode (joloco FilePreview, file-source Preview, AttachmentCard):
- image, the first PDF page via an iframe without toolbar, or the first N characters of text;
- a size limit (default 2–5 MB, a prop);
- loaded only when scrolled into view;
- object URLs revoked;
- aria-hidden and pointer-events none inside a card.

States: loading, 'Keine Vorschau. Herunterladen geht weiterhin.', and too large. Download always stays possible.

Refuses: bundling pdf.js (a separate dependency decision), editing.

### Breadcrumb (port)
nav and ol. The last crumb is aria-current text and is the one that shrinks; earlier crumbs are links through linkComponent; '/' separators are aria-hidden.

Overflow follows joloco over Nuxt: the trail scrolls horizontally and the last crumb truncates with a title.

`BackLink` variant: one 'back' link whose label the app gives (useReturnLabel), with ArrowLeft.

Refuses: building crumbs from routes. Label maps are the app's.

### Toolbar (new)
Action groups with fixed roles, in fixed order: view, secondary, primary, more (ToolbarGroup/OrderedActions with its test). DOM order equals visual and keyboard order. It wraps.

- `Toolbar.Divider` (vertical rule, aria-hidden), replacing 5 inline copies.
- `floating` variant for canvases (DraftWorkspace).

The 'page provides, shell places' portal (EmbeddedActions) belongs to AppShell slots.

Refuses: overflow measuring.

### Tabs (port)
ARIA tabs with panels: activation automatic|manual, `badge` count per tab (Count), variant underline|pill.

joloco has no role=tablist anywhere, and ui/SettingsPage.tsx SettingsTabs is never imported, so Tabs rests on Jonathan's request and the Nuxt version only. Route navigation is NavTabs.

Refuses: links as tabs.

## Batch 5

### Board (new)
joloco is the source of truth, and its board moves cards (list-presentations/RecordCards.tsx, TaskCards, ProcessCatalog folders, ProjectsList). Board is read-only unless `onMove` is given, which is Jonathan's case.

Columns come from a group field's options in fixed order. Removed values remain as columns, and 'Ohne Zuordnung' (allowEmptyGroup) is last.

Column header:
- an h2 that can take focus (focus-and-scroll jump to a column);
- a count;
- section aria-label '{label}: n Datensätze';
- Jonathan's column summary via `summary(column)`, formatted by useFormat (sums, money).

Cards are Card. Optional `path(card)` is Jonathan's 'time path': a compact Timeline or segmented Progress of the columns the card passed, with dates. The meaning is to be confirmed with Jonathan.

Moving:
- through Reorder: drag between columns, and a Menu 'Verschieben nach' with radio items as the keyboard and touch path;
- refused while busy, for the same value or for an unknown column;
- aria-busy;
- announced;
- the unconfirmed message on failure.

Leading rows (suggestions) are a separate column and cannot be moved.

Refuses: WIP limits, swimlanes, moving without a non-drag way.

### FilterBar (new)
Jonathan's fields plus reset, with state held by the app (in the URL).

`fields` = Combobox, Select, DateField or ToggleGroup controls, plus one SearchField. `values`, `onChange`, `onReset` ('Suche und Filter zurücksetzen').

- Fields wrap; on mobile, secondary fields go behind a 'Filter' Popover.
- An sr-only live count ('x von y …').
- An active-filter indication on the trigger (selected).

The documented URL adapter:
- replace:true;
- defaults left out of the URL;
- the field leads and the URL follows (binding the input straight to ?q dropped characters);
- re-sync only on back/forward;
- location.state kept.

Refuses: holding state itself, saved views (the app's).

### AsyncCombobox (new, J7)
Combobox fed by `useAsyncSearch` from SearchField: min 3 characters, debounce, abort, a result count announced, and the selected item's label kept when it falls out of the results. A real listbox with active-descendant and arrows; PlaceHits had roles without keys.

- Collision-aware positioning, escaping table overflow clipping (PlaceCell measured it by hand).
- Free text allowed when `allowFreeText`.
- Attribution slot.

Refuses: local filtering (Combobox).

### Calendar (port)
A month grid with role=grid and arrow keys between days. Weekday names and first day come from the locale; joloco hard-coded Mo–So and the SDK started on Sunday. Previous, next and today buttons are named. The month is controlled (the app holds ?monat=).

- `renderDay(date)` slots for item chips (TaskCalendar).
- Days outside the month padded to whole weeks.

Refuses: English weekdays, unnamed arrows.

### PropertyList (new)
The side-panel inspector grid: icon | label | value (PanelField, 21 files; FormPanel; MemberPanel; webhook and skill panels).

- `PropertyList.Group` is collapsible through Disclosure, or static with an `action`.
- `PropertyList.Row {label, icon, wide, error, note, action}`. The label is a real label tied to the control through useField; joloco only had aria-labels.
- Values are InlineEdit, Combobox bare, Select bare, Checkbox or read-only text ('—').
- The `action` slot is where ContactLink lives: a uniform Button href (mailto, tel, external) named '{label}: E-Mail schreiben / anrufen / öffnen', shown only when the value has the right shape. The validators are the app's.
- Error at the row (danger on the icon); note in tertiary ('Pflichtfeld — noch leer').
- In a narrow sheet it collapses to 14px | 1fr.
- Touch rows are at least 40px high below lg.

Refuses: bordered fields, schema knowledge.

### Attachments (port)
Files of a record.

Layouts:
- `rows`: name · size · download, with three states: not determined, lookup failed, too big;
- `cards`: an auto-fill grid of FileCard (FileIcon with the extension label on an AA-checked ground, a DocumentPreview thumbnail, a meta footer, hover-revealed download and remove, an inline confirm for remove).

Adding:
- a hidden file input with a label, single or `multiple`;
- client limits per file and in total, each with its own message;
- an upload tile with Progress (sent of total);
- errors role=alert;
- downloads named from content-disposition by the app.

Refuses: storage, drag-and-drop as the only way, category and licence forms (MediaUpload, J20).

### NavTabs (new)
Route navigation styled as tabs: links with aria-current=page, `count`, `iconOnly` (with Tooltip and the label as name).

- The strip wraps, or scrolls with hidden scrollbars only in the icon-only top bar variant.
- Replaces ProjectRoom AreaIconNav, ProcessPagesNav, InboxPage ViewFilterLinks and the AreaPage mobile pills.
- The count goes into the description via Count, not the name.

Dead SettingsTabs is not counted.

Refuses: panels or roving focus (Tabs).

### Pagination (port)
Modes:
- `pages`: Nuxt's numbered window.
- `simple`: previous, 'Seite N', next, as links through linkComponent when routable; joloco's Announcements pager.
- `loadMore`: a button with loading. On failure the loaded rows stay, with 'Die geladenen bleiben.' An optional announcement says how many were added. Hidden while a client-side filter is active.

Refuses: infinite scroll.

## Batch 6

### DatePicker (port, Jonathan)
A DateField with a Calendar in a Popover, for Jonathan. joloco itself uses DateField.

Acceptance list from joloco's rejection of the SDK DatePicker:
- weekdays and week start from the locale;
- named month arrows;
- clear OUTSIDE the trigger;
- label kept when a value is set;
- value in ISO;
- min and max.

Refuses: a clear button inside the trigger, a calendar as the only way to enter a date.

### Page (new)
The content frame: SettingsPage, PageToolbar, ProcessesPage, the ProjectRoom container.

- An sr-only h1 (the visible title is the last crumb).
- Breadcrumb items and Toolbar actions are registered into the AppShell slots when present, and render inline otherwise (LocalPageSurface).
- `width` reading (52rem) | wide (72rem) | full.
- The `HeadingLevel` provider.
- Pushes content aside by `--lcf-sheet-width` with a transition off while dragging.
- The list-plus-detail split: the list stays mounted, a Sheet opens beside it, and below lg one or the other shows. URL-addressable selection is the app's.

Refuses: route logic, uniform top spacing chosen by pages (the shell owns it).

### TopBar (port, owner jonathan)
Desktop: a sticky header (2.75rem) with an icon cluster (back, forward, sidebar toggle with aria-expanded and aria-controls, as surface-less ghost uniform Buttons with Tooltips) and a 3-column grid (crumbs | SearchField centred in minmax(12rem, 24rem) | actions slot). Icon actions in the slot are normalised to one size.

Mobile: brand, area menu, account Menu (Avatar trigger, tenant RadioItems, settings group, theme item, sign-out).

The history enable state is computed by the app. A shell-level destructive change (tenant switch) travels as a navigation, so leave guards apply (a documented rule).

Refuses: owning search requests, sign-out logic.

### Sidebar (port, owner jonathan)
Two levels:
- An optional icon rail (w-14): main areas as icon links with Tooltip, Count in the corner, aria-current, and a settings toggle button with aria-pressed; account and theme at the bottom.
- A resizable context column (Splitter, 12–24rem, width from the app): a title saying where you are, then `Sidebar.Section` (caption or collapsible Disclosure heading with action buttons, an item limit with 'show all', loading, error with retry, and empty states) and `Sidebar.Item` (icon, truncated label, Count, aria-current; the active item gets a fill, the rest recede), plus a footer slot.

Row menus revealed on hover or focus-within are allowed through List's rule.

Refuses: more than section > item > item depth, data loading.

### Prose (port)
Styling for rendered Markdown and HTML: measure tight|default|wide|full, size sm|md, break-words. The parser is the app's choice. The recommended react-markdown setup is skipHtml and no images, as joloco does.

Refuses: bundling a Markdown parser or KaTeX.

## Batch 7

### AppShell (port, owner jonathan)
The frame (WorkspaceShell).

- A skip link first ('Zum Inhalt springen' from messages) to main id=main tabIndex=-1.
- ONE frame per breakpoint, rendered structurally (never both hidden by CSS).
- Desktop: TopBar, Sidebar and main with layered edge shadows instead of lines (`--shadow-2`). The PAGE scrolls; the chrome is sticky.
- Mobile: TopBar, a crumbs and search row, and a fixed bottom tab bar (NavItem `short` must be a substring of `label`, per 2.5.3) that hides when the page owns the bottom (`pageOwnsBottom`), so two fixed bars never stack.
- `--lcf-bottom-inset` for Toaster and Table summary.
- Named slots pages fill by portal: crumbs, actions (role-ordered), sidebarHeader (AreaEditorFrame), search adapter (PageSearch).
- Toaster mounted beside it.
- J9 Workspace panes reuse Splitter.

Refuses: data providers (unseen counts, business areas), routing.

## Excluded

See the `excluded` list: app infrastructure, dead code, domain screens, and the patterns folded into components above, each with its reason.

## Critic findings resolved

1. **DateField** added to batch 1.
2. **Reorder** is a batch-3 contract used by List, Board and PropertyList. It covers drag, keyboard and announcement.
3. **ContactLink** is named in PropertyList's action slot, and in Excluded as a recipe.
4. **Select, Checkbox and Textarea** are 'exists' with react/src sources.
5. **Board** has an optional onMove with drag plus Menu, the count in the column label, and dependencies on Timeline, Progress and LcfProvider.
6. **Lanes, LaneSwitch and DemoWorkbench** are dead code and not used as sources. LaneSwitch's wrap rule is kept as a ToggleGroup design note.
7. **SettingsTabs and DarkPill** are dead and not counted. Tabs rests on Jonathan and Nuxt only.
8. **Compare** stays excluded, for a different reason: ModelComparison is domain JSON. It is listed as a J12 source.
9. **LinkPicker and ClientPicker pills** go to Radio (pill or card). ToggleGroup single uses aria-pressed for view state only.
10. **Combobox** is in batch 1, matching ROADMAP.
11. **EmptyState** is in batch 2.
12. **Owner and requestedBy** are separated.
13. **Dialog** documents that modality is kept for ConfirmDialog and ConnectDialog; StartSheet renders RecordPanel despite its comment.
14. **Disclosure** lists all 8 details files and is in batch 2.
15. **Avatar** lists 8 copies plus MembersPage.
16. **dependsOn** completed: Icon for Toaster, Dialog and Sheet; Field, Input and Textarea for CopyField; Toolbar for Page; the results contract specified once in SearchField and reused by AsyncCombobox.
17. **SDK sweep** confirmed every SDK import is covered.

## Icons decision

lucide-react is the only icon set. LCF already depends on it and its components import it directly. Details are in the iconDecision field.

## Tailwind decision

The LCF preset is the only class vocabulary, with a codemod table and the missing mappings added to the preset. Details are in the tailwindMapping field.
