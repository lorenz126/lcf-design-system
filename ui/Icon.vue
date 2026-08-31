<script setup lang="ts">
import type { Component } from 'vue'

/**
 * Icon — sizing, stroke and optical alignment for a Lucide glyph.
 *
 * Takes the icon COMPONENT, not a name string:
 *
 *   import { Check } from 'lucide-vue-next'
 *   <UiIcon :is="Check" />
 *
 * A name-based lookup would need the whole library in the bundle to
 * resolve at runtime. Passing the component keeps tree-shaking intact —
 * you ship the icons you actually used.
 *
 * Decorative by default. Anything an icon communicates that the
 * surrounding text does not must be given a `label`, which turns it into
 * an img role with an accessible name.
 */
withDefaults(defineProps<{
  is: Component
  size?: 'sm' | 'md' | 'lg' | number
  /** Accessible name. Omit when the adjacent text already says it. */
  label?: string
  /** Override the stroke; the default thins with size on purpose. */
  stroke?: number
}>(), { size: 'md' })
</script>

<template>
  <component
    :is="is"
    class="u-icon"
    :class="typeof size === 'string' ? `u-icon-${size}` : undefined"
    :style="typeof size === 'number' ? { '--s': `${size}px` } : undefined"
    :stroke-width="stroke"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    focusable="false"
  />
</template>

<style scoped>
.u-icon {
  --s: var(--icon-md);
  width: var(--s);
  height: var(--s);
  flex: none;
  /* Sits on the text baseline block rather than the alphabetic baseline,
     which is what makes an icon look centred beside a label instead of
     riding low. */
  vertical-align: -0.125em;
  color: currentColor;
  /* Set here, not as an attribute: a CSS variable cannot resolve inside
     an SVG presentation attribute. As a CSS property it can, and an
     explicit `stroke` prop still wins because Vue writes it inline. */
  stroke-width: var(--icon-stroke);
}
.u-icon-sm { --s: var(--icon-sm); }
.u-icon-md { --s: var(--icon-md); }
.u-icon-lg { --s: var(--icon-lg); }
</style>
