<script setup lang="ts">
/**
 * DocLayout — an article with an aside. Slots only.
 *
 * The aside is declared AFTER the article in the DOM and placed left or
 * right by grid, so a keyboard or screen reader reaches the content
 * before the contents. A table of contents read out before the article
 * is a list of links to nothing yet.
 */
withDefaults(defineProps<{
  asideWidth?: string
  /** Which side the aside sits on visually; DOM order is unchanged. */
  asideSide?: 'start' | 'end'
}>(), { asideWidth: '210px', asideSide: 'end' })
</script>

<template>
  <div
    class="u-doc"
    :class="`u-doc-${asideSide}`"
    :style="{ '--aw': asideWidth }"
  >
    <article class="u-doc-body"><slot /></article>
    <aside v-if="$slots.aside" class="u-doc-aside"><slot name="aside" /></aside>
  </div>
</template>

<style scoped>
.u-doc { display: grid; gap: var(--s-10); align-items: start; }
.u-doc-end   { grid-template-columns: minmax(0, 1fr) var(--aw); }
.u-doc-start { grid-template-columns: var(--aw) minmax(0, 1fr); }

.u-doc-body { min-width: 0; }
.u-doc-end .u-doc-body   { grid-column: 1; }
.u-doc-start .u-doc-body { grid-column: 2; }

.u-doc-aside { position: sticky; top: var(--s-8); }
.u-doc-end .u-doc-aside   { grid-column: 2; grid-row: 1; }
.u-doc-start .u-doc-aside { grid-column: 1; grid-row: 1; }

@media (max-width: 860px) {
  .u-doc, .u-doc-end, .u-doc-start { grid-template-columns: minmax(0, 1fr); }
  .u-doc-body, .u-doc-aside { grid-column: 1; }
  /* Above the article once stacked — a contents list is only useful
     before the thing it indexes. */
  .u-doc-aside { grid-row: 1; position: static; }
  .u-doc-body { grid-row: 2; }
}
</style>
