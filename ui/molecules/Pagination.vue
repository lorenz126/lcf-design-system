<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

/**
 * Pagination — moving between pages of one list.
 *
 * BUTTONS, NOT LINKS, and that is a real limit rather than an oversight.
 * A pagination whose pages are URLs is better — it can be shared,
 * reopened and crawled — but it needs the app to say what a page's
 * address is, and half of the places this belongs (a table inside a
 * dialog, a filtered panel) have no address to give. So it moves a
 * number and tells you; an application with routable pages should render
 * its own anchors around the same shape.
 *
 * THE WINDOW IS A FIXED WIDTH, which is the whole difficulty. If the run
 * of numbers grows and shrinks as you move through it, the button under
 * your pointer changes meaning between clicks. Ends, ellipses and the
 * current neighbourhood always occupy the same number of slots, so page
 * 7 sits where page 6 was.
 *
 * An ellipsis is not a control. It is a gap in a sequence, so it is
 * text — a button that jumps somewhere unstated is worse than no button.
 */
const props = withDefaults(defineProps<{
  /** Total number of pages, not of items. */
  total: number
  /** Pages either side of the current one. */
  siblings?: number
  size?: 'sm' | 'md'
  /** Accessible name, for a page with more than one of these. */
  label?: string
}>(), { siblings: 1, size: 'md', label: 'Pagination' })

const page = defineModel<number>({ default: 1 })
const emit = defineEmits<{ change: [number] }>()

const clamp = (n: number) => Math.min(Math.max(1, n), Math.max(1, props.total))

function go(n: number) {
  const next = clamp(n)
  if (next === page.value) return
  page.value = next
  emit('change', next)
}

/**
 * Ends, the current neighbourhood, and ellipses in between — always the
 * same length. `slots` is 2 ends + 2 ellipses + the window; when the
 * total is small enough that the ellipses would hide fewer pages than
 * they cost, every page is listed instead.
 */
const pages = computed<(number | 'gap')[]>(() => {
  const total = Math.max(1, props.total)
  const span = props.siblings * 2 + 1
  const slots = span + 4
  if (total <= slots) return Array.from({ length: total }, (_, i) => i + 1)

  const current = clamp(page.value)
  const start = Math.max(2, Math.min(current - props.siblings, total - span - 1))
  const end = Math.min(total - 1, Math.max(current + props.siblings, span + 2))

  const out: (number | 'gap')[] = [1]
  if (start > 2) out.push('gap')
  for (let i = start; i <= end; i++) out.push(i)
  if (end < total - 1) out.push('gap')
  out.push(total)
  return out
})
</script>

<template>
  <nav class="u-pg" :class="`u-s-${size}`" :aria-label="label">
    <UiButton
      variant="plain"
      tone="neutral"
      :size="size"
      icon-only
      aria-label="Previous page"
      :disabled="page <= 1"
      @click="go(page - 1)"
    ><UiIcon :is="ChevronLeft" size="sm" /></UiButton>

    <template v-for="(p, i) in pages" :key="p === 'gap' ? `gap-${i}` : p">
      <span v-if="p === 'gap'" class="u-pg-gap" aria-hidden="true">…</span>
      <button
        v-else
        type="button"
        class="u-pg-n"
        :class="{ 'u-pg-on': p === page }"
        :aria-label="`Page ${p}`"
        :aria-current="p === page ? 'page' : undefined"
        @click="go(p)"
      >{{ p }}</button>
    </template>

    <UiButton
      variant="plain"
      tone="neutral"
      :size="size"
      icon-only
      aria-label="Next page"
      :disabled="page >= total"
      @click="go(page + 1)"
    ><UiIcon :is="ChevronRight" size="sm" /></UiButton>
  </nav>
</template>

<style scoped>
.u-pg {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
}
.u-s-sm { --h: var(--control-sm); --fs: var(--fs-caption); }
.u-s-md { --h: var(--control-md); --fs: var(--fs-small); }

.u-pg-n {
  min-width: var(--h);
  height: var(--h);
  padding-inline: var(--s-2);
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--fg-muted);
  cursor: pointer;
  /* Tabular, so 8 and 88 and 888 do not shuffle the row as you page. */
  font: var(--w-medium) var(--fs)/1 var(--font-sans);
  font-variant-numeric: tabular-nums;
}
.u-pg-n:hover { background: var(--fill-quiet); color: var(--fg); }
.u-pg-n:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 1px;
}
/* The same recipe the sidebar uses for the row you are on: a neutral
   ground and heavier text, never a colour. */
.u-pg-on {
  background: var(--fill);
  color: var(--fg);
  font-weight: var(--w-semibold);
}

.u-pg-gap {
  min-width: var(--h);
  text-align: center;
  color: var(--fg-subtle);
  font: var(--w-regular) var(--fs)/1 var(--font-sans);
  user-select: none;
}
</style>
