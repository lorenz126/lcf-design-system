<script setup lang="ts">
import { Check, ChevronDown, Plus, X } from 'lucide-vue-next'

/**
 * Combobox — a form field that picks from a list you can type into.
 *
 * SEARCHFIELD IS A COMBOBOX FOR CHROME; this is one for a form, and
 * three things follow from that.
 *
 * THE VALUE IS AN ID, NOT THE TEXT. SearchField's model is the query
 * someone typed, because a search box's value IS what was typed. A form
 * submits a country, not the letters "Germ" — so the model here is
 * `value`, the typed text is internal, and the two never get confused.
 * That is also why the label can change without the stored value moving.
 *
 * IT FILTERS, and SearchField refuses to, for the reason the palette
 * gives: a component should filter exactly when it knows what it is
 * filtering. The options are handed over whole and finite, so it does.
 *
 * BUT IT LOOKS UP RATHER THAN SEARCHING. A palette is a search — fuzzy
 * matching earns its keep when you half-remember a command. A form
 * combobox is a lookup: you know the country is called Deutschland and
 * you are typing it. So this is a substring match with a prefix
 * preferred, and "dnm" finds nothing, which is correct — a fuzzy match
 * in a form is a control that offers Denmark when you typed a typo.
 *
 * CREATING AN OPTION IS THE POINT WHERE IT STOPS CHOOSING AND STARTS
 * WRITING, so it is opt-in and it does not do the writing. `creatable`
 * offers the row; choosing it EMITS `create` and nothing else. A
 * component that pushed the new option into its own list would produce
 * one that exists until the page reloads — the option has to be made
 * where the others live, and only the caller knows where that is.
 *
 * FOCUS NEVER LEAVES THE INPUT, the same contract SearchField documents
 * at length: the arrows move `aria-activedescendant`, not focus.
 *
 * WHAT IT IS NOT: a remote/async picker. Loading options as you type is
 * a different component — it needs a request per keystroke, a race
 * between answers, a spinner and a story about what a stale response
 * does. Hand this one the options.
 */
export interface ComboOption {
  value: string | number
  label: string
  /** A trailing note — a code, a type, a count. */
  note?: string
  /** Other things someone might type to find it. */
  keywords?: string[]
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  options: ComboOption[]
  label?: string
  help?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  id?: string
  disabled?: boolean
  required?: boolean
  placeholder?: string
  /** Several at once. The model becomes an array of ids. */
  multiple?: boolean
  /** Offers a row that reports a new option — see above. */
  creatable?: boolean
  createLabel?: (query: string) => string
  emptyText?: string
  /** Caps the chips before they take over the field. */
  maxChips?: number
}>(), {
  size: 'md',
  placeholder: 'Select',
  emptyText: 'No matches.',
  createLabel: (q: string) => `Add “${q}”`
})

type Id = string | number
const model = defineModel<Id | Id[] | null>({ default: null })

const emit = defineEmits<{
  /** The text someone wanted an option for. Make it where the rest live. */
  create: [string]
  open: []
}>()

const chosen = computed<Id[]>(() =>
  props.multiple
    ? (Array.isArray(model.value) ? model.value : [])
    : model.value === null || model.value === undefined ? [] : [model.value as Id]
)
const byId = computed(() => new Map(props.options.map(o => [o.value, o])))
const picked = computed(() =>
  chosen.value.map(v => byId.value.get(v)).filter((o): o is ComboOption => !!o)
)

/* ---------- what the list shows ---------- */

const query = ref('')

/** Where the query lands in a label, or -1. Prefix beats mid-word. */
function rank(o: ComboOption, q: string) {
  const l = o.label.toLowerCase()
  const at = l.indexOf(q)
  if (at === 0) return 0
  if (at > 0) return l[at - 1] === ' ' ? 1 : 2
  if (o.keywords?.some(k => k.toLowerCase().includes(q))) return 3
  return -1
}

const matches = computed(() => {
  const q = query.value.trim().toLowerCase()
  const pool = props.multiple
    ? props.options.filter(o => !chosen.value.includes(o.value))
    : props.options
  if (!q) return pool
  return pool
    .map(o => ({ o, r: rank(o, q) }))
    .filter(x => x.r >= 0)
    .sort((a, b) => a.r - b.r)
    .map(x => x.o)
})

/** Offered only when the text is not already an option, exactly or
 *  otherwise — "Add Germany" under a list containing Germany is a row
 *  that makes a duplicate. */
const canCreate = computed(() => {
  const q = query.value.trim()
  if (!props.creatable || !q) return false
  return !props.options.some(o => o.label.toLowerCase() === q.toLowerCase())
})

/** The list the arrows walk: the matches, then the create row. */
const rows = computed(() => [
  ...matches.value.map(o => ({ kind: 'option' as const, option: o })),
  ...(canCreate.value ? [{ kind: 'create' as const, option: undefined }] : [])
])

/* ---------- opening ---------- */

const open = ref(false)
const active = ref(0)

const root = useTemplateRef<HTMLElement>('root')
const field = useTemplateRef<HTMLInputElement>('field')
const panel = useTemplateRef<HTMLElement>('panel')
const { track, untrack } = useAnchored(root, panel, 'bottom', 'start')

const uid = useId()
const listId = `cb-${uid}`
const optId = (i: number) => `${listId}-o${i}`

function show() {
  if (props.disabled || open.value) return
  open.value = true
  emit('open')
}
function hide() {
  open.value = false
  active.value = 0
}

function onBlur() {
  /* A query left behind is text that disagrees with the value under it.
     Escape does NOT do this — one key closing the list and wiping what
     was typed is two undos in one press. */
  query.value = ''
  hide()
}

watch(open, v => {
  const p = panel.value
  if (!p) return
  if (v) {
    p.style.minWidth = `${root.value!.getBoundingClientRect().width}px`
    p.showPopover?.()
    nextTick(track)
  } else {
    p.hidePopover?.()
    untrack()
  }
})
/* Nothing left to point at — close rather than leave an empty box. */
watch(rows, r => { if (!r.length && open.value && !props.emptyText) hide() })
onBeforeUnmount(untrack)

/* ---------- choosing ---------- */

function take(o: ComboOption) {
  if (o.disabled) return
  if (props.multiple) {
    model.value = [...chosen.value, o.value]
    /* Cleared, not filled: in a multiple field the text is a filter, and
       leaving the last query in it hides everything you have not typed. */
    query.value = ''
    return
  }
  model.value = o.value
  query.value = ''
  hide()
}

function drop(v: Id) {
  model.value = props.multiple ? chosen.value.filter(x => x !== v) : null
}

function run(i: number) {
  const row = rows.value[i]
  if (!row) return
  if (row.kind === 'create') {
    emit('create', query.value.trim())
    query.value = ''
    if (!props.multiple) hide()
    return
  }
  take(row.option)
}

function move(step: 1 | -1) {
  const n = rows.value.length
  if (!n) return
  if (!open.value) { show(); active.value = step === 1 ? 0 : n - 1; return }
  active.value = (active.value + step + n) % n
  nextTick(() => {
    panel.value?.querySelector<HTMLElement>(`#${CSS.escape(optId(active.value))}`)
      ?.scrollIntoView({ block: 'nearest' })
  })
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    move(e.key === 'ArrowDown' ? 1 : -1)
    return
  }
  if (e.key === 'Enter') {
    if (!open.value) return
    e.preventDefault()
    run(active.value)
    return
  }
  if (e.key === 'Escape') {
    if (!open.value) return
    /* It stops here: clearing a field must not also close the dialog the
       field is in. */
    e.preventDefault()
    e.stopPropagation()
    hide()
    return
  }
  /* Backspace on an empty box takes the last chip. A field whose only
     way to remove one is a small × is a field you cannot empty from the
     keyboard. */
  if (e.key === 'Backspace' && !query.value && props.multiple && chosen.value.length) {
    drop(chosen.value[chosen.value.length - 1]!)
    return
  }
  if (e.key === 'Tab') hide()
}

function onInput() {
  active.value = 0
  /* Next tick: defineModel does not apply a write locally when a parent
     binds v-model, so the matches computed from it have not arrived yet
     and the list would open looking empty. */
  nextTick(show)
}

/**
 * WHAT THE BOX SAYS. The chosen label until someone types, then what
 * they are typing.
 *
 * Not "clear on focus", which was the first version and was a control
 * lying about itself: tab into a field holding Germany, see it empty,
 * conclude nothing is chosen, tab out — and the value was there the
 * whole time. The label stays and is SELECTED instead, so the first
 * keystroke replaces it and nothing has to be deleted first.
 */
const shown = computed(() => (props.multiple ? '' : picked.value[0]?.label ?? ''))
const text = computed(() => query.value || shown.value)

const extra = computed(() =>
  props.maxChips && picked.value.length > props.maxChips
    ? picked.value.length - props.maxChips
    : 0
)
const chips = computed(() =>
  extra.value ? picked.value.slice(0, props.maxChips) : picked.value
)
</script>

<template>
  <UiField
    :id="id"
    :label="label"
    :help="help"
    :error="error"
    :required="required"
    :size="size"
    :block="block"
  >
    <template #default="{ id: fieldId, describedBy, invalid }">
      <div ref="root" class="u-cb" :class="{ 'u-cb-off': disabled, 'u-cb-open': open }">
        <div class="u-cb-box" @mousedown.prevent="field?.focus(); show()">
          <span v-for="c in chips" :key="c.value" class="u-cb-chip">
            {{ c.label }}
            <button
              type="button"
              class="u-cb-x"
              :aria-label="`Remove ${c.label}`"
              tabindex="-1"
              @mousedown.stop.prevent
              @click.stop="drop(c.value)"
            ><UiIcon :is="X" :size="12" /></button>
          </span>
          <span v-if="extra" class="u-cb-more">+{{ extra }}</span>

          <input
            :id="fieldId"
            ref="field"
            :value="text"
            type="text"
            class="u-cb-field"
            role="combobox"
            autocomplete="off"
            spellcheck="false"
            :placeholder="picked.length && !multiple ? '' : placeholder"
            :disabled="disabled"
            :required="required && !picked.length"
            :aria-expanded="open"
            :aria-controls="listId"
            :aria-autocomplete="'list'"
            :aria-activedescendant="open && rows.length ? optId(active) : undefined"
            :aria-invalid="invalid"
            :aria-describedby="describedBy"
            @input="query = ($event.target as HTMLInputElement).value; onInput()"
            @focus="show(); ($event.target as HTMLInputElement).select()"
            @blur="onBlur"
            @keydown="onKey"
          >
          <UiIcon :is="ChevronDown" size="sm" class="u-cb-caret" />
        </div>

        <div :id="listId" ref="panel" popover="manual" class="u-cb-pop" role="listbox" :aria-label="label">
          <button
            v-for="(row, i) in rows"
            :key="row.kind === 'create' ? '+' : row.option.value"
            type="button"
            class="u-cb-row"
            :class="{ 'u-cb-at': i === active, 'u-cb-new': row.kind === 'create' }"
            :id="optId(i)"
            role="option"
            :aria-selected="i === active"
            :aria-disabled="row.kind === 'option' && row.option.disabled ? true : undefined"
            tabindex="-1"
            @mousedown.prevent
            @mousemove="active = i"
            @click="run(i)"
          >
            <UiIcon v-if="row.kind === 'create'" :is="Plus" size="sm" class="u-cb-lead" />
            <UiIcon
              v-else
              :is="Check"
              size="sm"
              class="u-cb-lead"
              :class="{ 'u-cb-unpicked': !chosen.includes(row.option.value) }"
            />
            <span class="u-cb-label">
              {{ row.kind === 'create' ? createLabel(query.trim()) : row.option.label }}
            </span>
            <span v-if="row.kind === 'option' && row.option.note" class="u-cb-note">{{ row.option.note }}</span>
          </button>

          <p v-if="!rows.length" class="u-cb-empty">{{ emptyText }}</p>
        </div>
      </div>
    </template>
  </UiField>
</template>

<style scoped>
.u-cb { position: relative; width: 100%; }

.u-cb-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-3);
  min-height: var(--fld-h, var(--field-md));
  padding: 3px var(--s-8) 3px var(--fld-pad, var(--s-5));
  background: var(--bg);
  border: var(--border-width) solid var(--border-strong);
  border-radius: min(var(--r-control), calc(var(--fld-h, var(--field-md)) * 0.4));
  cursor: text;
  transition: border-color var(--dur-fast) var(--ease-out);
}
.u-cb-box:hover { border-color: var(--fg-subtle); }
/* The ring is on the BOX, not the input: the input is one thing inside a
   field made of several, and a ring around only the caret would say the
   chips are somewhere else. */
.u-cb:focus-within .u-cb-box {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 0;
  border-color: var(--accent);
}
.u-invalid .u-cb-box { border-color: var(--danger-text); }
.u-cb-off .u-cb-box { opacity: .5; cursor: not-allowed; background: var(--fill-quiet); }

.u-cb-field {
  flex: 1;
  min-width: 6ch;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--fg);
  font: var(--w-regular) var(--fld-fs, var(--fs-body))/1.6 var(--font-sans);
}
.u-cb-field:focus { outline: none; }
.u-cb-field::placeholder { color: var(--fg-subtle); }

.u-cb-caret {
  position: absolute;
  inset-inline-end: var(--s-4);
  top: calc(var(--fld-h, var(--field-md)) / 2);
  translate: 0 -50%;
  color: var(--fg-subtle);
  pointer-events: none;
}

.u-cb-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  padding: 1px var(--s-2) 1px var(--s-3);
  border-radius: var(--r-sm);
  background: var(--fill);
  color: var(--fg);
  font: var(--w-medium) var(--fs-caption)/1.6 var(--font-sans);
}
.u-cb-x {
  display: grid;
  place-items: center;
  width: 14px; height: 14px;
  padding: 0; border: 0;
  border-radius: var(--r-xs);
  background: transparent;
  color: var(--fg-muted);
  cursor: pointer;
}
.u-cb-x:hover { background: var(--fill-strong); color: var(--fg); }
.u-cb-more { color: var(--fg-muted); font: var(--w-medium) var(--fs-caption)/1 var(--font-sans); }

.u-cb-pop {
  margin: 0;
  inset: auto;
  max-height: 260px;
  overflow-y: auto;
  padding: var(--s-3);
  border: var(--border-width) solid var(--border);
  border-radius: var(--r-lg);
  background: var(--bg-raised);
  box-shadow: var(--shadow-3);
}

.u-cb-row {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  width: 100%;
  padding: var(--s-3) var(--s-4);
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--fg);
  text-align: start;
  cursor: pointer;
  font: var(--w-regular) var(--fs-small)/1.4 var(--font-sans);
}
.u-cb-at { background: var(--fill); }
.u-cb-row[aria-disabled="true"] { opacity: .45; cursor: not-allowed; }

.u-cb-lead { flex: none; color: var(--accent-text); }
/* Kept in the layout rather than removed, so the labels do not shift by
   a tick's width the moment something is chosen. */
.u-cb-unpicked { visibility: hidden; }
.u-cb-new .u-cb-lead { color: var(--fg-muted); }
.u-cb-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.u-cb-note { flex: none; color: var(--fg-subtle); font-size: var(--fs-caption); }

.u-cb-empty {
  margin: 0;
  padding: var(--s-5) var(--s-4);
  color: var(--fg-muted);
  font: var(--w-regular) var(--fs-small)/1.4 var(--font-sans);
}
</style>
