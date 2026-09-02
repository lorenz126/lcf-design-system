<script setup lang="ts">
import { GripVertical } from 'lucide-vue-next'

/**
 * Kanban — columns of cards you can reorder and move between columns.
 *
 * THE DEPENDENCY DECISION: no package, and no HTML5 drag-and-drop.
 *
 * HTML5 DnD is the tempting answer because it looks free. It is not
 * usable on touch at all, its drag image cannot be styled, and its event
 * model predates everything else on the platform. Pointer Events give
 * mouse, pen and touch one code path, so that is what this uses.
 *
 * THE KEYBOARD IS NOT A FALLBACK PATH. Both input modes call the same
 * placeAt() — the keyboard is not a second, thinner implementation that
 * drifts out of step. That is also why the drag handle and the keyboard
 * grab point are ONE element: a button. One target, two input modes.
 *
 *   Tab             reach a card's handle
 *   Enter / Space   pick up, and drop again
 *   arrows          move the held card between and within columns
 *   Escape          put it back where it came from
 *
 * Two things that look like details and are not:
 *
 * The list DOES NOT REFLOW while you drag. The card stays where it is,
 * dimmed, and a line shows where it will land. Pulling the card out mid
 * drag changes the very geometry the pointer is being measured against,
 * which is how drag implementations end up jittering between two states.
 * The drop line is drawn on the card, not inserted before it, so it costs
 * no layout either.
 *
 * A WIP limit is ADVISORY. It is shown, never enforced: blocking the drop
 * does not reduce work in progress, it just moves the lie off the board.
 */
export interface KanbanCard {
  id: string | number
  title: string
  description?: string
  /** Small trailing note — an assignee, a date, an estimate. */
  meta?: string
  /** Optional badge. The column is not repeated here: a card already
   *  says which column it is in by being in it. */
  tag?: string
  tone?: 'neutral' | 'yellow' | 'green' | 'blue' | 'purple' | 'red' | 'orange'
}

export interface KanbanColumn {
  id: string | number
  label: string
  /** Advisory work-in-progress limit. Shown, never enforced. */
  limit?: number
  cards: KanbanCard[]
}

const props = withDefaults(defineProps<{
  /** Column width. Columns do not grow: a wide column hides its own length. */
  columnWidth?: number
}>(), { columnWidth: 264 })

const model = defineModel<KanbanColumn[]>({ default: () => [] })
const emit = defineEmits<{
  move: [{ card: KanbanCard; from: string | number; to: string | number; index: number }]
}>()

/**
 * The board is read from a local shadow, not from the model directly.
 *
 * When a parent binds v-model, defineModel does NOT apply a write
 * locally — it emits, and the value arrives back as a prop on the
 * parent's next render, a tick later. Reading the model again in the
 * same handler therefore returns the board as it was BEFORE the move.
 * Held arrow keys fire faster than that, so the second keypress would
 * plan its move against a stale board.
 */
const board = ref<KanbanColumn[]>(model.value)
watch(model, v => { board.value = v })

const root = useTemplateRef<HTMLElement>('root')
const uid = useId()
const hintId = `u-kb-hint-${uid}`

/** What a screen reader hears. Every move says something, both input
 *  modes. The region lives on the document rather than in this template:
 *  see useAnnounce for why the same sentence twice has to be cleared
 *  before it can be said again. */
const say = useAnnounce()

/* ---------- the one move ---------- */

function locate(id: string | number) {
  for (const [col, c] of board.value.entries()) {
    const index = c.cards.findIndex(k => k.id === id)
    if (index >= 0) return { col, index }
  }
  return null
}

/**
 * Move a card to `index` in column `col`, where index counts the list
 * WITHOUT the card in it. Returns the landing spot, or null if nothing
 * moved. Every drag, every keypress and every cancel goes through here.
 */
function placeAt(id: string | number, col: number, index: number) {
  const at = locate(id)
  if (!at || !board.value[col]) return null

  const fromId = board.value[at.col]!.id
  const next = board.value.map(c => ({ ...c, cards: [...c.cards] }))
  const [card] = next[at.col]!.cards.splice(at.index, 1)
  const i = Math.max(0, Math.min(index, next[col]!.cards.length))
  if (at.col === col && i === at.index) return null

  const to = next[col]!
  to.cards.splice(i, 0, card!)
  board.value = next
  model.value = next
  emit('move', { card: card!, from: fromId, to: to.id, index: i })
  // Worded from `next`, because the model has not caught up yet.
  return { col, index: i, text: `${card!.title}, ${to.label}, ${i + 1} of ${to.cards.length}` }
}

function describe(id: string | number) {
  const at = locate(id)
  if (!at) return ''
  const c = board.value[at.col]!
  return `${c.cards[at.index]!.title}, ${c.label}, ${at.index + 1} of ${c.cards.length}`
}

function refocus(id: string | number) {
  nextTick(() => {
    root.value?.querySelector<HTMLElement>(`[data-handle="${id}"]`)?.focus()
  })
}

/* ---------- keyboard ---------- */

const grabbed = ref<string | number | null>(null)
let origin: { col: number; index: number } | null = null

function grab(id: string | number) {
  const at = locate(id)
  if (!at) return
  grabbed.value = id
  origin = at
  say(`Picked up ${describe(id)}. Arrow keys move it, Enter drops it, Escape puts it back.`)
}

function release(msg: string, text?: string) {
  const id = grabbed.value
  grabbed.value = null
  origin = null
  if (id !== null) {
    say(`${msg} ${text ?? describe(id)}.`)
    refocus(id)
  }
}

function cancelGrab() {
  const id = grabbed.value
  const back = id !== null && origin ? placeAt(id, origin.col, origin.index) : null
  release('Cancelled.', back?.text)
}

function onHandleKey(e: KeyboardEvent, card: KanbanCard) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (grabbed.value === card.id) {
      release('Dropped.')
    } else {
      /* Focus reached a different card while something was still held,
         so that grab is stale — the blur guard below did not get to run.
         Taking over rather than ignoring the key matters: a grab nobody
         can see leaves a board where no other card answers Enter. */
      if (grabbed.value !== null) cancelGrab()
      grab(card.id)
    }
    return
  }
  if (e.key === 'Escape' && grabbed.value === card.id) {
    e.preventDefault()
    cancelGrab()
    return
  }
  if (grabbed.value !== card.id) return

  const at = locate(card.id)
  if (!at) return
  const step: Record<string, [number, number]> = {
    ArrowUp: [at.col, at.index - 1],
    ArrowDown: [at.col, at.index + 1],
    ArrowLeft: [at.col - 1, at.index],
    ArrowRight: [at.col + 1, at.index]
  }
  const to = step[e.key]
  if (!to) return
  e.preventDefault()
  const moved = placeAt(card.id, to[0], to[1])
  if (moved) {
    say(moved.text)
    refocus(card.id)
  }
}

/**
 * A grab must not survive losing focus, or the board is left in a mode
 * nobody can see. The check is deferred because our own refocus() blurs
 * the handle for a tick before putting focus back on it — by the time a
 * macrotask runs, focus is either back or genuinely gone.
 *
 * This is the first line of defence, not the only one: browsers withhold
 * focus events while the document itself is unfocused, so Enter on
 * another card takes the grab over as well.
 */
function onHandleBlur(id: string | number) {
  setTimeout(() => {
    if (grabbed.value !== id) return
    const el = root.value?.querySelector(`[data-handle="${id}"]`)
    if (document.activeElement !== el) cancelGrab()
  }, 0)
}

/* ---------- pointer ---------- */

const drag = ref<{ id: string | number; x: number; y: number } | null>(null)
const drop = ref<{ col: number; index: number } | null>(null)

let pending: { id: string | number; pointerId: number; sx: number; sy: number } | null = null
/** Snapshotted once at drag start — see the note about reflow above. */
let geo: { col: number; left: number; right: number; mids: number[] }[] = []

const dragCard = computed(() => {
  if (!drag.value) return null
  const at = locate(drag.value.id)
  return at ? board.value[at.col]!.cards[at.index]! : null
})

function snapshot() {
  const el = root.value
  if (!el) return
  geo = [...el.querySelectorAll<HTMLElement>('[data-col]')].map((colEl, col) => {
    const r = colEl.getBoundingClientRect()
    const mids = [...colEl.querySelectorAll<HTMLElement>('[data-card]')].map(c => {
      const cr = c.getBoundingClientRect()
      return cr.top + cr.height / 2
    })
    return { col, left: r.left, right: r.right, mids }
  })
}

/** Which gap the pointer is over. Gap i sits above card i. */
function targetAt(x: number, y: number) {
  if (!geo.length) return null
  const dist = (c: (typeof geo)[number]) => (x < c.left ? c.left - x : x > c.right ? x - c.right : 0)
  const col = geo.find(c => dist(c) === 0) ?? geo.reduce((b, c) => (dist(c) < dist(b) ? c : b))
  const index = col.mids.findIndex(m => y < m)
  return { col: col.col, index: index < 0 ? col.mids.length : index }
}

function onPointerDown(e: PointerEvent, card: KanbanCard) {
  if (e.button !== 0 || grabbed.value !== null) return
  pending = { id: card.id, pointerId: e.pointerId, sx: e.clientX, sy: e.clientY }
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!pending || e.pointerId !== pending.pointerId) return
  if (!drag.value) {
    // A few pixels of slop, so a click on the handle stays a click.
    if (Math.hypot(e.clientX - pending.sx, e.clientY - pending.sy) < 4) return
    snapshot()
    drag.value = { id: pending.id, x: e.clientX, y: e.clientY }
    window.addEventListener('keydown', onDragKey, true)
  }
  drag.value.x = e.clientX
  drag.value.y = e.clientY
  drop.value = targetAt(e.clientX, e.clientY)
}

function onPointerUp(e: PointerEvent) {
  if (!pending || e.pointerId !== pending.pointerId) return
  const id = pending.id
  const target = drag.value ? drop.value : null
  endDrag()
  if (!target) return

  // The gap index counts the card itself; placeAt() does not.
  const at = locate(id)
  if (!at) return
  const index = target.col === at.col && at.index < target.index ? target.index - 1 : target.index
  const moved = placeAt(id, target.col, index)
  if (moved) say(`Moved ${moved.text}.`)
}

function endDrag() {
  pending = null
  drag.value = null
  drop.value = null
  geo = []
  window.removeEventListener('keydown', onDragKey, true)
}

function onDragKey(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  e.preventDefault()
  endDrag()
}

onBeforeUnmount(endDrag)

/* ---------- rendering helpers ---------- */

/** The drop line is painted on a card, not inserted before it. */
function lineBefore(col: number, i: number) {
  return drop.value?.col === col && drop.value.index === i
}
function lineAfterLast(col: number, count: number) {
  return drop.value?.col === col && drop.value.index === count && count > 0
}
</script>

<template>
  <div ref="root" class="u-kb" :style="{ '--kb-col': `${props.columnWidth}px` }">
    <p :id="hintId" class="u-kb-sr">
      Press Enter or Space to pick up the card, the arrow keys to move it between and
      within columns, Enter to drop it, Escape to put it back.
    </p>

    <div
      v-for="(col, ci) in board"
      :key="col.id"
      class="u-kb-col"
      :class="{ 'u-kb-col-target': drop?.col === ci }"
    >
      <div class="u-kb-head">
        <span class="u-kb-label">{{ col.label }}</span>
        <span
          class="u-kb-count"
          :class="{ 'u-kb-over': col.limit !== undefined && col.cards.length > col.limit }"
        >
          {{ col.cards.length }}<template v-if="col.limit !== undefined">/{{ col.limit }}</template>
        </span>
      </div>

      <div class="u-kb-body" data-col role="list" :aria-label="col.label">
        <div
          v-for="(card, i) in col.cards"
          :key="card.id"
          data-card
          role="listitem"
          class="u-kb-card"
          :class="{
            'u-kb-ghost': drag?.id === card.id,
            'u-kb-held': grabbed === card.id,
            'u-kb-line-before': lineBefore(ci, i),
            'u-kb-line-after': i === col.cards.length - 1 && lineAfterLast(ci, col.cards.length)
          }"
        >
          <button
            type="button"
            class="u-kb-handle"
            :data-handle="card.id"
            :aria-label="`Move ${card.title}`"
            :aria-describedby="hintId"
            :aria-pressed="grabbed === card.id"
            @keydown="onHandleKey($event, card)"
            @blur="onHandleBlur(card.id)"
            @pointerdown="onPointerDown($event, card)"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="endDrag"
          >
            <UiIcon :is="GripVertical" size="sm" />
          </button>

          <div class="u-kb-main">
            <slot name="card" :card="card" :column="col">
              <span class="u-kb-title">{{ card.title }}</span>
              <span v-if="card.description" class="u-kb-desc">{{ card.description }}</span>
              <span v-if="card.meta || card.tag" class="u-kb-foot">
                <UiBadge v-if="card.tag" :tone="card.tone ?? 'neutral'" size="sm" dot>{{ card.tag }}</UiBadge>
                <span v-if="card.meta" class="u-kb-meta">{{ card.meta }}</span>
              </span>
            </slot>
          </div>
        </div>

        <p
          v-if="!col.cards.length"
          class="u-kb-empty"
          :class="{ 'u-kb-empty-on': drop?.col === ci }"
        >
          Empty
        </p>
      </div>
    </div>

    <!-- The preview carries the title, not a copy of the card. You know
         what you picked up; what you need to see is where it lands. -->
    <Teleport to="body">
      <div
        v-if="drag && dragCard"
        class="u-kb-fly"
        aria-hidden="true"
        :style="{ transform: `translate(${drag.x}px, ${drag.y}px)` }"
      >{{ dragCard.title }}</div>
    </Teleport>
  </div>
</template>

<style scoped>
.u-kb {
  display: flex;
  gap: var(--s-5);
  align-items: flex-start;
  overflow-x: auto;
  padding-bottom: var(--s-3);
}

.u-kb-col {
  flex: none;
  width: var(--kb-col);
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  padding: var(--s-5);
  border-radius: var(--r-lg);
  background: var(--bg-sunken);
  border: var(--border-width) solid transparent;
  transition: border-color var(--dur-fast) var(--ease-out);
}
.u-kb-col-target { border-color: var(--accent); }

.u-kb-head { display: flex; align-items: baseline; gap: var(--s-4); }
.u-kb-label {
  font: var(--w-semibold) var(--fs-small)/1 var(--font-sans);
  letter-spacing: var(--tr-small);
  margin-inline-end: auto;
}
.u-kb-count {
  font: var(--w-medium) var(--fs-micro)/1 var(--font-sans);
  color: var(--fg-subtle);
  font-variant-numeric: tabular-nums;
}
.u-kb-over { color: var(--danger-text); }

.u-kb-body {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  min-height: 40px;
}

.u-kb-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--s-2);
  padding: var(--s-5);
  border-radius: var(--r-md);
  background: var(--bg-raised);
  border: var(--border-width) solid var(--border);
}
.u-kb-ghost { opacity: .4; }
.u-kb-held { border-color: var(--accent); box-shadow: var(--shadow-2); }

/* Drawn ON the card rather than inserted before it, so the geometry the
   pointer is measured against never moves during a drag. */
.u-kb-line-before::before,
.u-kb-line-after::after {
  content: '';
  position: absolute;
  inset-inline: -1px;
  height: 2px;
  border-radius: var(--r-full);
  background: var(--accent);
}
.u-kb-line-before::before { top: calc(var(--s-4) / -2 - 1px); }
.u-kb-line-after::after { bottom: calc(var(--s-4) / -2 - 1px); }

.u-kb-handle {
  flex: none;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  margin-inline-start: calc(var(--s-2) * -1);
  padding: 0;
  border: 0;
  border-radius: var(--r-xs);
  background: transparent;
  color: var(--fg-subtle);
  cursor: grab;
  /* The handle owns the gesture, so it opts out of browser panning. The
     card body keeps it, which is what lets a column scroll on touch. */
  touch-action: none;
}
.u-kb-handle:hover { background: var(--fill-quiet); color: var(--fg-muted); }
.u-kb-handle:active { cursor: grabbing; }
.u-kb-handle:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 1px;
}

.u-kb-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--s-2); }
.u-kb-title {
  font: var(--w-medium) var(--fs-small)/1.35 var(--font-sans);
  letter-spacing: var(--tr-small);
}
.u-kb-desc {
  font: var(--w-regular) var(--fs-caption)/1.4 var(--font-sans);
  color: var(--fg-muted);
}
.u-kb-foot { display: flex; align-items: center; gap: var(--s-4); margin-top: var(--s-1); }
.u-kb-meta {
  font: var(--w-regular) var(--fs-micro)/1 var(--font-sans);
  color: var(--fg-subtle);
  margin-inline-start: auto;
}

.u-kb-empty {
  margin: 0;
  padding: var(--s-6) 0;
  text-align: center;
  border: 1px dashed var(--border-strong);
  border-radius: var(--r-md);
  color: var(--fg-subtle);
  font: var(--w-regular) var(--fs-caption)/1 var(--font-sans);
}
.u-kb-empty-on { border-color: var(--accent); color: var(--accent-text); }

.u-kb-fly {
  position: fixed;
  inset-block-start: 0;
  inset-inline-start: 0;
  z-index: var(--z-overlay);
  pointer-events: none;
  max-width: 240px;
  margin: 8px 0 0 12px;
  padding: var(--s-3) var(--s-5);
  border-radius: var(--r-md);
  background: var(--bg-raised);
  border: var(--border-width) solid var(--border);
  box-shadow: var(--shadow-3);
  color: var(--fg);
  font: var(--w-medium) var(--fs-caption)/1.3 var(--font-sans);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.u-kb-sr {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
