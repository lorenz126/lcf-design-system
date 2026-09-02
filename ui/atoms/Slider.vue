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

/** 0–1, for the filled part of the track. */
const portion = computed(() => {
  const span = props.max - props.min
  return span <= 0 ? 0 : (model.value - props.min) / span
})
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
          :style="{ '--sl-fill': portion }"
        >

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
.u-sl-vertical {
  flex-direction: column;
  min-height: 140px;
  width: max-content;
}
.u-sl-off { opacity: .5; cursor: not-allowed; }

.u-sl-track {
  appearance: none;
  flex: 1;
  min-width: 0;
  height: var(--sl-thumb);
  background: transparent;
  cursor: pointer;
  --sl-thumb: 16px;
  --sl-rail: 4px;
  /* A gradient stop rather than two elements: the track is one box, and
     the split is exactly where the value is. */
  --sl-paint: linear-gradient(
    to var(--sl-to, right),
    var(--accent) 0 calc(var(--sl-fill) * 100%),
    var(--fill-strong) calc(var(--sl-fill) * 100%) 100%
  );
}
.u-s-sm .u-sl-track { --sl-thumb: 14px; --sl-rail: 3px; }
.u-s-lg .u-sl-track { --sl-thumb: 20px; --sl-rail: 6px; }

/* Upright. writing-mode does this properly now; appearance:
   slider-vertical is deprecated and was never in more than one engine. */
.u-sl-vertical .u-sl-track {
  writing-mode: vertical-lr;
  direction: rtl;
  flex: none;
  height: 100%;
  min-height: 120px;
  width: var(--sl-thumb);
  --sl-to: top;
}

/* The two engines need the same rules under different names, and a
   grouped selector is dropped whole if either is unknown. */
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
  width: var(--sl-thumb);
  height: var(--sl-thumb);
  /* Centred on the rail rather than sitting on it. */
  margin-top: calc((var(--sl-rail) - var(--sl-thumb)) / 2);
  border: 0;
  border-radius: var(--r-full);
  background: var(--bg);
  box-shadow: var(--shadow-2), 0 0 0 1px var(--border-strong) inset;
}
.u-sl-track::-moz-range-thumb {
  width: var(--sl-thumb);
  height: var(--sl-thumb);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-full);
  background: var(--bg);
  box-shadow: var(--shadow-2);
}

.u-sl-track:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 4px;
  border-radius: var(--r-full);
}
.u-sl-track:disabled { cursor: not-allowed; }

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
