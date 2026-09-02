<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronRight, MoreHorizontal } from 'lucide-vue-next'

/**
 * Breadcrumb — where this page sits in the thing that contains it.
 *
 * THE LAST CRUMB IS NOT A LINK. It is where you already are, and a link
 * to the current page is a control that does nothing. It gets
 * aria-current="page" and stays text, whether or not a `to` was given.
 *
 * The separators are decoration and hidden from assistive technology.
 * A screen reader announces "list, 4 items" and the nesting is carried
 * by the order — reading out three chevrons adds nothing but three
 * chevrons.
 *
 * WHEN IT IS TOO LONG THE MIDDLE COLLAPSES, not the end. The first crumb
 * is the root and the last two are where you are and what you are
 * inside; everything between them is the part you can afford to fold.
 * And the fold is a real button that unfolds — an ellipsis you cannot
 * open is a trail with a hole in it.
 */
export interface Crumb {
  label: string
  /** Omit on the last crumb; it is ignored there anyway. */
  to?: string
  icon?: Component
}

const props = withDefaults(defineProps<{
  items: Crumb[]
  /**
   * What links render as. Injected from the layer's plugin, so a Nuxt
   * app gets client-side navigation without asking; pass one here to
   * override, or in a plain Vue app to supply RouterLink.
   *
   * THE COMPONENT, NOT ITS NAME. A string is only resolved against the
   * runtime component registry, and an auto-imported component is not in
   * it: `link="NuxtLink"` renders a literal <nuxtlink> element that
   * looks right, highlights right, and cannot be clicked.
   */
  link?: Component | 'a'
  /** Fold the middle beyond this many crumbs. 0 never folds. */
  maxItems?: number
  label?: string
}>(), { maxItems: 4, label: 'Breadcrumb' })

/* 'a' only when nothing provided one — a plain Vue app with no router
   still renders working links, it just reloads the page. */
const provided = inject<Component | 'a'>('uiLink', 'a')
const link = computed(() => props.link ?? provided)

const open = ref(false)

const folded = computed(() =>
  props.maxItems > 0 && !open.value && props.items.length > props.maxItems
)

/** First, the fold, then the last two. */
const shown = computed<(Crumb | 'fold')[]>(() =>
  folded.value
    ? [props.items[0]!, 'fold', ...props.items.slice(-2)]
    : props.items
)

const linkProps = (c: Crumb) =>
  link.value === 'a' ? { href: c.to } : { to: c.to }

/** Identity by position, since two crumbs can share a label. */
const isLast = (i: number) => i === shown.value.length - 1
</script>

<template>
  <nav class="u-bc" :aria-label="label">
    <ol class="u-bc-list">
      <li v-for="(c, i) in shown" :key="c === 'fold' ? 'fold' : `${c.label}-${i}`" class="u-bc-item">
        <button
          v-if="c === 'fold'"
          type="button"
          class="u-bc-fold"
          aria-label="Show the hidden steps"
          @click="open = true"
        ><UiIcon :is="MoreHorizontal" size="sm" /></button>

        <span v-else-if="isLast(i)" class="u-bc-here" aria-current="page">
          <UiIcon v-if="c.icon" :is="c.icon" size="sm" class="u-bc-icon" />
          {{ c.label }}
        </span>

        <component
          :is="c.to ? link : 'span'"
          v-else
          class="u-bc-link"
          v-bind="c.to ? linkProps(c) : {}"
        >
          <UiIcon v-if="c.icon" :is="c.icon" size="sm" class="u-bc-icon" />
          {{ c.label }}
        </component>

        <UiIcon
          v-if="!isLast(i)"
          :is="ChevronRight"
          size="sm"
          class="u-bc-sep"
          aria-hidden="true"
        />
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.u-bc-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
}
.u-bc-item { display: flex; align-items: center; }

.u-bc-link,
.u-bc-here,
.u-bc-fold {
  display: inline-flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-2) var(--s-3);
  border-radius: var(--r-xs);
  font: var(--w-regular) var(--fs-small)/1.3 var(--font-sans);
  letter-spacing: var(--tr-small);
  text-decoration: none;
  white-space: nowrap;
}

.u-bc-link { color: var(--fg-muted); }
.u-bc-link:hover { color: var(--fg); background: var(--fill-quiet); }
.u-bc-link:focus-visible,
.u-bc-fold:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 1px;
}

/* Where you are, in the same recipe as every other "here" in the system:
   full-strength text and weight, no colour. */
.u-bc-here { color: var(--fg); font-weight: var(--w-medium); }

.u-bc-fold {
  border: 0;
  background: transparent;
  color: var(--fg-subtle);
  cursor: pointer;
}
.u-bc-fold:hover { color: var(--fg); background: var(--fill-quiet); }

.u-bc-icon { color: var(--fg-subtle); }
.u-bc-sep { flex: none; color: var(--fg-subtle); margin-inline: -2px; }
</style>
