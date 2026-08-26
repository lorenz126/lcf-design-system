<script setup lang="ts">
/**
 * Button — the framework's first control.
 *
 * Six variants, matching how a hierarchy actually gets used:
 *   solid    one per screen. The thing you want pressed. White text, always.
 *   tinted   secondary actions that still carry colour. Coloured text, always.
 *   outline  neutral secondary. Carries no colour opinion.
 *   plain    tertiary. Reads as a link with a hit area.
 *   floating solid, lifted off the surface. For actions that sit ON content
 *            rather than in the layout — FABs, sticky bars, overlays.
 *   glass    translucent, blurs what is behind it. Only legible over a
 *            backdrop; on a flat surface it just looks like a weak outline.
 *
 * `tone` selects a hue from the palette. The solid and tinted recipes
 * resolve per hue, so a yellow button stays bright rather than turning
 * muddy — see tokens/color.css.
 */
type Variant = 'solid' | 'tinted' | 'outline' | 'plain' | 'floating' | 'glass'
type Tone = 'accent' | 'yellow' | 'green' | 'blue' | 'purple' | 'red' | 'orange' | 'neutral'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  variant?: Variant
  tone?: Tone
  size?: Size
  disabled?: boolean
  loading?: boolean
  block?: boolean
  /** Renders as <a> when set. */
  href?: string
}>(), {
  variant: 'solid',
  tone: 'accent',
  size: 'md',
})

const tag = computed(() => (props.href ? 'a' : 'button'))
const isDisabled = computed(() => props.disabled || props.loading)
</script>

<template>
  <component
    :is="tag"
    class="btn"
    :class="[`v-${variant}`, `s-${size}`, { block, loading }]"
    :data-tone="tone"
    :href="href"
    :disabled="tag === 'button' ? isDisabled : undefined"
    :aria-disabled="tag === 'a' && isDisabled ? 'true' : undefined"
    :aria-busy="loading ? 'true' : undefined"
  >
    <span v-if="loading" class="spinner" aria-hidden="true" />
    <slot />
  </component>
</template>

<style scoped>
/* Each tone resolves to four local values; every variant below reads only
   these, so adding a hue never means touching a variant.
   NAMESPACED on purpose: --bg and --fg are global tokens, and redefining
   them here shadowed the real ones — neutral/plain resolved to white on
   white. Local custom properties must never reuse a token name. */
.btn[data-tone="accent"],
.btn[data-tone="blue"]   { --btn-bg: var(--blue-solid-bg);   --btn-fg: var(--solid-fg);
                           --btn-tint: var(--blue-tint-bg); --btn-onpage: var(--blue-text);     --btn-ink: var(--blue-tint-fg); }
.btn[data-tone="yellow"] { --btn-bg: var(--yellow-solid-bg); --btn-fg: var(--solid-fg);
                           --btn-tint: var(--yellow-tint-bg); --btn-onpage: var(--yellow-text);   --btn-ink: var(--yellow-tint-fg); }
.btn[data-tone="green"]  { --btn-bg: var(--green-solid-bg);  --btn-fg: var(--solid-fg);
                           --btn-tint: var(--green-tint-bg); --btn-onpage: var(--green-text);    --btn-ink: var(--green-tint-fg); }
.btn[data-tone="purple"] { --btn-bg: var(--purple-solid-bg); --btn-fg: var(--solid-fg);
                           --btn-tint: var(--purple-tint-bg); --btn-onpage: var(--purple-text);   --btn-ink: var(--purple-tint-fg); }
.btn[data-tone="red"]    { --btn-bg: var(--red-solid-bg);    --btn-fg: var(--solid-fg);
                           --btn-tint: var(--red-tint-bg); --btn-onpage: var(--red-text);      --btn-ink: var(--red-tint-fg); }
.btn[data-tone="orange"] { --btn-bg: var(--orange-solid-bg); --btn-fg: var(--solid-fg);
                           --btn-tint: var(--orange-tint-bg); --btn-onpage: var(--orange-text);   --btn-ink: var(--orange-tint-fg); }
.btn[data-tone="neutral"]{ --btn-bg: var(--fg);   --btn-fg: var(--bg);
                           --btn-tint: rgb(128 128 128 / .14);
                           --btn-onpage: var(--fg); --btn-ink: var(--fg); }

.btn {
  --h: var(--control-md);
  --pad: var(--s-5);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--s-3);
  height: var(--h);
  padding-inline: var(--pad);
  border: var(--border-width) solid transparent;
  border-radius: var(--r-control);
  font: var(--w-medium) var(--fs-body)/1 var(--font-sans);
  letter-spacing: var(--tr-body);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: background-color .12s linear, border-color .12s linear,
              color .12s linear, transform .08s ease-out;
}
.btn:active:not(:disabled):not([aria-disabled="true"]) { transform: scale(.975); }

/* One focus definition for every control in the system. */
.btn:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 1px;
}

.s-sm { --h: var(--control-sm); --pad: var(--s-4); font-size: var(--fs-small); }
.s-md { --h: var(--control-md); --pad: var(--s-5); }
.s-lg { --h: var(--control-lg); --pad: var(--s-6); font-size: var(--fs-lead); }
.block { display: flex; width: 100%; }

/* ---- variants ---- */
.v-solid   { background: var(--btn-bg); color: var(--btn-fg); }
.v-tinted  { background: var(--btn-tint); color: var(--btn-ink); }
.v-outline { background: transparent; color: var(--btn-onpage); border-color: var(--border-strong); }
.v-plain   { background: transparent; color: var(--btn-onpage); padding-inline: var(--s-3); }

/* Floating — the same solid recipe, lifted. The press choreography is the
   point: rising on hover and dropping BELOW its resting shadow on press
   is what makes it feel physical rather than merely decorated. */
.v-floating {
  background: var(--btn-bg);
  color: var(--btn-fg);
  box-shadow: var(--shadow-3);
}
.v-floating:hover:not(:disabled):not([aria-disabled="true"]) {
  box-shadow: var(--shadow-4);
  transform: translateY(-1px);
}
.v-floating:active:not(:disabled):not([aria-disabled="true"]) {
  box-shadow: var(--shadow-1);
  transform: translateY(0) scale(.99);
}

/* Glass — tint, blur, rim, and a top highlight. The highlight is what
   separates glass from "a translucent rectangle": real glass catches
   light on its top edge. */
.v-glass {
  position: relative;
  background: var(--glass-bg);
  color: var(--btn-onpage);
  border-color: var(--glass-border);
  box-shadow: var(--shadow-2);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
}
.v-glass::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 50%;
  border-radius: inherit;
  background: linear-gradient(var(--glass-highlight), transparent);
  opacity: .35;
  pointer-events: none;
}
.v-glass:hover:not(:disabled):not([aria-disabled="true"]) {
  background: color-mix(in srgb, var(--glass-bg) 70%, var(--btn-onpage));
}

/* Hover shifts toward the foreground so it works on light and dark from
   one declaration, instead of a hand-picked value per theme. */
.v-solid:hover:not(:disabled):not([aria-disabled="true"]),
.v-floating:hover:not(:disabled):not([aria-disabled="true"]) {
  background: color-mix(in srgb, var(--btn-bg) 88%, var(--btn-fg));
}
.v-tinted:hover:not(:disabled):not([aria-disabled="true"]),
.v-plain:hover:not(:disabled):not([aria-disabled="true"]) {
  background: color-mix(in srgb, var(--btn-tint) 60%, var(--btn-ink));
}
.v-outline:hover:not(:disabled):not([aria-disabled="true"]) {
  background: var(--btn-tint); border-color: var(--btn-ink);
}

.btn:disabled, .btn[aria-disabled="true"] {
  opacity: .4;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  width: 1em; height: 1em; flex: none;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: var(--r-full);
  animation: spin .6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .spinner { animation-duration: 2s; }
  .btn { transition: none; }
}
</style>
