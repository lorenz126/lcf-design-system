<script setup lang="ts">
import { CalendarDays } from 'lucide-vue-next'
import type { CalendarEvent } from './Calendar.vue'

/**
 * DatePicker — a date you can type, and a month you can look at.
 *
 * NOT `<input type="date">`, and that is a cost rather than a win. The
 * native one is genuinely good: free parsing, free locale, a real picker
 * on a phone. It is given up for two things it cannot do — its popup is
 * unstyleable, so it cannot show the events, the range and the grid the
 * Calendar organism already draws; and its segmented display cannot be
 * typed or pasted into freely, so "3 Apr 2025" off a clipboard bounces.
 *
 * The price is that this owns the parsing, and that debt is paid in
 * `useDateText.ts` rather than spread through here. Read that file for
 * how a typed date is resolved; the short version is that Intl is asked
 * for the field order instead of anyone guessing it.
 *
 * TYPING IS THE PRIMARY WAY IN, and the calendar is the fallback. Anyone
 * who knows the date they want is faster typing it than paging through
 * months, and a picker that only opens a grid makes the fast case do the
 * slow thing. So the text field takes the focus and the grid is behind a
 * button.
 *
 * IT REFORMATS ON BLUR, and that is the whole teaching mechanism. Type
 * "3/4" and leave: the field says 03/04/2025. Nobody has to be told the
 * order, and the reformat is also the confirmation of what was
 * understood — which is why the same sentence is announced, since a
 * sighted user gets that confirmation by looking and nobody else would.
 *
 * THE MODEL IS ISO, ALWAYS. `yyyy-mm-dd`, the same string Calendar takes,
 * so what a consumer stores never depends on where its user lives. The
 * text in the box is the locale's business; the value is not.
 *
 * TEXT THAT DOES NOT PARSE DOES NOT CLEAR THE VALUE. It sets an error and
 * leaves the last good date alone. Silently emptying a field because
 * someone mistyped in it destroys data to punish a typo, and the
 * disagreement between the box and the value is exactly what the error
 * is there to say.
 */
const props = withDefaults(defineProps<{
  label?: string
  help?: string
  /** The caller's own error. A parse failure adds to it, never over it. */
  error?: string
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  id?: string
  disabled?: boolean
  readonly?: boolean
  /** Drives the field order, the month names and the placeholder. */
  locale?: string
  weekStartsOn?: number
  /** ISO `yyyy-mm-dd`, both of them. */
  min?: string
  max?: string
  events?: CalendarEvent[]
  /** How the chosen date is written back. Numeric is what people type. */
  display?: 'numeric' | 'medium'
  placeholder?: string
  /** The button's name. The glyph is not one. */
  openLabel?: string
  invalidText?: string
  rangeText?: string
}>(), {
  size: 'md',
  locale: 'en-GB',
  weekStartsOn: 1,
  display: 'numeric',
  openLabel: 'Choose date from a calendar',
  invalidText: 'Not a date we can read.',
  rangeText: 'That date is outside the allowed range.'
})

const model = defineModel<string | null>({ default: null })
const emit = defineEmits<{ select: [string] }>()

const announce = useAnnounce()

const open = ref(false)
const text = ref('')
const problem = ref('')

const field = useTemplateRef<HTMLInputElement>('field')
const panel = useTemplateRef<HTMLElement>('panel')

const hint = computed(() => props.placeholder ?? dateHint(props.locale))
const shown = computed(() => formatDate(model.value, props.locale, props.display))

/* The box follows the value, except while it is being typed in — which
   is what `problem` marks. Rewriting the text under someone mid-edit is
   how a field loses what they were halfway through saying. */
watch(shown, v => { if (!problem.value) text.value = v }, { immediate: true })

function outOfRange(iso: string) {
  return (props.min !== undefined && iso < props.min)
    || (props.max !== undefined && iso > props.max)
}

/** Reads what is in the box and decides what it meant. */
function commit() {
  const raw = text.value.trim()
  if (!raw) {
    problem.value = ''
    if (model.value !== null) model.value = null
    return
  }
  const iso = parseDate(raw, props.locale)
  if (!iso) {
    problem.value = props.invalidText
    return
  }
  if (outOfRange(iso)) {
    problem.value = props.rangeText
    return
  }
  problem.value = ''
  const canonical = formatDate(iso, props.locale, props.display)
  text.value = canonical
  if (model.value !== iso) {
    model.value = iso
    emit('select', iso)
  }
  /* Said out loud because the reformat above is a confirmation, and a
     confirmation only sighted people get is not one. */
  announce(formatDate(iso, props.locale, 'medium'))
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    commit()
    return
  }
  /* Down opens the grid, which is the APG date-field gesture and the one
     people try. Alt is accepted because the browser's own date fields
     take it, and refusing a modifier nobody meant to press is rude. */
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    show()
  }
}

/* ---------- the grid ---------- */

/**
 * THE BROWSER OWNS THE OPEN STATE, and `open` only ever catches up in
 * `onToggle`. Setting the ref here instead left aria-expanded saying
 * true over a popover that had never opened — the button's
 * `popovertarget` goes through the browser and this did not, so the two
 * routes in disagreed. Same rule Popover states at length.
 */
function show() {
  if (props.disabled || props.readonly) return
  panel.value?.showPopover?.()
}

function onToggle(e: Event) {
  open.value = (e as ToggleEvent).newState === 'open'
  if (open.value) {
    /* Focus has to go INTO the grid or the arrows keep typing in the
       box. Calendar keeps one cell tabbable, so that cell is the way
       in — there is no second answer to find. */
    nextTick(() => panel.value?.querySelector<HTMLElement>('[tabindex="0"]')?.focus())
    return
  }
  /* Light dismiss and Escape both land here. Bring the focus back to
     the field rather than to the top of the document — but only when it
     was inside the panel, or a click somewhere else on the page would
     be dragged back. */
  if (panel.value?.contains(document.activeElement)) field.value?.focus()
}

function onPick(iso: string) {
  problem.value = ''
  text.value = formatDate(iso, props.locale, props.display)
  emit('select', iso)
  /* Through the browser, for the reason above; onToggle then brings the
     focus home. */
  panel.value?.hidePopover?.()
  nextTick(() => field.value?.focus())
}

const uid = useId()
const panelId = `dp-${uid}`
/**
 * ONE ANCHOR NAME PER INSTANCE. A name in the stylesheet is a name every
 * copy on the page shares, and three pickers in a row all called --dp
 * meant the panel anchored to whichever one the engine picked last — the
 * first field's calendar opened under the third field. It only shows up
 * with more than one of them on a page, which is why the workshop has
 * three.
 *
 * It has to be inline: `position-anchor` takes a custom ident, and an
 * ident cannot be interpolated out of a var().
 */
const anchor = `--dp-${String(uid).replace(/[^\w-]/g, '-')}`
</script>

<template>
  <UiField
    :id="id"
    :label="label"
    :help="help"
    :error="error || problem || undefined"
    :size="size"
    :block="block"
  >
    <template #default="{ id: fieldId, describedBy, invalid }">
      <div class="u-dp" :style="{ anchorName: anchor }">
        <input
          :id="fieldId"
          ref="field"
          v-model="text"
          type="text"
          class="u-dp-field"
          inputmode="numeric"
          autocomplete="off"
          spellcheck="false"
          :placeholder="hint"
          :disabled="disabled"
          :readonly="readonly"
          :aria-invalid="invalid"
          :aria-describedby="describedBy"
          @blur="commit"
          @keydown="onKey"
        >
        <button
          type="button"
          class="u-dp-open"
          :popovertarget="panelId"
          :aria-label="openLabel"
          :aria-expanded="open"
          :aria-controls="panelId"
          :disabled="disabled || readonly"
        ><UiIcon :is="CalendarDays" size="sm" /></button>

        <div
          :id="panelId"
          ref="panel"
          popover="auto"
          class="u-dp-pop"
          :style="{ positionAnchor: anchor }"
          @toggle="onToggle"
        >
          <UiCalendar
            :model-value="model"
            :locale="locale"
            :week-starts-on="weekStartsOn"
            :min="min"
            :max="max"
            :events="events"
            @update:model-value="v => v && (model = v)"
            @select="onPick"
          />
        </div>
      </div>
    </template>
  </UiField>
</template>

<style scoped>
.u-dp {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

/* The same box as Input, down to the radius formula — a date field is
   not a different kind of field, it just has a button in it. */
.u-dp-field {
  width: 100%;
  height: var(--fld-h, var(--field-md));
  padding-inline: var(--fld-pad, var(--s-5));
  /* Room for the button, so a long date never runs under it. */
  padding-inline-end: calc(var(--fld-h, var(--field-md)) + var(--s-2));
  color: var(--fg);
  background: var(--bg);
  border: var(--border-width) solid var(--border-strong);
  border-radius: min(var(--r-control), calc(var(--fld-h, var(--field-md)) * 0.4));
  font: var(--w-regular) var(--fld-fs, var(--fs-body))/1 var(--font-sans);
  letter-spacing: var(--tr-body);
  font-variant-numeric: tabular-nums;
  transition: border-color var(--dur-fast) var(--ease-out),
              outline-color var(--dur-fast) var(--ease-out);
}
.u-dp-field::placeholder { color: var(--fg-subtle); }
.u-dp-field:hover:not(:disabled):not(:read-only) { border-color: var(--fg-subtle); }
.u-dp-field:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 0;
  border-color: var(--accent);
}
.u-dp-field:disabled { opacity: .5; cursor: not-allowed; background: var(--fill-quiet); }

/* Field's root is this component's root too — Vue stamps the parent's
   scope id onto a child's root element — so this looks UP, and :deep()
   would be the wrong tool. */
.u-invalid .u-dp-field { border-color: var(--danger-text); }
.u-invalid .u-dp-field:focus-visible {
  outline-color: color-mix(in srgb, var(--danger-text) 40%, transparent);
}

.u-dp-open {
  position: absolute;
  inset-inline-end: var(--s-2);
  display: grid;
  place-items: center;
  width: calc(var(--fld-h, var(--field-md)) - var(--s-3));
  height: calc(var(--fld-h, var(--field-md)) - var(--s-3));
  padding: 0;
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--fg-subtle);
  cursor: pointer;
}
.u-dp-open:hover:not(:disabled) { background: var(--fill-quiet); color: var(--fg); }
.u-dp-open:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 1px;
}
.u-dp-open:disabled { opacity: .5; cursor: not-allowed; }

.u-dp-pop {
  margin: 0;
  inset: auto;
  padding: var(--s-5);
  border: var(--border-width) solid var(--border);
  border-radius: var(--r-lg);
  background: var(--bg-raised);
  color: var(--fg);
  box-shadow: var(--shadow-3);
  /* position-anchor is set inline, per instance — see `anchor`. */
  position-area: block-end span-inline-end;
  position-try-fallbacks: block-start span-inline-end, block-end span-inline-start;
  margin-block: var(--s-3);
}

/* Where anchor positioning is not available yet, the panel still opens
   in the top layer — it is just centred rather than under the field.
   A picker that appears in the wrong place still works; one clipped by
   an ancestor's overflow does not. */
@supports not (position-area: block-end) {
  .u-dp-pop { position: fixed; inset: 50% auto auto 50%; translate: -50% -50%; }
}
</style>
