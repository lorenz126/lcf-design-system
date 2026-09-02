<script setup lang="ts">
import type { Component } from 'vue'

/**
 * Tabs — several views, one place to put them.
 *
 * IF SWITCHING CHANGES THE URL, THIS IS NOT A TABLIST. It is navigation,
 * and it wants links with `aria-current="page"` — a `role="tab"` on an
 * anchor promises a panel that swaps in place and then reloads the
 * document instead. So there is no `link` prop here on purpose. Tabs
 * swap views within one page; the Sidebar and Breadcrumb do the other
 * thing, and both already take a link component.
 *
 * The same boundary decides Tabs against ToggleGroup, which can be made
 * to look identical. **Choose by what it does, not by how it looks.** A
 * tablist swaps what you are looking at; a radiogroup sets a value you
 * will later submit. That is why one has `aria-selected` and a panel and
 * the other has `aria-checked` and a name.
 *
 * AUTOMATIC OR MANUAL ACTIVATION, and it is a prop because both are
 * right. Arrows that select as they move is the ARIA default and it is
 * correct for panels that are already there: the reader hears each panel
 * as they pass it. For a panel that FETCHES, the same behaviour fires a
 * request per keypress, and the answer is `manual` — arrows move focus,
 * Enter or Space chooses. The consumer knows which it has; this cannot.
 *
 * ONE PANEL, NOT ALL OF THEM. The default slot receives the active value
 * and renders one thing, so nothing is fetched or mounted until it is
 * asked for. What that costs is memory: a scroll position, a half-typed
 * field, an open disclosure inside a panel are gone when you come back.
 * A consumer who wants them kept puts its own `v-show` inside the slot —
 * which is a choice it can make per panel, and one this component would
 * have to make for all of them.
 *
 * A DISABLED TAB KEEPS ITS FOCUS, and this is the Calendar lesson paid
 * for once already: a real `disabled` attribute takes the element out of
 * the focus order, the roving tabindex cannot land on it, and the cursor
 * and the focus drift apart. So it is `aria-disabled`, refused in
 * `choose()`. It also happens to be right on its own terms — a tab you
 * cannot open is information, and hiding it is worse than showing it
 * greyed.
 *
 * OVERFLOW SCROLLS. Of the three answers to tabs that do not fit, this
 * is the only one that leaves the keyboard model whole. Wrapping keeps
 * it but turns Left and Right into a guess about line breaks. Collapsing
 * the extras into a "More" menu moves them OUT of the tablist: the
 * arrows can no longer reach them, the roving tabindex spans two
 * widgets, and `role="tablist"` stops containing its own tabs. Scrolling
 * changes nothing about the order or the keys — focus brings its tab
 * into view by itself — so it is the only one here.
 *
 * The edges fade when there is more, and only then, which needs a
 * measurement rather than a permanent mask: a fade over a list that fits
 * says there is something past the end when there is not.
 *
 * The underline sits ON the selected tab rather than travelling between
 * them. A sliding bar has to be re-measured on every resize, every font
 * load and every change to the labels, and what it buys is motion rather
 * than a clearer answer to which tab is open.
 */
export interface TabItem {
  value: string
  label: string
  icon?: Component
  /** A count beside the label — "Issues 12". */
  badge?: string | number
  /** Shown, focusable, and refused. See above. */
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  items: TabItem[]
  /** See above. Both are correct; the panel decides which. */
  activation?: 'automatic' | 'manual'
  variant?: 'underline' | 'pill'
  size?: 'sm' | 'md' | 'lg'
  orientation?: 'horizontal' | 'vertical'
  /** Names the tablist. Required when nothing visible does. */
  label?: string
  /** Spreads the tabs across the full width. */
  block?: boolean
}>(), {
  activation: 'automatic',
  variant: 'underline',
  size: 'md',
  orientation: 'horizontal'
})

const model = defineModel<string>({ default: '' })

const uid = useId()
/* Indexed rather than keyed by value: a value is the consumer's string
   and may hold anything, and an id has to survive being put in an
   attribute and in a selector. */
const tabId = (i: number) => `${uid}-t-${i}`
const panelId = `${uid}-p`

const at = computed(() => props.items.findIndex(i => i.value === model.value))

/* ---------- moving ---------- */

const list = useTemplateRef<HTMLElement>('list')

/** Where focus last was, so Tab comes back to it. */
const seen = ref<number>()

/**
 * ONE tab stop for the whole list. What is selected, then where focus
 * last was, then the first tab — the same order as ToggleGroup, for the
 * same reason: a ten-tab bar must not be ten stops on the way past.
 */
const stop = computed(() => {
  if (at.value >= 0) return at.value
  if (seen.value !== undefined && seen.value < props.items.length) return seen.value
  return 0
})

function choose(item: TabItem | undefined) {
  if (!item || item.disabled) return
  model.value = item.value
}

function focusAt(i: number) {
  list.value?.querySelector<HTMLElement>(`[data-at="${i}"]`)?.focus()
}

function onKey(e: KeyboardEvent, from: number) {
  const fwd = props.orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight'
  const back = props.orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft'
  if (![fwd, back, 'Home', 'End'].includes(e.key)) return

  const n = props.items.length
  if (!n) return
  e.preventDefault()

  const next =
    e.key === 'Home' ? 0
      : e.key === 'End' ? n - 1
        : (from + (e.key === fwd ? 1 : -1) + n) % n

  /* Recorded here rather than left to the focus event: this already
     knows where it is going, and the tab stop must be right before the
     next Tab, not after a round trip. */
  seen.value = next
  focusAt(next)
  /* Enter and Space are the browser's — every tab is a real <button>,
     so a click arrives without any keyboard code of ours. */
  if (props.activation === 'automatic') choose(props.items[next])
}

/* ---------- the fade ---------- */

const over = ref<'none' | 'start' | 'end' | 'both'>('none')

function measure() {
  const el = list.value
  if (!el) return
  const up = props.orientation === 'vertical'
  const box = up ? el.clientHeight : el.clientWidth
  const full = up ? el.scrollHeight : el.scrollWidth
  /* A pixel of slack: sub-pixel layout leaves scrollWidth a hair over
     clientWidth on rows that plainly fit, and a permanent fade on a list
     with nothing past the end is exactly the lie this is avoiding. */
  if (full - box <= 1) {
    over.value = 'none'
    return
  }
  /* Absolute, because a right-to-left scroller counts backwards. */
  const pos = Math.abs(up ? el.scrollTop : el.scrollLeft)
  over.value = pos <= 1 ? 'end' : pos >= full - box - 1 ? 'start' : 'both'
}

let watcher: ResizeObserver | undefined
onMounted(() => {
  measure()
  if (typeof ResizeObserver === 'undefined' || !list.value) return
  watcher = new ResizeObserver(measure)
  watcher.observe(list.value)
})
onBeforeUnmount(() => watcher?.disconnect())
/* The box can stay the same size while its contents change. */
watch(() => props.items, () => nextTick(measure), { deep: true })
</script>

<template>
  <div class="u-tb" :class="[`u-tb-${orientation}`, { 'u-tb-block': block }]">
    <div
      ref="list"
      class="u-tb-list"
      :class="[`u-tb-${variant}`, `u-s-${size}`]"
      role="tablist"
      :aria-label="label"
      :aria-orientation="orientation"
      :data-over="over"
      @scroll="measure"
    >
      <button
        v-for="(item, i) in items"
        :key="item.value"
        type="button"
        class="u-tb-tab"
        :class="{ 'u-tb-on': item.value === model, 'u-tb-off': item.disabled }"
        :data-at="i"
        :id="tabId(i)"
        role="tab"
        :aria-selected="item.value === model"
        :aria-controls="panelId"
        :aria-disabled="item.disabled || undefined"
        :tabindex="i === stop ? 0 : -1"
        @click="choose(item)"
        @focus="seen = i"
        @keydown="onKey($event, i)"
      >
        <UiIcon v-if="item.icon" :is="item.icon" size="sm" class="u-tb-ico" />
        <span class="u-tb-label">{{ item.label }}</span>
        <span v-if="item.badge !== undefined" class="u-tb-badge">{{ item.badge }}</span>
      </button>
    </div>

    <!-- Focusable on purpose: a panel whose content has no controls of
         its own is otherwise unreachable, and deciding that by counting
         focusable descendants is a measurement that goes stale the
         moment the panel renders something else. -->
    <div
      v-if="$slots.default"
      class="u-tb-panel"
      :id="panelId"
      role="tabpanel"
      :aria-labelledby="at >= 0 ? tabId(at) : undefined"
      tabindex="0"
    >
      <slot :active="model" />
    </div>
  </div>
</template>

<style scoped>
/* Full width on purpose: a tab bar is chrome that spans what it sits in,
   and a shrink-to-fit one inside a flex column never reaches the width
   it would have to overflow — so the scrolling would never happen. The
   upright one is a rail, and takes what it needs. */
.u-tb { display: flex; flex-direction: column; min-width: 0; width: 100%; }
.u-tb-vertical { flex-direction: row; gap: var(--s-7); width: auto; }

.u-tb-list {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  min-width: 0;
  overflow-x: auto;
  overflow-y: clip;
  scrollbar-width: none;
}
.u-tb-list::-webkit-scrollbar { display: none; }
.u-tb-vertical .u-tb-list {
  flex-direction: column;
  align-items: stretch;
  overflow-x: clip;
  overflow-y: auto;
  width: max-content;
}
.u-tb-block .u-tb-list { width: 100%; }
.u-tb-block .u-tb-tab { flex: 1; }

/* Only when there IS something past the edge — see measure(). 32px is
   about one glyph plus the gap, enough to read as cut off rather than as
   a shadow. */
.u-tb-list[data-over="end"]   { mask-image: linear-gradient(to right, #000 calc(100% - 32px), transparent); }
.u-tb-list[data-over="start"] { mask-image: linear-gradient(to left,  #000 calc(100% - 32px), transparent); }
.u-tb-list[data-over="both"]  { mask-image: linear-gradient(to right, transparent, #000 32px, #000 calc(100% - 32px), transparent); }
.u-tb-vertical .u-tb-list[data-over="end"]   { mask-image: linear-gradient(to bottom, #000 calc(100% - 32px), transparent); }
.u-tb-vertical .u-tb-list[data-over="start"] { mask-image: linear-gradient(to top,    #000 calc(100% - 32px), transparent); }
.u-tb-vertical .u-tb-list[data-over="both"]  { mask-image: linear-gradient(to bottom, transparent, #000 32px, #000 calc(100% - 32px), transparent); }

.u-tb-tab {
  position: relative;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--s-3);
  height: var(--tb-h);
  padding-inline: var(--tb-pad);
  border: 0;
  background: transparent;
  color: var(--fg-muted);
  cursor: pointer;
  white-space: nowrap;
  font: var(--w-medium) var(--tb-fs)/1 var(--font-sans);
  letter-spacing: var(--tr-small);
  transition: color var(--dur-fast) var(--ease-out),
              background-color var(--dur-fast) var(--ease-out);
}
.u-s-sm { --tb-h: var(--control-sm); --tb-pad: var(--s-4); --tb-fs: var(--fs-caption); }
.u-s-md { --tb-h: var(--control-md); --tb-pad: var(--s-5); --tb-fs: var(--fs-small); }
.u-s-lg { --tb-h: var(--control-lg); --tb-pad: var(--s-6); --tb-fs: var(--fs-body); }

.u-tb-tab:hover:not(.u-tb-off) { color: var(--fg); }
.u-tb-tab:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: -2px;
  border-radius: var(--r-sm);
  z-index: 1;
}
/* aria-disabled, not disabled — the focus has to be able to land here. */
.u-tb-off { opacity: .45; cursor: not-allowed; }

/* Underline: the text goes to full strength and the rule carries the
   colour. The rule is a graphic, held to 3:1; the label stays neutral,
   because saying "here" in weight AND in hue is the same thing twice and
   it is the hue that loses. */
.u-tb-underline { gap: var(--s-5); box-shadow: inset 0 -1px 0 var(--border); }
.u-tb-underline .u-tb-tab { padding-inline: 0; }
.u-tb-underline .u-tb-tab::after {
  content: '';
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  height: 2px;
  border-radius: var(--r-full) var(--r-full) 0 0;
  background: transparent;
}
.u-tb-underline .u-tb-on { color: var(--fg); font-weight: var(--w-semibold); }
.u-tb-underline .u-tb-on::after { background: var(--accent); }

.u-tb-vertical .u-tb-underline { box-shadow: inset -1px 0 0 var(--border); }
.u-tb-vertical .u-tb-underline .u-tb-tab {
  justify-content: flex-start;
  padding-inline: 0 var(--s-6);
}
.u-tb-vertical .u-tb-underline .u-tb-tab::after {
  inset: 0 0 0 auto;
  width: 2px;
  height: auto;
  border-radius: var(--r-full) 0 0 var(--r-full);
}

/* Pill: the same "here" as every other one in the system — a neutral
   ground and heavier text, no colour at all. */
.u-tb-pill .u-tb-tab { border-radius: var(--r-control); }
.u-tb-pill .u-tb-tab:hover:not(.u-tb-off) { background: var(--fill-quiet); }
.u-tb-pill .u-tb-on {
  background: var(--fill);
  color: var(--fg);
  font-weight: var(--w-semibold);
}

.u-tb-ico { flex: none; }
.u-tb-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }

/* Quieter than a Badge, because it counts what is behind a tab rather
   than labelling a state. */
.u-tb-badge {
  flex: none;
  min-width: 1.5em;
  padding-inline: var(--s-2);
  border-radius: var(--r-full);
  background: var(--fill);
  color: var(--fg-muted);
  font: var(--w-medium) var(--fs-micro)/1.6 var(--font-sans);
  font-variant-numeric: tabular-nums;
}
.u-tb-on .u-tb-badge { color: var(--fg); }

.u-tb-panel { flex: 1; min-width: 0; padding-block-start: var(--s-6); }
.u-tb-panel:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 2px;
  border-radius: var(--r-sm);
}
.u-tb-vertical .u-tb-panel { padding-block-start: 0; }
</style>
