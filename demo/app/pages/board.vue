<script setup lang="ts">
import type { KanbanColumn } from '../../../ui/organisms/Kanban.vue'
import { STATUS, priorityTone, type Status } from '~/data/issues'

useHead({ title: 'Board — Tracker' })

const { issues, move } = useIssues()

const moved = ref<string>('')

/**
 * The board is a VIEW of the issues, not a copy of them.
 *
 * A writable computed rather than a ref seeded from the list: a copy
 * would drift the moment anything else changed an issue, and moving a
 * card here would stop showing up in the table. Reading builds the
 * columns from status; writing reads the columns back and sets it.
 */
const columns = computed<KanbanColumn[]>({
  get: () =>
    STATUS.map(s => ({
      id: s.value,
      label: s.label,
      limit: s.value === 'doing' ? 4 : undefined,
      cards: issues.value
        .filter(i => i.status === s.value)
        .map(i => ({
          id: i.id,
          title: i.title,
          meta: i.key,
          tag: i.label,
          tone: priorityTone(i.priority)
        }))
    })),
  set: next => {
    for (const col of next) {
      for (const card of col.cards) move(Number(card.id), col.id as Status)
    }
  }
})

const total = computed(() => issues.value.length)
</script>

<template>
  <div>
    <header class="head">
      <div>
        <h1 class="t-title">Board</h1>
        <p class="t-small dim">{{ total }} issues across four columns</p>
      </div>
    </header>

    <UiKanban v-model="columns" @move="moved = `${$event.card.title} → ${$event.to}`" />

    <p class="t-caption hint">
      Tab to a card’s handle and press <strong>Enter</strong>: the arrows move it
      between and within columns, Enter drops it, Escape puts it back. Whichever way it
      moves, the change is the issue’s status —
      <NuxtLink to="/">the table</NuxtLink> shows the same thing a moment later, because
      this board is a view of the issues rather than a copy of them.
    </p>
    <p v-if="moved" class="t-caption hint">Last move: <strong>{{ moved }}</strong></p>
  </div>
</template>

<style scoped>
.head { margin-bottom: var(--s-8); }
.head h1 { margin: 0 0 2px; }
.dim { color: var(--fg-muted); }
.hint { color: var(--fg-muted); margin: var(--s-7) 0 0; max-width: 66ch; line-height: 1.6; }
</style>
