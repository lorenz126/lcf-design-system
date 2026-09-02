<script setup lang="ts">
import type { Component } from 'vue'

/**
 * EmptyState — the space where the content would be, saying why it is
 * not there.
 *
 * "No rows." is not an empty state, it is a status line. The difference
 * matters because empty is usually the FIRST thing a person sees: a new
 * board, a fresh filter, an inbox that has just been cleared. It is the
 * one moment where an interface can say what the thing is for, and a
 * greyed-out sentence in the middle of a table spends it saying nothing.
 *
 * Which is why the action is a slot rather than a prop. The useful empty
 * state ends in a way out — create the first one, clear the filter, go
 * back — and what that way out is belongs to the application.
 *
 * Two sizes because the same block has two homes: `sm` in the body of a
 * list or a table, where it must not out-shout the rows that will
 * replace it, and `md` for a region or a page that is empty in its own
 * right.
 */
withDefaults(defineProps<{
  title: string
  description?: string
  icon?: Component
  size?: 'sm' | 'md'
}>(), { size: 'md' })
</script>

<template>
  <div class="u-es" :class="`u-es-${size}`">
    <span v-if="icon || $slots.icon" class="u-es-mark">
      <slot name="icon"><UiIcon :is="icon!" :size="size === 'sm' ? 'md' : 'lg'" /></slot>
    </span>

    <p class="u-es-title">{{ title }}</p>
    <p v-if="description" class="u-es-desc">{{ description }}</p>

    <div v-if="$slots.default" class="u-es-act"><slot /></div>
  </div>
</template>

<style scoped>
.u-es {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: var(--fg-muted);
}
.u-es-sm { padding: var(--s-10) var(--s-6); gap: var(--s-3); }
.u-es-md { padding: var(--s-12) var(--s-8); gap: var(--s-4); }

/* A quiet disc rather than a bare glyph: an icon floating alone above
   text reads as an error mark. */
.u-es-mark {
  display: grid;
  place-items: center;
  margin-block-end: var(--s-2);
  border-radius: var(--r-full);
  background: var(--fill-quiet);
  color: var(--fg-subtle);
}
.u-es-sm .u-es-mark { width: 36px; height: 36px; }
.u-es-md .u-es-mark { width: 48px; height: 48px; }

.u-es-title {
  margin: 0;
  color: var(--fg);
  letter-spacing: var(--tr-small);
}
.u-es-sm .u-es-title { font: var(--w-medium) var(--fs-small)/1.4 var(--font-sans); }
.u-es-md .u-es-title { font: var(--w-semibold) var(--fs-lead)/1.35 var(--font-sans); }

.u-es-desc {
  margin: 0;
  /* Narrow on purpose. A centred paragraph that runs the full width of a
     table is unreadable — every line starts in a different place. */
  max-width: 44ch;
  font: var(--w-regular) var(--fs-small)/1.5 var(--font-sans);
}

.u-es-act { display: flex; gap: var(--s-4); margin-block-start: var(--s-3); }
</style>
