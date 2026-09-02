<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

/**
 * Calendar — a month grid you can drive entirely from the keyboard.
 *
 * No date library. Intl handles the locale-dependent parts that are
 * genuinely hard — month and weekday names, first day of the week — and
 * month arithmetic on a Date is a dozen lines. A dependency here would
 * buy formatting we already have.
 *
 * The keyboard model is the component, not a feature of it. A grid of
 * clickable divs is unusable without a mouse, and a calendar is exactly
 * the control where that matters most:
 *
 *   arrows        day left / right / up-down a week
 *   Home / End    first and last day of the week
 *   PageUp/Down   previous / next month
 *   Enter, Space  select
 *
 * Only ONE cell is tabbable at a time (a roving tabindex). Thirty-one
 * tab stops per month is not navigation, it is an obstacle course.
 */
export interface CalendarEvent {
  /** ISO yyyy-mm-dd. */
  date: string
  label: string
  tone?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow'
}

const props = withDefaults(defineProps<{
  events?: CalendarEvent[]
  locale?: string
  /** 0 Sunday … 1 Monday. Intl knows this per locale, but support for
   *  getWeekInfo is uneven, so it stays an explicit prop. */
  weekStartsOn?: number
  min?: string
  max?: string
}>(), { locale: 'en-GB', weekStartsOn: 1 })

const selected = defineModel<string | null>({ default: null })
const emit = defineEmits<{ select: [string] }>()

/* ---------- date helpers ---------- */

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
/** Clamps the day so 31 Jan + 1 month is 28 Feb, not 3 March. */
const addMonths = (d: Date, n: number) => {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), lastDay))
}
const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()

const today = iso(new Date())

/* ---------- state ---------- */

/** The cell the keyboard is on. Distinct from the selection: you move
 *  around before committing, and moving is not choosing. */
const cursor = ref(parse(selected.value ?? today))
const gridEl = useTemplateRef<HTMLElement>('grid')

watch(selected, v => { if (v) cursor.value = parse(v) })

/* ---------- month grid ---------- */

const monthLabel = computed(() =>
  new Intl.DateTimeFormat(props.locale, { month: 'long', year: 'numeric' }).format(cursor.value)
)

const weekdayNames = computed(() => {
  const fmt = new Intl.DateTimeFormat(props.locale, { weekday: 'short' })
  // 2024-01-07 was a Sunday, so this walks a known week.
  return Array.from({ length: 7 }, (_, i) =>
    fmt.format(new Date(2024, 0, 7 + ((i + props.weekStartsOn) % 7)))
  )
})

const weeks = computed(() => {
  const first = new Date(cursor.value.getFullYear(), cursor.value.getMonth(), 1)
  const lead = (first.getDay() - props.weekStartsOn + 7) % 7
  const start = addDays(first, -lead)
  return Array.from({ length: 6 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d))
  )
})

const eventsByDate = computed(() => {
  const map = new Map<string, CalendarEvent[]>()
  for (const e of props.events ?? []) {
    const list = map.get(e.date) ?? []
    list.push(e)
    map.set(e.date, list)
  }
  return map
})

function disabled(d: Date) {
  const s = iso(d)
  return (props.min !== undefined && s < props.min) || (props.max !== undefined && s > props.max)
}

/* ---------- interaction ---------- */

function choose(d: Date) {
  if (disabled(d)) return
  cursor.value = d
  selected.value = iso(d)
  emit('select', iso(d))
}

function move(to: Date) {
  cursor.value = to
  // The moved-to cell may have been rendered only after the month
  // changed, so focus has to wait for it to exist.
  nextTick(() => {
    gridEl.value?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
  })
}

function onKey(e: KeyboardEvent) {
  const c = cursor.value
  const jump: Record<string, () => Date> = {
    ArrowLeft: () => addDays(c, -1),
    ArrowRight: () => addDays(c, 1),
    ArrowUp: () => addDays(c, -7),
    ArrowDown: () => addDays(c, 7),
    Home: () => addDays(c, -((c.getDay() - props.weekStartsOn + 7) % 7)),
    End: () => addDays(c, 6 - ((c.getDay() - props.weekStartsOn + 7) % 7)),
    PageUp: () => addMonths(c, -1),
    PageDown: () => addMonths(c, 1)
  }
  if (jump[e.key]) {
    e.preventDefault()
    move(jump[e.key]!())
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    choose(c)
  }
}
</script>

<template>
  <div class="u-cal">
    <div class="u-cal-head">
      <strong class="u-cal-month" aria-live="polite">{{ monthLabel }}</strong>
      <div class="u-cal-nav">
        <UiButton
          variant="plain" tone="neutral" size="sm" icon-only
          aria-label="Previous month" @click="move(addMonths(cursor, -1))"
        ><UiIcon :is="ChevronLeft" size="sm" /></UiButton>
        <UiButton
          variant="plain" tone="neutral" size="sm" icon-only
          aria-label="Next month" @click="move(addMonths(cursor, 1))"
        ><UiIcon :is="ChevronRight" size="sm" /></UiButton>
      </div>
    </div>

    <div
      ref="grid"
      class="u-cal-grid"
      role="grid"
      :aria-label="monthLabel"
      @keydown="onKey"
    >
      <div class="u-cal-row u-cal-weekdays" role="row">
        <span v-for="w in weekdayNames" :key="w" role="columnheader" class="u-cal-wd">{{ w }}</span>
      </div>

      <div v-for="(week, wi) in weeks" :key="wi" class="u-cal-row" role="row">
        <div
          v-for="d in week"
          :key="iso(d)"
          role="gridcell"
          :aria-selected="selected === iso(d)"
        >
          <button
            type="button"
            class="u-cal-day"
            :class="{
              'u-cal-outside': !sameMonth(d, cursor),
              'u-cal-today': iso(d) === today,
              'u-cal-on': selected === iso(d)
            }"
            :tabindex="iso(d) === iso(cursor) ? 0 : -1"
            :aria-disabled="disabled(d) || undefined"
            :aria-current="iso(d) === today ? 'date' : undefined"
            @click="choose(d)"
            @focus="cursor = d"
          >
            <span class="u-cal-num">{{ d.getDate() }}</span>
            <span v-if="eventsByDate.get(iso(d))" class="u-cal-dots">
              <span
                v-for="(ev, i) in eventsByDate.get(iso(d))!.slice(0, 3)"
                :key="i"
                class="u-cal-dot"
                :style="{ background: `var(--${ev.tone ?? 'blue'})` }"
              />
            </span>
            <!-- The dots are decoration; this is what is announced. -->
            <span v-if="eventsByDate.get(iso(d))" class="u-cal-sr">
              {{ eventsByDate.get(iso(d))!.length }} events:
              {{ eventsByDate.get(iso(d))!.map(e => e.label).join(', ') }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <p class="u-cal-hint">
      Arrows move by day, Home and End to the week’s edges, Page Up and Page Down by
      month, Enter to select.
    </p>
  </div>
</template>

<style scoped>
.u-cal { display: inline-flex; flex-direction: column; gap: var(--s-5); }

.u-cal-head { display: flex; align-items: center; gap: var(--s-5); }
.u-cal-month {
  font: var(--w-semibold) var(--fs-body)/1 var(--font-sans);
  letter-spacing: var(--tr-body);
  margin-inline-end: auto;
}
.u-cal-nav { display: flex; gap: var(--s-1); }

.u-cal-grid { display: flex; flex-direction: column; gap: 2px; }
.u-cal-row { display: grid; grid-template-columns: repeat(7, 36px); gap: 2px; }

.u-cal-wd {
  display: grid; place-items: center; height: 24px;
  font: var(--w-medium) var(--fs-micro)/1 var(--font-sans);
  color: var(--fg-subtle);
}

.u-cal-day {
  position: relative;
  width: 36px; height: 36px;
  display: grid; place-items: center; gap: 2px;
  border: 0; background: transparent; padding: 0;
  border-radius: var(--r-sm); cursor: pointer;
  font: var(--w-regular) var(--fs-small)/1 var(--font-sans);
  color: var(--fg);
  transition: background-color var(--dur-instant) var(--ease-out);
}
.u-cal-day:hover:not([aria-disabled]) { background: var(--fill-quiet); }
.u-cal-day:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 1px;
}
.u-cal-day[aria-disabled] { opacity: .35; cursor: not-allowed; }

/* aria-disabled, NOT the disabled attribute. A disabled button is out of
   the focus order, so the roving tabindex cannot put the cursor on it:
   the arrow key moves the cursor, focus() finds nothing to focus, and
   the two silently come apart — focus sticks on the last enabled day
   while the cursor walks on without it. Marked inert instead, and
   refused in choose(), which is what "travel across but do not select"
   actually requires. */

/* Days from the neighbouring months stay visible but recede — removing
   them leaves holes that break the week rows. */
.u-cal-outside { color: var(--fg-subtle); }

.u-cal-today .u-cal-num { font-weight: var(--w-semibold); color: var(--accent-text); }
.u-cal-on { background: var(--accent); color: var(--solid-fg); }
.u-cal-on .u-cal-num { color: var(--solid-fg); }
.u-cal-on:hover:not([aria-disabled]) { background: var(--accent); }

.u-cal-num { grid-area: 1 / 1; }
.u-cal-dots {
  position: absolute; inset-block-end: 4px;
  display: flex; gap: 2px;
}
.u-cal-dot { width: 4px; height: 4px; border-radius: var(--r-full); }
.u-cal-on .u-cal-dot { background: var(--solid-fg) !important; }

.u-cal-hint {
  margin: 0; max-width: 34ch;
  font: var(--w-regular) var(--fs-micro)/1.5 var(--font-sans);
  color: var(--fg-subtle);
}

.u-cal-sr {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip-path: inset(50%); white-space: nowrap;
}
</style>
