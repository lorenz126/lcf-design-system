<script setup lang="ts">
/**
 * Divider — a rule that separates.
 *
 * A separator is not a border. A border belongs to a box and says where
 * the box ends; a divider is a thing in the flow that says two blocks
 * either side of it are not the same block. That is why it carries
 * role="separator" and its own spacing, and why a menu and a sidebar
 * both stopped drawing their own.
 *
 * WITH A LABEL IT IS NO LONGER AN <hr>. A horizontal rule cannot have
 * content, so a labelled divider is a div with the same role, the lines
 * drawn either side of the word. The word itself is hidden from the
 * separator's name — "or" read out as the name of a separator says
 * nothing useful, and it is already visible to everyone who can see it.
 */
withDefaults(defineProps<{
  orientation?: 'horizontal' | 'vertical'
  /** Space along the axis it divides. `none` for a rule inside a row. */
  spacing?: 'none' | 'sm' | 'md' | 'lg'
  /** Pulls the rule in from the edges — for a list with padded rows,
   *  where a full-bleed line cuts across the padding. */
  inset?: boolean
}>(), { orientation: 'horizontal', spacing: 'md' })

const slots = useSlots()
const labelled = computed(() => !!slots.default)
</script>

<template>
  <div
    v-if="labelled"
    class="u-dv u-dv-labelled"
    :class="[`u-dv-s-${spacing}`, { 'u-dv-inset': inset }]"
    role="separator"
  >
    <span class="u-dv-line" />
    <span class="u-dv-text"><slot /></span>
    <span class="u-dv-line" />
  </div>

  <hr
    v-else-if="orientation === 'horizontal'"
    class="u-dv u-dv-h"
    :class="[`u-dv-s-${spacing}`, { 'u-dv-inset': inset }]"
  >

  <div
    v-else
    class="u-dv u-dv-v"
    :class="`u-dv-s-${spacing}`"
    role="separator"
    aria-orientation="vertical"
  />
</template>

<style scoped>
.u-dv {
  border: 0;
  background: var(--border);
}

.u-dv-h {
  height: var(--border-width);
  margin-block: var(--gap);
  margin-inline: 0;
}
.u-dv-inset { margin-inline: var(--s-4); }

/* Stretches to whatever row it is in rather than guessing a height, with
   a floor for the case where the row has none of its own. */
.u-dv-v {
  width: var(--border-width);
  align-self: stretch;
  min-height: 1em;
  margin-inline: var(--gap);
  margin-block: 0;
}

.u-dv-s-none { --gap: 0; }
.u-dv-s-sm   { --gap: var(--s-2); }
.u-dv-s-md   { --gap: var(--s-5); }
.u-dv-s-lg   { --gap: var(--s-8); }

.u-dv-labelled {
  display: flex;
  align-items: center;
  gap: var(--s-5);
  background: transparent;
  margin-block: var(--gap);
}
.u-dv-line {
  flex: 1;
  height: var(--border-width);
  background: var(--border);
}
.u-dv-text {
  flex: none;
  color: var(--fg-subtle);
  font: var(--w-medium) var(--fs-caption)/1 var(--font-sans);
  letter-spacing: var(--tr-caption);
}
</style>
