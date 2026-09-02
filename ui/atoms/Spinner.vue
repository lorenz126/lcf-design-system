<script setup lang="ts">
/**
 * Spinner — work is happening and nobody knows how long it will take.
 *
 * Extracted because there were two of it: Button had one and List had a
 * second, identical down to the 0.6s and the border trick, under two
 * different keyframe names. A table that was also loading had neither
 * and said "Loading…" in text instead. That is what duplication looks
 * like before it becomes divergence.
 *
 * REDUCED MOTION SLOWS IT, IT DOES NOT STOP IT. Everything else in the
 * system collapses to 1ms under prefers-reduced-motion, which is right
 * for a transition — the end state is the point. A stopped spinner is
 * not a finished spinner, it is a frozen one, and it says the opposite
 * of what it is there to say. Two seconds a turn is calm and still
 * clearly alive.
 *
 * Decorative by default, like Icon and Avatar: it usually sits beside
 * the word "Loading". `label` is for when it is on its own.
 */
withDefaults(defineProps<{
  /** `inherit` takes the surrounding font size — for use inside a button. */
  size?: 'sm' | 'md' | 'lg' | 'inherit'
  /** Accessible name. Omit when adjacent text already says it. */
  label?: string
}>(), { size: 'md' })
</script>

<template>
  <span
    class="u-sp"
    :class="`u-sp-${size}`"
    :role="label ? 'status' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
  />
</template>

<style scoped>
.u-sp {
  flex: none;
  display: inline-block;
  width: var(--sp);
  height: var(--sp);
  /* currentColor, so it belongs to whatever it is placed in rather than
     carrying a colour of its own into a red button. */
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: var(--r-full);
  animation: u-sp-turn .6s linear infinite;
}

.u-sp-sm { --sp: 12px; }
.u-sp-md { --sp: 14px; }
.u-sp-lg { --sp: 20px; }
.u-sp-inherit { --sp: 1em; }

@keyframes u-sp-turn { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .u-sp { animation-duration: 2s; }
}
</style>
