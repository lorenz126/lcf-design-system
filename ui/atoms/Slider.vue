<script setup lang="ts">
/**
 * Slider — one value chosen along a range.
 *
 * A real <input type="range">, for the reason every control here is
 * native: arrows, Home and End, Page Up and Page Down, touch dragging,
 * and the announcement all arrive free and correct. `appearance: none`
 * is a price Checkbox, Radio and Switch already pay.
 *
 * A RANGE WITH TWO THUMBS CANNOT BE THIS COMPONENT. There is no native
 * control with two values, so the moment a second thumb is wanted the
 * whole keyboard model has to be rebuilt by hand on pointer capture —
 * the Kanban work applies directly. That is a different component
 * wearing the same clothes, and it is better to say so than to grow into
 * it one prop at a time.
 *
 * THE FILL IS A CUSTOM PROPERTY, not a background-size trick, because it
 * has to follow the value when the value changes from OUTSIDE — a mute
 * button setting it to zero, a preset, a form reset. Anything driven by
 * the input event alone goes stale the first time that happens.
 *
 * `aria-valuetext` matters more here than anywhere else: a screen reader
 * reading "40" for a volume tells you nothing. `format` supplies the
 * unit, and the default supplies a percent when min and max make one.
 *
 * TICKS ARE MARKS, NOT STOPS. A dot under the rail says "half" without
 * making the thumb land there — snapping is what `step` is for, and a
 * slider that pulls toward marks it was never told to honour is a slider
 * that cannot be set to 51. They are hidden from assistive technology
 * because the value is already announced and reading four dots adds
 * nothing to it.
 *
 * The thumb travels inside the track rather than across it, so a tick at
 * one half belongs at half of (width − thumb) plus half a thumb, not at
 * half the width. The fill has the same geometry, and had the same
 * error: at a thin rail nobody noticed, and at a thick one with marks
 * under it everybody would.
 */
const props = withDefaults(defineProps<{
  label?: string
  help?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  id?: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  orientation?: 'horizontal' | 'vertical'
  /** Shows the value beside the track. */
  showValue?: boolean
  /**
   * Marks under the rail, in the slider's own units. Reference points,
   * not stops — see above.
   */
  ticks?: number[]
  /** What a screen reader hears, and what `showValue` prints. */
  format?: (n: number) => string
}>(), {
  min: 0,
  max: 100,
  step: 1,
  size: 'md',
  orientation: 'horizontal'
})

const model = defineModel<number>({ default: 0 })

const text = computed(() =>
  props.format
    ? props.format(model.value)
    : props.min === 0 && props.max === 100
      ? `${model.value} percent`
      : String(model.value)
)

const span = computed(() => props.max - props.min)

/** Where a value sits along the rail, thumb width taken into account.
 *  Used for the fill's stop and for every mark, so the two can never
 *  disagree about where "half" is. */
const at = (v: number) => {
  const f = span.value <= 0 ? 0 : (v - props.min) / span.value
  return `calc(var(--sl-tw) / 2 + ${Math.min(1, Math.max(0, f))} * (100% - var(--sl-tw)))`
}

const marks = computed(() =>
  (props.ticks ?? []).filter(v => v >= props.min && v <= props.max)
)
</script>

<template>
  <UiField
    :id="id"
    :label="label"
    :help="help"
    :error="error"
    :size="size"
    :block="block"
  >
    <template #default="{ id: fieldId, describedBy, invalid }">
      <div class="u-sl" :class="[`u-sl-${orientation}`, { 'u-sl-off': disabled }]">
        <slot name="leading" />

        <div class="u-sl-wrap" :class="{ 'u-sl-ticked': marks.length }">
          <input
            :id="fieldId"
            v-model.number="model"
            type="range"
            class="u-sl-track"
            :min="min"
            :max="max"
            :step="step"
            :disabled="disabled"
            :aria-invalid="invalid"
            :aria-describedby="describedBy"
            :aria-valuetext="text"
            :aria-orientation="orientation"
            :style="{ '--sl-stop': at(model) }"
          >

          <!-- Decoration: the value is already announced, and four dots
               read out add nothing to it. -->
          <span v-if="marks.length" class="u-sl-ticks" aria-hidden="true">
            <span
              v-for="m in marks"
              :key="m"
              class="u-sl-tick"
              :style="orientation === 'vertical' ? { insetBlockEnd: at(m) } : { insetInlineStart: at(m) }"
            />
          </span>
        </div>

        <slot name="trailing" />
        <span v-if="showValue" class="u-sl-value">{{ text }}</span>
      </div>
    </template>
  </UiField>
</template>

<style scoped>
.u-sl {
  display: flex;
  align-items: center;
  gap: var(--s-5);
  min-height: var(--fld-h, var(--field-md));
  color: var(--fg-muted);
}
.u-sl-vertical { flex-direction: column; min-height: 160px; width: max-content; }
.u-sl-off { opacity: .5; cursor: not-allowed; }

/* Holds the input and the marks in one coordinate space, so a dot and
   the thumb it belongs under are measured against the same box. */
.u-sl-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
  /* The thumb is a capsule: narrow across the rail and tall along it,
     which is the shape that says "grip" rather than "point". */
  --sl-tw: 10px;
  --sl-th: 24px;
  --sl-rail: 8px;
}
.u-s-sm .u-sl-wrap { --sl-tw: 8px;  --sl-th: 18px; --sl-rail: 5px; }
.u-s-lg .u-sl-wrap { --sl-tw: 12px; --sl-th: 30px; --sl-rail: 12px; }
/* Room beside the rail for the marks, only when there are any. */
.u-sl-ticked { padding-block-end: 12px; }

.u-sl-track {
  appearance: none;
  display: block;
  width: 100%;
  height: var(--sl-th);
  background: transparent;
  cursor: pointer;
  /* One box, split exactly where the thumb's centre is — not at the
     fraction of the whole width, which is a different place. */
  --sl-paint: linear-gradient(
    to var(--sl-to, right),
    var(--accent) 0 var(--sl-stop),
    var(--fill-strong) var(--sl-stop) 100%
  );
}

/* Upright. writing-mode does this properly now; appearance:
   slider-vertical is deprecated and was never in more than one engine. */
.u-sl-vertical .u-sl-wrap { flex: none; height: 140px; padding-block-end: 0; }
.u-sl-vertical .u-sl-ticked { padding-block-end: 0; padding-inline-end: 12px; }
.u-sl-vertical .u-sl-track {
  writing-mode: vertical-lr;
  direction: rtl;
  height: 100%;
  width: var(--sl-th);
  --sl-to: top;
}

/* The two engines need the same rules under different names, and a
   grouped selector is dropped whole if either name is unknown. */
.u-sl-track::-webkit-slider-runnable-track {
  height: var(--sl-rail);
  border-radius: var(--r-full);
  background: var(--sl-paint);
}
.u-sl-track::-moz-range-track {
  height: var(--sl-rail);
  border-radius: var(--r-full);
  background: var(--sl-paint);
}

.u-sl-track::-webkit-slider-thumb {
  appearance: none;
  width: var(--sl-tw);
  height: var(--sl-th);
  /* Centred on the rail rather than sitting on it. */
  margin-top: calc((var(--sl-rail) - var(--sl-th)) / 2);
  border: 0;
  border-radius: var(--r-full);
  background: var(--bg);
  box-shadow: var(--shadow-2), 0 0 0 1px var(--border-strong) inset;
}
.u-sl-track::-moz-range-thumb {
  width: var(--sl-tw);
  height: var(--sl-th);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-full);
  background: var(--bg);
  box-shadow: var(--shadow-2);
}

.u-sl-track:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 2px;
  border-radius: var(--r-full);
}
.u-sl-track:disabled { cursor: not-allowed; }

/* ---- the marks ---- */

/* Anchored to the RAIL, not to the box: six pixels under its edge
   whatever the size, rather than a gap that grows with the thumb. */
.u-sl-ticks {
  position: absolute;
  inset-inline: 0;
  inset-block-start: calc((var(--sl-th) + var(--sl-rail)) / 2 + 6px);
  height: 4px;
  pointer-events: none;
}
.u-sl-tick {
  position: absolute;
  inset-block-start: 0;
  /* Its own centre on the value, not its leading edge. */
  translate: -50% 0;
  width: 4px;
  height: 4px;
  border-radius: var(--r-full);
  background: var(--fill-strong);
}

.u-sl-vertical .u-sl-ticks {
  inset-block: 0;
  inset-inline: calc((var(--sl-th) + var(--sl-rail)) / 2 + 6px) auto;
  width: 4px;
  height: auto;
}
.u-sl-vertical .u-sl-tick { inset-block-start: auto; translate: 0 50%; }

.u-sl-value {
  flex: none;
  min-width: 5ch;
  text-align: end;
  color: var(--fg);
  font: var(--w-medium) var(--fs-small)/1 var(--font-sans);
  font-variant-numeric: tabular-nums;
}
.u-sl-vertical .u-sl-value { text-align: center; }
</style>
