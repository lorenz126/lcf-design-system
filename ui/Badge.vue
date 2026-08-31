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
 * and orange measure 4.34:1 and 4.40:1 in light mode — just under AA —
 * which is the known cost of a light hue on a light tint. Their fill
 * alpha is pulled to 0.09 against the others' 0.14 to recover what it
 * can. Do not "fix" this by inverting those two to a solid ground: a row
 * where two of six invert reads as a bug, not a rule.
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
  <span class="badge" :class="`s-${size}`" :data-tone="tone">
    <span v-if="dot" class="dot" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped>
.badge[data-tone="yellow"] { --bd-bg: var(--yellow-badge-bg); --bd-fg: var(--yellow-badge-fg); }
.badge[data-tone="green"]  { --bd-bg: var(--green-badge-bg);  --bd-fg: var(--green-badge-fg);  }
.badge[data-tone="blue"]   { --bd-bg: var(--blue-badge-bg);   --bd-fg: var(--blue-badge-fg);   }
.badge[data-tone="purple"] { --bd-bg: var(--purple-badge-bg); --bd-fg: var(--purple-badge-fg); }
.badge[data-tone="red"]    { --bd-bg: var(--red-badge-bg);    --bd-fg: var(--red-badge-fg);    }
.badge[data-tone="orange"] { --bd-bg: var(--orange-badge-bg); --bd-fg: var(--orange-badge-fg); }
.badge[data-tone="neutral"]{ --bd-bg: var(--fill);            --bd-fg: var(--fg-muted); }

.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--s-3);
  background: var(--bd-bg);
  color: var(--bd-fg);
  border-radius: var(--r-full);
  white-space: nowrap;
}
.s-md {
  height: 20px; padding-inline: var(--s-4);
  font: var(--w-medium) var(--fs-caption)/1 var(--font-sans);
  letter-spacing: var(--tr-caption);
}
.s-sm {
  height: 16px; padding-inline: var(--s-3);
  font: var(--w-medium) var(--fs-micro)/1 var(--font-sans);
  letter-spacing: var(--tr-micro);
}
.dot {
  width: 6px; height: 6px; flex: none;
  border-radius: var(--r-full);
  /* The badge's own text colour, never the raw hue: on a solid yellow or
     orange badge the hue IS the ground, so a hue-coloured dot vanishes.
     currentColor is already contrast-checked against the ground. */
  background: currentColor;
}
.s-sm .dot { width: 5px; height: 5px; }
</style>
