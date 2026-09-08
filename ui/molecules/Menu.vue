<script setup lang="ts">
import type { Component } from 'vue'
import { Check, ChevronLeft, ChevronRight } from 'lucide-vue-next'

/**
 * Menu — a list of commands hanging off a trigger.
 *
 * THE DEPENDENCY DECISION: still none, and this was the case flagged in
 * the plan as the one where a headless library might earn its place.
 *
 * It would have, if this were the first overlay. What a menu needs beyond
 * a plain popover is positioning with collision handling, light dismiss,
 * a single top layer with only one menu open at a time, roving focus and
 * typeahead. Phase 4 already paid for the first three: popover="auto"
 * gives dismissal and the top layer, useAnchored gives the placement.
 * What is left is roving focus and typeahead, which is the code below —
 * and a dependency that solves two of five problems, while bringing its
 * own positioning engine we would then have two of, is not a bargain.
 *
 * Built ON Popover rather than beside it. If the framework's own overlay
 * cannot carry a menu, that is a gap in Popover — which is why Popover
 * grew `align` and `padding` rather than being forked.
 *
 *   ArrowDown / Up   next / previous, wrapping, skipping disabled
 *   Home / End       first / last
 *   letters          typeahead, repeated letters cycle
 *   ArrowRight/Left  into a group, and back out of it
 *   Tab              close, and carry on out of the menu
 *   Escape           back one level, or close (see below)
 *
 * GROUPS DRILL DOWN, they do not fly out. A row with `children` replaces
 * the panel's contents with its children and a way back, rather than
 * opening a second panel beside the first.
 *
 * The flyout is the conventional answer and it costs more than it looks:
 * a second anchored layer, its own collision handling on the side where
 * there is least room, the diagonal-travel problem when the pointer
 * crosses other rows on its way, and no sensible behaviour at all at
 * 390px. The drill-down has none of that — it is the panel that is
 * already positioned, and every key below keeps working because the rows
 * are the rows. What it gives up is seeing both levels at once, which
 * matters for a two-item group and not for the twenty-item one that made
 * the feature necessary.
 *
 * Enter and Space are NOT handled here. Every row is a real <button>, so
 * the browser already activates it — the same rule that made the trigger
 * use popovertarget instead of a click handler.
 */
export interface MenuItem {
  id: string | number
  label: string
  icon?: Component
  /** Display only. A menu cannot bind a shortcut; the app owns that. */
  shortcut?: string
  disabled?: boolean
  /** Destructive. Colours the row, and nothing else — it does not confirm. */
  danger?: boolean
  /** Present makes the row a checkbox item. The menu emits; you own the
   *  state, because a menu that remembers is a menu with two sources of
   *  truth. */
  checked?: boolean
  /** Draws a rule ABOVE this row. Modelled as a property of the boundary
   *  rather than as an entry in the list, so a consumer never has to
   *  filter separators out of their own data. */
  divider?: boolean
  /** Makes the row a gate into a level of its own. Selecting it does NOT
   *  emit — it walks in, and `select` fires for the leaf that is finally
   *  chosen. An empty array is no gate; the row stays a plain command. */
  children?: MenuItem[]
}

/** The id of the row that walks back out. Reserved: a consumer item with
 *  this id would be indistinguishable from it. */
const BACK = '__ui-menu-back__'

const props = withDefaults(defineProps<{
  items: MenuItem[]
  placement?: Placement
  align?: Align
  /** Accessible name for the menu itself, e.g. "Row actions". */
  label?: string
}>(), { placement: 'bottom', align: 'start' })

const emit = defineEmits<{ select: [MenuItem] }>()

const open = ref(false)
const root = useTemplateRef<HTMLElement>('root')
const menu = useTemplateRef<HTMLElement>('menu')

/** The row the keyboard is on. Index into items, disabled ones skipped. */
const active = ref(-1)
/** Which end to land on when it opens — ArrowUp opens onto the last row. */
let landOn: 'first' | 'last' = 'first'

/**
 * WHERE THE PANEL STANDS. Empty is the top level; each entry is a gate
 * that was walked into. An array rather than a single item, so depth is
 * free — the component never has to know how deep a consumer nests.
 */
const path = ref<MenuItem[]>([])

/** The rows on screen. Everything below reads THIS, never `props.items`:
 *  roving focus, typeahead and the dividers are about what is shown. */
const rows = computed<MenuItem[]>(() => {
  const here = path.value.at(-1)
  if (!here) return props.items
  const kids = here.children ?? []
  return [
    { id: BACK, label: here.label, icon: ChevronLeft },
    // The first child carries the rule, because a divider is a property
    // of the boundary — so the way back is separated from what is under it.
    ...kids.map((k, i) => (i === 0 ? { ...k, divider: true } : k)),
  ]
})

const hasChecks = computed(() => rows.value.some(i => i.checked !== undefined))

/* ---------- moving ---------- */

/** The first enabled row from `start`, walking in `dir` and wrapping. */
function enabledFrom(start: number, dir: 1 | -1) {
  const n = rows.value.length
  if (!n) return -1
  for (let i = 0; i < n; i++) {
    const k = (((start + dir * i) % n) + n) % n
    if (!rows.value[k]!.disabled) return k
  }
  return -1
}

function focusAt(i: number) {
  if (i < 0) return
  active.value = i
  menu.value?.querySelector<HTMLElement>(`[data-mi="${i}"]`)?.focus()
}

/* `:not(.u-menu-item)` because a gate row also announces itself as
   having a menu, and it lives inside this same root. */
const triggerEl = () =>
  root.value?.querySelector<HTMLElement>('[aria-haspopup="menu"]:not(.u-menu-item)')

/* ---------- typeahead ---------- */

let buf = ''
let bufTimer: ReturnType<typeof setTimeout> | undefined

function typeahead(ch: string) {
  buf += ch.toLowerCase()
  clearTimeout(bufTimer)
  bufTimer = setTimeout(() => { buf = '' }, 500)

  /* "sss" means "cycle through things starting with s", not "find a row
     called sss" — which is how anyone typing an initial repeatedly
     expects it to behave. */
  const q = [...buf].every(c => c === buf[0]) ? buf[0]! : buf
  const n = rows.value.length
  for (let i = 1; i <= n; i++) {
    const k = (active.value + i + n) % n
    const it = rows.value[k]!
    if (!it.disabled && it.label.toLowerCase().startsWith(q)) return focusAt(k)
  }
}

/* ---------- keys ---------- */

function onMenuKey(e: KeyboardEvent) {
  const n = rows.value.length
  if (e.key === 'Tab') {
    // Close first, then let the Tab run: focus is already back on the
    // trigger, so the browser computes the next stop from there.
    open.value = false
    triggerEl()?.focus()
    return
  }
  const jump: Record<string, () => number> = {
    ArrowDown: () => enabledFrom(active.value + 1, 1),
    ArrowUp: () => enabledFrom(active.value - 1, -1),
    Home: () => enabledFrom(0, 1),
    End: () => enabledFrom(n - 1, -1)
  }
  if (jump[e.key]) {
    e.preventDefault()
    focusAt(jump[e.key]!())
    return
  }
  const here = rows.value[active.value]
  if (e.key === 'ArrowRight' && here?.children?.length) {
    e.preventDefault()
    return walkIn(here)
  }
  if ((e.key === 'ArrowLeft' || e.key === 'Escape') && path.value.length) {
    /* Escape closes the menu — but not while it is standing inside a
       group. There it means "back", and only the second press closes.
       The popover's own light dismiss would swallow it, so this has to
       stop the event, not merely preventDefault. */
    e.preventDefault()
    e.stopPropagation()
    return walkOut()
  }
  if (e.key.length === 1 && e.key !== ' ' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    // Space is left alone: it belongs to the button underneath.
    e.preventDefault()
    typeahead(e.key)
  }
}

function onTriggerKey(e: KeyboardEvent) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  e.preventDefault()
  landOn = e.key === 'ArrowDown' ? 'first' : 'last'
  // Not the click race: a keydown produces no click for light dismiss to
  // catch, so opening from here is safe.
  open.value = true
}

/** One level in. Focus lands on the first child, so the keyboard is where
 *  the eye is. */
function walkIn(item: MenuItem) {
  path.value = [...path.value, item]
  nextTick(() => focusAt(enabledFrom(1, 1)))
}

/** One level out, and back onto the gate that was walked through. */
function walkOut() {
  const from = path.value.at(-1)
  path.value = path.value.slice(0, -1)
  nextTick(() => focusAt(Math.max(0, rows.value.findIndex(r => r.id === from?.id))))
}

function choose(item: MenuItem) {
  if (item.disabled) return
  if (item.id === BACK) return walkOut()
  // A gate is not a command: it emits nothing, and the menu stays open.
  if (item.children?.length) return walkIn(item)
  emit('select', item)
  open.value = false
  triggerEl()?.focus()
}

watch(open, v => {
  if (!v) {
    active.value = -1
    buf = ''
    landOn = 'first'
    // A menu reopens at the top. Remembering where it stood would be a
    // second source of truth about a thing nobody asked it to remember.
    path.value = []
    return
  }
  nextTick(() => {
    focusAt(landOn === 'first' ? enabledFrom(0, 1) : enabledFrom(rows.value.length - 1, -1))
  })
})
</script>

<template>
  <span ref="root" class="u-menu-root">
    <UiPopover v-model:open="open" :placement="placement" :align="align" padding="none">
      <template #trigger="{ props: pop }">
        <slot
          name="trigger"
          :open="open"
          :props="{ ...pop, 'aria-haspopup': 'menu' as const, onKeydown: onTriggerKey }"
        />
      </template>

      <div
        ref="menu"
        class="u-menu"
        role="menu"
        :aria-label="label"
        @keydown="onMenuKey"
      >
        <template v-for="(item, i) in rows" :key="item.id">
          <UiDivider v-if="item.divider" spacing="sm" inset />
          <button
            type="button"
            class="u-menu-item"
            :class="{ 'u-menu-danger': item.danger, 'u-menu-inset': hasChecks }"
            :data-mi="i"
            :role="item.checked === undefined ? 'menuitem' : 'menuitemcheckbox'"
            :aria-checked="item.checked === undefined ? undefined : item.checked"
            :aria-haspopup="item.children?.length ? 'menu' : undefined"
            :aria-expanded="item.children?.length ? false : undefined"
            :disabled="item.disabled"
            tabindex="-1"
            @click="choose(item)"
          >
            <span v-if="hasChecks" class="u-menu-tick">
              <UiIcon v-if="item.checked" :is="Check" size="sm" />
            </span>
            <UiIcon v-if="item.icon" :is="item.icon" size="sm" class="u-menu-icon" />
            <span class="u-menu-label">{{ item.label }}</span>
            <span v-if="item.shortcut" class="u-menu-key">{{ item.shortcut }}</span>
            <UiIcon v-if="item.children?.length" :is="ChevronRight" size="sm" class="u-menu-into" />
          </button>
        </template>
      </div>
    </UiPopover>
  </span>
</template>

<style scoped>
.u-menu-root { display: contents; }

.u-menu {
  display: flex;
  flex-direction: column;
  min-width: 180px;
  max-width: 280px;
  padding: var(--s-2);
}

.u-menu-item {
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
  font: var(--w-regular) var(--fs-small)/1.3 var(--font-sans);
  letter-spacing: var(--tr-small);
}
.u-menu-item:hover:not(:disabled) { background: var(--fill-quiet); }
/* :focus, not :focus-visible. Inside a menu the focused row IS the
   keyboard cursor however you got there — including the row focused
   programmatically when a mouse opened the menu, which :focus-visible
   would leave unmarked until the first arrow key.
   And it is the ring, not a tint: a 4% background is not a focus
   indicator, and this system has one focus colour on every control. */
.u-menu-item:focus {
  background: var(--fill-quiet);
  outline: var(--focus-width) solid var(--focus-color);
  /* Inward, so the ring is not clipped by the panel's own padding. */
  outline-offset: -2px;
}
.u-menu-item:disabled { color: var(--fg-subtle); cursor: not-allowed; }

/* Red text, neutral highlight. Washing the row in --red-fill as well
   was the obvious move and it measured 4.34:1 in dark mode — under AA.
   The tint recipe is calibrated against the PAGE, and a menu panel is a
   raised surface, which costs it about half a point. The row already
   says destructive by being red; the second red was decoration paid for
   in legibility. */
.u-menu-danger { color: var(--red-text); }

.u-menu-icon { flex: none; color: var(--fg-muted); }
.u-menu-into { flex: none; color: var(--fg-subtle); }
.u-menu-danger .u-menu-icon { color: inherit; }
.u-menu-label { flex: 1; min-width: 0; }
.u-menu-key {
  flex: none;
  color: var(--fg-subtle);
  font: var(--w-regular) var(--fs-micro)/1 var(--font-sans);
  font-variant-numeric: tabular-nums;
}

/* Every row indents when ANY row can be checked, so the labels stay in
   one column instead of jumping as things are ticked. */
.u-menu-tick {
  flex: none;
  display: grid;
  place-items: center;
  width: var(--icon-sm);
  color: var(--accent-text);
}


</style>
