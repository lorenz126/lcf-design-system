<script setup lang="ts">
/**
 * FormSection — a titled group of fields.
 *
 * A real <fieldset> and <legend>. Screen readers announce the legend with
 * every field inside it, which is what makes "Billing address / Street"
 * work — a heading in a div gives none of that.
 */
defineProps<{ title?: string; description?: string }>()
</script>

<template>
  <fieldset class="u-fs">
    <legend v-if="title" class="u-fs-legend">{{ title }}</legend>
    <p v-if="description" class="u-fs-desc">{{ description }}</p>
    <div class="u-fs-fields"><slot /></div>
  </fieldset>
</template>

<style scoped>
.u-fs { border: 0; margin: 0; padding: 0; min-width: 0; }
.u-fs-legend {
  padding: 0;
  font: var(--w-semibold) var(--fs-lead)/1.3 var(--font-sans);
  letter-spacing: var(--tr-lead);
  color: var(--fg);
}
.u-fs-desc {
  margin: var(--s-2) 0 0;
  max-width: 68ch;
  font: var(--w-regular) var(--fs-small)/1.5 var(--font-sans);
  color: var(--fg-muted);
}
.u-fs-fields {
  display: flex; flex-direction: column; gap: var(--s-6);
  margin-top: var(--s-6);
}
</style>
