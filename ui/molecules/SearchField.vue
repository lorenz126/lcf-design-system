<script setup lang="ts">
import type { Component } from 'vue'
import { Clock, Search, X } from 'lucide-vue-next'

/**
 * SearchField — a filled search pill for application chrome, with
 * suggestions under it.
 *
 * NOT A FLAG ON INPUT, and the reason is that it is not the same thing.
 * Input is a labelled form field: it sits in a form, it carries a label,
 * help text and an error, and its border says "this is an editable box"
 * next to text that is not. A search field lives in chrome, has no label
 * because the glyph is the label, and its ground is what marks it out
 * rather than an outline.
 *
 * The glyph sits at the END, and the clear button REPLACES it rather
 * than crowding in beside it. Two glyphs at the same edge is one too
 * many, and the trade is the right way round: an empty field needs to
 * say what it is, a field with a query in it says that already and needs
 * a way out instead.
 *
 * WITH SUGGESTIONS IT BECOMES A COMBOBOX, which has a keyboard contract
 * that is easy to get subtly wrong:
 *
 *   FOCUS NEVER LEAVES THE INPUT. The arrows move a highlight, not the
 *   focus — that is the whole reason aria-activedescendant exists. Moving
 *   real focus into the list would mean every keystroke after it went
 *   somewhere other than the field you are typing in.
 *
 *   Escape closes the list; a second Escape clears the field. One key,
 *   two steps, most specific first — and it stops there either way,
 *   because clearing a field must not also close the dialog it is in.
 *
 *   Options cancel their own mousedown, so clicking one never blurs the
 *   input. Without that, the blur closes the list and the click lands on
 *   nothing.
 *
 * The list is `popover="manual"`, not `auto`. Auto brings light dismiss,
 * which would close the list the moment you clicked back into the very
 * field it belongs to — the field is not the popover's invoker. Manual
 * keeps the top layer, so no ancestor's overflow can clip it, and leaves
 * opening and closing to focus, where it belongs here.
 *
 * WHAT IT DOES NOT DO IS SEARCH. It renders what it is given: matches
 * while there is a query, recents while there is not. Ranking, fuzziness
 * and where the results come from are the application's business, and a
 * component that guessed at them would be wrong in a different way for
 * every app that used it. The recents are a prop for the same reason —
 * a control that quietly wrote to localStorage would be a surprise.
 */
export interface SearchSuggestion {
  id: string | number
  label: string
  /** Small trailing note — a section, a type, a date. */
  note?: string
  icon?: Component
}

const props = withDefaults(defineProps<{
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  /** Fills the width it is given. Chrome usually wants this. */
  block?: boolean
  disabled?: boolean
  /** Accessible name. The glyph is not one. */
  label?: string
  id?: string
  /** Matches for the current query. Already filtered and ranked. */
  suggestions?: SearchSuggestion[]
  /** Shown while the field is empty. */
  recent?: SearchSuggestion[]
  recentLabel?: string
  /** Shown when there is a query and nothing matched it. */
  emptyText?: string
}>(), {
  size: 'md',
  placeholder: 'Search',
  label: 'Search',
  recentLabel: 'Recent',
  emptyText: 'No matches.'
})

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{
  clear: []
  select: [SearchSuggestion]
  /** Enter with no suggestion highlighted. */
  submit: [string]
}>()

const uid = useId()
const listId = `sfl-${uid}`
const optId = (i: number) => `${listId}-${i}`

const root = useTemplateRef<HTMLElement>('root')
const field = useTemplateRef<HTMLInputElement>('field')
const panel = useTemplateRef<HTMLElement>('panel')
const { track, untrack } = useAnchored(root, panel, 'bottom', 'start')

/* ---------- what the list shows ---------- */

const querying = computed(() => model.value.trim().length > 0)
const shown = computed(() =>
  (querying.value ? props.suggestions : props.recent) ?? []
)
/** With a query and no matches there is still something to say. */
const hasList = computed(() => shown.value.length > 0 || querying.value)
const configured = computed(() =>
  props.suggestions !== undefined || props.recent !== undefined
)

const open = ref(false)
/** Index into `shown`, or -1 for "the query itself". */
const active = ref(-1)

function show() {
  if (!configured.value || !hasList.value) return
  open.value = true
}
function hide() {
  open.value = false
  active.value = -1
}

watch(open, v => {
  const p = panel.value
  if (!p) return
  if (v) {
    // Match the field so the list reads as belonging to it.
    p.style.minWidth = `${root.value!.getBoundingClientRect().width}px`
    p.showPopover?.()
    nextTick(track)
  } else {
    p.hidePopover?.()
    untrack()
  }
})
/** Nothing left to show — close rather than leave an empty box hanging. */
watch(hasList, v => { if (!v) hide() })
onBeforeUnmount(untrack)

/* ---------- actions ---------- */

function clear() {
  model.value = ''
  active.value = -1
  emit('clear')
  // Clearing and then losing the field is how you end up typing into the
  // page instead of the box.
  field.value?.focus()
}

function choose(s: SearchSuggestion) {
  model.value = s.label
  hide()
  emit('select', s)
}

function move(step: 1 | -1) {
  const n = shown.value.length
  if (!n) return
  if (!open.value) {
    show()
    active.value = step === 1 ? 0 : n - 1
    return
  }
  active.value =
    active.value < 0
      ? (step === 1 ? 0 : n - 1)
      : (active.value + step + n) % n
  nextTick(() => {
    panel.value
      ?.querySelector<HTMLElement>(`#${CSS.escape(optId(active.value))}`)
      ?.scrollIntoView({ block: 'nearest' })
  })
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    // Most specific step first, and it stops here either way.
    e.preventDefault()
    e.stopPropagation()
    if (open.value) hide()
    else if (model.value) clear()
    return
  }
  // Home and End belong to the caret. A list is not worth losing them.
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    if (!configured.value) return
    e.preventDefault()
    move(e.key === 'ArrowDown' ? 1 : -1)
    return
  }
  if (e.key === 'Enter') {
    const pick = open.value && active.value >= 0 ? shown.value[active.value] : undefined
    if (pick) {
      e.preventDefault()
      choose(pick)
    } else {
      hide()
      emit('submit', model.value)
    }
    return
  }
  if (e.key === 'Tab') hide()
}

function onInput() {
  active.value = -1
  /* Next tick, not now. When a parent binds v-model, defineModel does not
     apply the write locally — it emits, and the value returns as a prop
     on the parent's next render. Asked in this tick, the field still
     holds the previous query, and the suggestions computed from it have
     not arrived either, so the list looks empty and refuses to open. */
  nextTick(show)
}

/** Closing on focusout rather than blur: the clear button is inside. */
function onFocusOut(e: FocusEvent) {
  const to = e.relatedTarget as Node | null
  if (to && root.value?.contains(to)) return
  hide()
}

/** Focus the field from outside — a ⌘K shortcut, a toolbar button. */
defineExpose({ focus: () => field.value?.focus() })
</script>

<template>
  <div
    ref="root"
    class="u-sf"
    :class="[`u-s-${size}`, { 'u-sf-block': block, 'u-sf-off': disabled }]"
    @focusout="onFocusOut"
  >
    <input
      :id="id ?? `sf-${uid}`"
      ref="field"
      v-model="model"
      type="search"
      class="u-sf-input"
      :placeholder="placeholder"
      :aria-label="label"
      :disabled="disabled"
      :role="configured ? 'combobox' : undefined"
      :aria-expanded="configured ? open : undefined"
      :aria-controls="configured ? listId : undefined"
      :aria-autocomplete="configured ? 'list' : undefined"
      :aria-activedescendant="open && active >= 0 ? optId(active) : undefined"
      autocomplete="off"
      @focus="show"
      @input="onInput"
      @keydown="onKey"
    >
    <button
      v-if="model"
      type="button"
      class="u-sf-clear"
      aria-label="Clear search"
      @click="clear"
    ><UiIcon :is="X" size="sm" /></button>
    <UiIcon v-else :is="Search" size="sm" class="u-sf-glyph" />

    <div
      v-if="configured"
      :id="listId"
      ref="panel"
      popover="manual"
      class="u-sf-list"
      role="listbox"
      :aria-label="label"
    >
      <p v-if="!querying && shown.length" class="u-sf-group">
        <UiIcon :is="Clock" size="sm" />{{ recentLabel }}
      </p>

      <p v-if="!shown.length" class="u-sf-none">{{ emptyText }}</p>

      <div
        v-for="(s, i) in shown"
        :id="optId(i)"
        :key="s.id"
        role="option"
        class="u-sf-opt"
        :class="{ 'u-sf-opt-on': i === active }"
        :aria-selected="i === active"
        @mousedown.prevent
        @mouseenter="active = i"
        @click="choose(s)"
      >
        <UiIcon v-if="s.icon" :is="s.icon" size="sm" class="u-sf-opt-icon" />
        <span class="u-sf-opt-label">{{ s.label }}</span>
        <span v-if="s.note" class="u-sf-opt-note">{{ s.note }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.u-sf {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--s-3);
  height: var(--h);
  padding-inline: var(--s-5);
  /* The same expression Button uses, so the radius holds if the token is
     raised or the control is made shorter. A capsule is reserved for
     badges in this system — a fully round field would say "label" while
     asking to be typed in. */
  border-radius: min(var(--r-control), calc(var(--h) * 0.4));
  /* The ground marks the field out, not an outline. Translucent rather
     than a grey token, so it reads the same on the page, on a card and
     in a top bar without anyone choosing which. */
  background: var(--fill-quiet);
  color: var(--fg);
  transition: background-color var(--dur-fast) var(--ease-out);
}
.u-sf-block { display: flex; width: 100%; }
.u-sf:hover:not(.u-sf-off) { background: var(--fill); }
.u-sf:focus-within {
  background: var(--fill);
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 1px;
}
.u-sf-off { opacity: .5; }

/* The pill grows with `size`; the text barely does. Chrome is read at
   one size — a search box set in body copy towers over the navigation
   beside it, which is a difference that means nothing. */
.u-s-sm { --h: var(--control-sm); --fs: var(--fs-caption); }
.u-s-md { --h: var(--control-md); --fs: var(--fs-small); }
.u-s-lg { --h: var(--control-lg); --fs: var(--fs-small); }

.u-sf-glyph { flex: none; color: var(--fg-subtle); }

.u-sf-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  font: var(--w-regular) var(--fs)/1 var(--font-sans);
  letter-spacing: var(--tr-small);
}
.u-sf-input:focus { outline: none; }
.u-sf-input::placeholder { color: var(--fg-subtle); }
/* The platform's own clear affordance is unstyleable and appears in one
   browser only, which makes it a difference nobody asked for. */
.u-sf-input::-webkit-search-cancel-button,
.u-sf-input::-webkit-search-decoration { appearance: none; }

.u-sf-clear {
  flex: none;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  margin-inline-end: -3px;
  padding: 0;
  border: 0;
  border-radius: var(--r-full);
  background: transparent;
  color: var(--fg-subtle);
  cursor: pointer;
}
.u-sf-clear:hover { background: var(--fill-strong); color: var(--fg); }
.u-sf-clear:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 1px;
}

/* ---- the list ---- */

.u-sf-list {
  margin: 0;
  inset: auto;
  max-width: 92vw;
  max-height: min(50vh, 380px);
  overflow-y: auto;
  padding: var(--s-2);
  border: var(--border-width) solid var(--border);
  border-radius: var(--r-lg);
  background: var(--bg-raised);
  color: var(--fg);
  box-shadow: var(--shadow-3);
}

.u-sf-group {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  margin: var(--s-2) 0 var(--s-1);
  padding-inline: var(--s-4);
  color: var(--fg-subtle);
  font: var(--w-semibold) var(--fs-caption)/1.4 var(--font-sans);
}
.u-sf-none {
  margin: 0;
  padding: var(--s-5) var(--s-4);
  color: var(--fg-subtle);
  font: var(--w-regular) var(--fs-small)/1.4 var(--font-sans);
}

.u-sf-opt {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  padding: var(--s-3) var(--s-4);
  border-radius: var(--r-sm);
  cursor: pointer;
  font: var(--w-regular) var(--fs-small)/1.3 var(--font-sans);
  letter-spacing: var(--tr-small);
}
/* One highlight, driven by the keyboard. The pointer moves it too rather
   than lighting a second row, because the input keeps focus throughout —
   there is only ever one place "here" can mean. */
.u-sf-opt-on { background: var(--fill); }

.u-sf-opt-icon { flex: none; color: var(--fg-subtle); }
.u-sf-opt-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.u-sf-opt-note {
  flex: none;
  color: var(--fg-subtle);
  font-size: var(--fs-micro);
}
</style>
