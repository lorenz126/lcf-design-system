<script setup lang="ts">
/**
 * Progress — how far along something is.
 *
 * A real <progress>, which Attachments already had inside it: the value
 * is announced without any aria of ours, and the platform draws
 * something sensible if the styling ever fails to arrive.
 *
 * INDETERMINATE IS THE ABSENCE OF A VALUE, not a flag. Omit `value` and
 * the element is natively indeterminate — the same state the browser
 * already understands — so there is nothing to keep in step. What it
 * costs is the paint: an indeterminate <progress> is unstyleable in
 * WebKit, so the bar underneath carries the sweep and the element on top
 * shows nothing.
 *
 * REDUCED MOTION SLOWS THE SWEEP, IT DOES NOT STOP IT — the same
 * argument as Spinner. Everything else in the system collapses to 1ms,
 * which is right for a transition because the end state is the point. A
 * stopped indeterminate bar is not a finished one; it is a frozen one,
 * and it says the opposite of what it is for.
 *
 * A percentage is a number, and a number with no unit is a number nobody
 * can act on. `format` supplies the words; the default supplies the
 * percent sign.
 */
const props = withDefaults(defineProps<{
  /** Omit for indeterminate — see above. */
  value?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  tone?: 'accent' | 'green' | 'orange' | 'red'
  /** Accessible name. Required when nothing beside it says what this is. */
  label?: string
  /** Prints the value beside the bar. */
  showValue?: boolean
  format?: (value: number, max: number) => string
}>(), { max: 100, size: 'md', tone: 'accent' })

const busy = computed(() => props.value === undefined || props.value === null)

const text = computed(() => {
  if (busy.value) return undefined
  return props.format
    ? props.format(props.value!, props.max)
    : `${Math.round((props.value! / props.max) * 100)}%`
})
</script>

<template>
  <div class="u-pr" :class="[`u-s-${size}`, { 'u-pr-busy': busy }]" :data-tone="tone">
    <div class="u-pr-rail">
      <progress
        class="u-pr-bar"
        :value="busy ? undefined : value"
        :max="max"
        :aria-label="label"
        :aria-valuetext="text"
      >{{ text ?? 'Working' }}</progress>
    </div>
    <span v-if="showValue && text" class="u-pr-value">{{ text }}</span>
  </div>
</template>

<style scoped>
.u-pr {
  display: flex;
  align-items: center;
  gap: var(--s-5);
  width: 100%;
  --pr-fill: var(--accent);
}
.u-pr[data-tone="green"]  { --pr-fill: var(--green-text); }
.u-pr[data-tone="orange"] { --pr-fill: var(--orange-text); }
.u-pr[data-tone="red"]    { --pr-fill: var(--red-text); }

/* The rail carries the ground and the sweep; the element on top carries
   the value. Two boxes because an indeterminate <progress> cannot be
   painted in WebKit at all. */
.u-pr-rail {
  position: relative;
  flex: 1;
  min-width: 0;
  height: var(--pr-h);
  border-radius: var(--r-full);
  background: var(--fill);
  overflow: clip;
}
.u-s-sm { --pr-h: 3px; }
.u-s-md { --pr-h: 6px; }
.u-s-lg { --pr-h: 10px; }

.u-pr-bar {
  appearance: none;
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
}
.u-pr-bar::-webkit-progress-bar { background: transparent; }
.u-pr-bar::-webkit-progress-value {
  background: var(--pr-fill);
  border-radius: var(--r-full);
  transition: inline-size var(--dur-base) var(--ease-out);
}
.u-pr-bar::-moz-progress-bar {
  background: var(--pr-fill);
  border-radius: var(--r-full);
}

/* Indeterminate: the element shows nothing and the rail sweeps. */
.u-pr-busy .u-pr-bar { visibility: hidden; }
.u-pr-busy .u-pr-rail::after {
  content: '';
  position: absolute;
  inset-block: 0;
  inline-size: 40%;
  border-radius: var(--r-full);
  background: var(--pr-fill);
  animation: u-pr-sweep 1.4s var(--ease-in-out) infinite;
}
@keyframes u-pr-sweep {
  from { inset-inline-start: -40%; }
  to { inset-inline-start: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .u-pr-busy .u-pr-rail::after { animation-duration: 4s; animation-timing-function: linear; }
}

.u-pr-value {
  flex: none;
  min-width: 4ch;
  text-align: end;
  color: var(--fg-muted);
  font: var(--w-medium) var(--fs-caption)/1 var(--font-sans);
  font-variant-numeric: tabular-nums;
}
</style>
