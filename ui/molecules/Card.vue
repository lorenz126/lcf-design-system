<script setup lang="ts">
/**
 * Card — a bounded surface.
 *
 * The default is `flat`, a border. That follows from the light being in
 * front: an even, offset-free halo reads as "lifted toward the viewer",
 * so a shadow means the thing is ON the layout, not IN it. A grid of
 * shadowed cards claims every one of them is floating, which makes none
 * of them read as floating.
 *
 *   border  — sits in the layout   (cards in a grid, panels, wells)
 *   shadow  — sits on the layout   (popovers, dialogs, dragged items)
 *
 * `raised` exists for the second case; reach for it when the card really
 * is above the page, not to make a list look more interesting.
 */
withDefaults(defineProps<{
  variant?: 'flat' | 'raised' | 'glass'
  /** Padding step. `none` is for cards whose content owns its own edges,
   *  like a table or an image that should bleed to the border. */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Renders as <a>/<button> and adds hover and press feedback. */
  as?: 'div' | 'a' | 'button'
  href?: string
}>(), { variant: 'flat', padding: 'md', as: 'div' })
</script>

<template>
  <component
    :is="href ? 'a' : as"
    class="u-card"
    :class="[`u-card-${variant}`, `u-card-p-${padding}`, { 'u-card-interactive': href || as !== 'div' }]"
    :href="href"
  >
    <header v-if="$slots.header" class="u-card-head"><slot name="header" /></header>
    <slot />
    <footer v-if="$slots.footer" class="u-card-foot"><slot name="footer" /></footer>
  </component>
</template>

<style scoped>
.u-card {
  display: block;
  border-radius: var(--r-lg);
  /* clip, not hidden. A rounded card has to clip its content or a square
     child paints over the border in the corners — a table's sticky header
     did exactly that. `hidden` would fix it and make the card a scroll
     container, which reparents any sticky header inside to the card and
     stops it sticking to the viewport. `clip` cuts without that. */
  overflow: clip;
  background: var(--bg-raised);
  color: var(--fg);
  text-align: start;
  text-decoration: none;
}

.u-card-flat   { border: var(--border-width) solid var(--border); }
.u-card-raised { border: var(--border-width) solid transparent; box-shadow: var(--shadow-2); }
.u-card-glass {
  border: var(--border-width) solid var(--glass-border);
  background: var(--glass-bg);
  box-shadow: var(--shadow-2);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
}

.u-card-p-none { padding: 0; }
.u-card-p-sm   { padding: var(--s-5); }
.u-card-p-md   { padding: var(--s-7); }
.u-card-p-lg   { padding: var(--s-9); }

/* Only interactive cards react. A static card that lifts on hover
   promises a click that never happens. */
.u-card-interactive {
  cursor: pointer;
  transition: border-color var(--dur-fast) var(--ease-out),
              box-shadow var(--dur-fast) var(--ease-out),
              transform var(--dur-instant) var(--ease-out);
}
.u-card-interactive:hover { border-color: var(--border-strong); }
.u-card-raised.u-card-interactive:hover { box-shadow: var(--shadow-3); }
.u-card-interactive:active { transform: scale(.995); }
.u-card-interactive:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 2px;
}

/* Head and foot only pull their own edge back when the card has padding;
   with padding: none they would create negative space. */
.u-card-head { padding-bottom: var(--s-5); }
.u-card-foot { padding-top: var(--s-5); }
.u-card-p-none .u-card-head,
.u-card-p-none .u-card-foot { padding: var(--s-5) var(--s-7); }
</style>
