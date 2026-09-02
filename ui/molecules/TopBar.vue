<script setup lang="ts">
import type { Component } from 'vue'
import { PanelLeft } from 'lucide-vue-next'

/**
 * TopBar — the application chrome across the top: brand, search, actions.
 *
 * A MOLECULE, not an organism, and the distinction is the whole API: it
 * knows no data shape. It arranges three regions and hands each one to a
 * slot, because what belongs in an application's top bar is the one thing
 * a design framework cannot know. Sidebar is the organism next door — it
 * takes a tree of items and owns what happens to them.
 *
 * The search sits in its own grid column rather than being pushed around
 * by margins, so it holds its place when the two sides change width — a
 * search box that drifts as the actions change is worse than one that is
 * slightly off centre.
 *
 * The one control built in rather than slotted is the sidebar toggle,
 * because it is the only thing here that belongs to the shell rather than
 * to the app. AppShell hands you a `toggle` for it.
 */
withDefaults(defineProps<{
  title?: string
  /** Brand glyph, beside the title. */
  logo?: Component
  /** Where the brand links to. Omitted, it is not a link. */
  href?: string
  /** The sidebar toggle. Off for a shell that has no sidebar. */
  menuButton?: boolean
  menuLabel?: string
}>(), { menuButton: true, menuLabel: 'Toggle navigation' })

const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <div class="u-top">
    <div class="u-top-start">
      <UiButton
        v-if="menuButton"
        variant="plain"
        tone="neutral"
        size="sm"
        icon-only
        :aria-label="menuLabel"
        @click="emit('toggle')"
      ><UiIcon :is="PanelLeft" size="sm" /></UiButton>

      <slot name="leading" />

      <component
        :is="href ? 'a' : 'div'"
        v-if="logo || title || $slots.brand"
        class="u-top-brand"
        :href="href"
      >
        <slot name="brand">
          <UiIcon v-if="logo" :is="logo" size="lg" class="u-top-logo" />
          <span v-if="title" class="u-top-name">{{ title }}</span>
        </slot>
      </component>
    </div>

    <div class="u-top-mid"><slot name="search" /></div>

    <div class="u-top-end"><slot name="actions" /></div>
  </div>
</template>

<style scoped>
.u-top {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--s-5);
  height: 52px;
  padding-inline: var(--s-5);
  background: var(--bg);
  color: var(--fg);
}

.u-top-start,
.u-top-end { display: flex; align-items: center; gap: var(--s-3); }
.u-top-end { justify-content: flex-end; }

.u-top-mid {
  display: flex;
  justify-content: center;
  min-width: 0;
}
.u-top-mid > :deep(*) { width: 100%; max-width: 520px; }

.u-top-brand {
  display: inline-flex;
  align-items: center;
  gap: var(--s-3);
  margin-inline-start: var(--s-2);
  color: inherit;
  text-decoration: none;
  border-radius: var(--r-sm);
}
a.u-top-brand:hover { color: var(--accent-text); }
a.u-top-brand:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 3px;
}
.u-top-logo { color: var(--accent); }
.u-top-name {
  font: var(--w-semibold) var(--fs-body)/1 var(--font-sans);
  letter-spacing: var(--tr-body);
  white-space: nowrap;
}

/* The brand word goes before the search does. A name you already know is
   worth less than the field you came to use. */
@media (max-width: 640px) {
  .u-top-name { display: none; }
  .u-top { gap: var(--s-3); }
}
</style>
