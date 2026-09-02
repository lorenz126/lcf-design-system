<script setup lang="ts">
import type { KanbanColumn } from '../../../../ui/organisms/Kanban.vue'

useHead({ title: 'Kanban — Design Framework' })

const columns = ref<KanbanColumn[]>([
  {
    id: 'todo',
    label: 'Todo',
    cards: [
      { id: 'a', title: 'Tokenise the chart palette', description: 'Three series is a measured ceiling, not a preference.', tone: 'blue', tag: 'Tokens', meta: 'LF' },
      { id: 'b', title: 'Contrast test for the focus ring', meta: 'LF' },
      { id: 'c', title: 'Document the border-or-shadow rule', description: 'Card raised the question; it deserves a written answer.' }
    ]
  },
  {
    id: 'doing',
    label: 'In progress',
    limit: 2,
    cards: [
      { id: 'd', title: 'Kanban keyboard model', description: 'Both input modes call the same move.', tone: 'purple', tag: 'Organism', meta: 'LF' },
      { id: 'e', title: 'Diagram layout', tone: 'orange', tag: 'Organism' }
    ]
  },
  { id: 'review', label: 'Review', limit: 3, cards: [
    { id: 'f', title: 'Calendar', description: 'Arrow keys, no date library.', tone: 'green', tag: 'Shipped', meta: 'LF' }
  ] },
  { id: 'done', label: 'Done', cards: [] }
])

const log = ref<string[]>([])
function onMove(e: { card: { title: string }; from: string | number; to: string | number; index: number }) {
  log.value = [`${e.card.title} → ${e.to} at ${e.index + 1}`, ...log.value].slice(0, 6)
}
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">The keyboard is not a fallback path.</p>
      <p class="t-body body">
        Drag-and-drop that only works with a mouse excludes keyboard users from the
        board entirely — so both input modes call the <strong>same</strong> move
        function, and the drag handle and the keyboard grab point are one button.
        One target, two input modes, no second implementation to drift out of step.
      </p>
      <p class="t-caption warn">
        No package, and no HTML5 drag-and-drop: it is unusable on touch, its drag image
        cannot be styled, and its event model predates everything else on the platform.
        Pointer Events cover mouse, pen and touch in one path.
      </p>
    </div>

    <section>
      <div class="sec-label">Board</div>
      <UiKanban v-model="columns" @move="onMove" />
      <p class="t-caption hint">
        Tab to a handle, then leave the mouse alone. <strong>Enter</strong> picks the card
        up, the arrows move it between and within columns, <strong>Enter</strong> drops it
        and <strong>Escape</strong> puts it back. Every move is announced; the counter on
        “In progress” is over its limit on purpose.
      </p>
    </section>

    <section>
      <div class="sec-label">What the board emits</div>
      <div class="row">
        <UiCard>
          <ul class="log">
            <li v-if="!log.length" class="t-caption empty">Move a card.</li>
            <li v-for="(l, i) in log" :key="i" class="t-caption">{{ l }}</li>
          </ul>
        </UiCard>
        <UiProse size="sm" class="notes">
          <p>
            The list does not reflow while you drag. The card stays where it is, dimmed,
            and a line shows where it will land. Pulling the card out mid-drag would change
            the very geometry the pointer is measured against — that is how drag
            implementations end up flickering between two states.
          </p>
          <p>
            The drop line is painted <em>on</em> a card rather than inserted before it, so
            it costs no layout either.
          </p>
          <p>
            The limit on a column is <strong>advisory</strong>. It is shown and never
            enforced: refusing the drop does not reduce work in progress, it just moves the
            lie off the board.
          </p>
        </UiProse>
      </div>
    </section>
  </div>
</template>

<style scoped>
.warn { margin: 0; color: var(--ink-2); max-width: 68ch; line-height: 1.6; }
.row { display: flex; gap: var(--s-9); align-items: flex-start; flex-wrap: wrap; }
.notes { flex: 1; min-width: 260px; max-width: 42ch; }
.log { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; min-width: 240px; }
.empty { color: var(--ink-2); }
</style>
