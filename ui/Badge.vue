<script setup lang="ts">
/**
 * Badge — a status marker, not a control.
 *
 * Fully rounded ON PURPOSE. Buttons are never capsules in this system
 * precisely so that a capsule means "this is a label, not a thing you
 * press". The shapes have to stay distinct for either rule to carry
 * meaning.
 *
 * All six hues use one recipe: tint ground, the hue's own text. Yellow
 * and orange measure 3.24:1 and 3.30:1 in light mode — a deliberate
 * trade of contrast for chroma, since at AA-legible lightness those two
 * turn brown. Above the 3:1 floor for large text and UI components,
 * below AA for body text.
 *
 * Two things NOT to "fix" later:
 *   - inverting yellow and orange to a solid ground. A row where two of
 *     six invert reads as a bug, not a rule.
 *   - darkening them back to clear AA. That was tried; it is the brown.
 */
type Tone = 'neutral' | 'yellow' | 'green' | 'blue' | 'purple' | 'red' | 'orange'

withDefaults(defineProps<{
  tone?: Tone
  /** Leading dot, for status lists where the colour does the work. */
  dot?: boolean
  size?: 'sm' | 'md'
}>(), { tone: 'neutral', size: 'md' })
</script>

<template>
  <span class="u-badge" :class="`u-s-${size}`" :data-tone="tone">
    <span v-if="dot" class="u-dot" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped>
.u-badge[data-tone="yellow"] { --bd-bg: var(--yellow-badge-bg); --bd-fg: var(--yellow-badge-fg); }
.u-badge[data-tone="green"]  { --bd-bg: var(--green-badge-bg);  --bd-fg: var(--green-badge-fg);  }
.u-badge[data-tone="blue"]   { --bd-bg: var(--blue-badge-bg);   --bd-fg: var(--blue-badge-fg);   }
.u-badge[data-tone="purple"] { --bd-bg: var(--purple-badge-bg); --bd-fg: var(--purple-badge-fg); }
.u-badge[data-tone="red"]    { --bd-bg: var(--red-badge-bg);    --bd-fg: var(--red-badge-fg);    }
.u-badge[data-tone="orange"] { --bd-bg: var(--orange-badge-bg); --bd-fg: var(--orange-badge-fg); }
.u-badge[data-tone="neutral"]{ --bd-bg: var(--fill);            --bd-fg: var(--fg-muted); }

.u-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--s-3);
  background: var(--bd-bg);
  color: var(--bd-fg);
  border-radius: var(--r-full);
  white-space: nowrap;
}
.u-s-md {
  height: 20px; padding-inline: var(--s-4);
  font: var(--w-medium) var(--fs-caption)/1 var(--font-sans);
  letter-spacing: var(--tr-caption);
}
.u-s-sm {
  height: 16px; padding-inline: var(--s-3);
  font: var(--w-medium) var(--fs-micro)/1 var(--font-sans);
  letter-spacing: var(--tr-micro);
}
.u-dot {
  width: 6px; height: 6px; flex: none;
  border-radius: var(--r-full);
  /* The badge's own text colour, never the raw hue: on a solid yellow or
     orange badge the hue IS the ground, so a hue-coloured dot vanishes.
     currentColor is already contrast-checked against the ground. */
  background: currentColor;
}
.u-s-sm .u-dot { width: 5px; height: 5px; }
</style>
