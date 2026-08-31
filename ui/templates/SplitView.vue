<script setup lang="ts">
/**
 * SplitView — a list beside its detail. Slots only.
 *
 * The two panes scroll independently, which is the entire point: picking
 * the eleventh item and reading it should not lose your place in the
 * list.
 *
 * Below --bp-md they cannot sit side by side, so the detail covers the
 * list rather than squeezing next to it. `hasDetail` tells the template
 * which one to show, and stays the caller's decision because only the
 * caller knows whether anything is selected.
 */
withDefaults(defineProps<{
  listWidth?: string
  /** On narrow screens, show the detail instead of the list. */
  hasDetail?: boolean
}>(), { listWidth: '320px' })
</script>

<template>
  <div class="u-split" :style="{ '--lw': listWidth }" :class="{ 'u-split-detail': hasDetail }">
    <section class="u-split-list"><slot name="list" /></section>
    <section class="u-split-detail-pane">
      <slot name="detail">
        <p class="u-split-empty"><slot name="empty">Nothing selected.</slot></p>
      </slot>
    </section>
  </div>
</template>

<style scoped>
.u-split {
  display: grid;
  grid-template-columns: var(--lw) minmax(0, 1fr);
  min-height: 0;
  height: 100%;
}
.u-split-list {
  border-inline-end: var(--border-width) solid var(--border);
  overflow-y: auto; min-height: 0;
}
.u-split-detail-pane { overflow-y: auto; min-height: 0; }

.u-split-empty {
  display: grid; place-items: center; height: 100%; margin: 0;
  color: var(--fg-muted);
  font: var(--w-regular) var(--fs-small)/1.4 var(--font-sans);
}

@media (max-width: 860px) {
  .u-split { grid-template-columns: minmax(0, 1fr); }
  .u-split-list { border-inline-end: 0; }
  /* One at a time. Two panes on a phone is two half-useless panes. */
  .u-split-detail-pane { display: none; }
  .u-split-detail .u-split-list { display: none; }
  .u-split-detail .u-split-detail-pane { display: block; }
}
</style>
