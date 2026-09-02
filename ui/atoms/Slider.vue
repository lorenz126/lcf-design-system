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
 * THE POINTER AND THE KEYBOARD GET DIFFERENT GRIDS. `step` over a range
 * of a hundred puts the thumb on one of a hundred and one places — about
 * three pixels apart, measured, which is a staircase you can see. But
 * `step` is also what an arrow key moves by and what the value reads as,
 * and neither of those wants to be finer. So `precision` gives the
 * POINTER a finer grid and leaves the keyboard on the coarse one, by
 * swapping the element's own step as the interaction changes hands.
 *
 * Which means the element's step has to be right BEFORE the browser acts
 * on the event that changed hands. Vue patches a microtask too late, so
 * the attribute goes in by hand in the handler and the binding catches
 * up to the same value.
 *
 * AND A MOVING KEY PUTS THE VALUE BACK ON THE COARSE GRID. Otherwise the
 * browser quietly sanitises the element to the nearest step, keeps no
 * event about it, and the thumb and the fill disagree until the next
 * keystroke. Landing on a readable number the moment you reach for the
 * keyboard is the behaviour you want anyway.
 *
 * TICKS ARE MARKS UNTIL YOU SAY OTHERWISE. A dot under the rail says
 * "half" without making the thumb land there, because a slider that
 * pulls toward marks it was never told to honour is one that cannot be
 * set to 51. `snap` turns them into stops, and it is a prop rather than
 * a consequence of having marks at all.
 *
 * AND IT SNAPS FOR THE POINTER ONLY. A drag is imprecise and a magnet
 * helps it; an arrow key is exact and a magnet lies about it — pressing
 * right at 24 and landing on 25 because a mark was nearby is a control
 * reporting something the user did not do. So the keyboard always moves
 * by `step`, and the magnet only ever catches a pointer.
 *
 * The marks are hidden from assistive technology because the value is
 * already announced and reading four dots adds nothing to it.
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
  /**
   * The grid the POINTER gets, in the slider's own units — finer than
   * `step`, which stays what a key moves by and what the value reads as.
   *
   * IT IS THE VALUE'S RESOLUTION TOO: with `0.1` the model really will
   * hold 63.4, and anything else bound to it has to be able to. Leave it
   * off where the steps ARE the meaning — twenty-four whole decibels
   * should move in twenty-four whole jumps.
   */
  precision?: number
  /**
   * Makes the marks catch a dragged handle. A number sets how close the
   * pointer has to come, in the slider's own units; `true` uses 4% of
   * the range. The keyboard is never magnetised — see above.
   *
   * FOR DETENTS, NOT FOR GRADATIONS. Zero on a bass control is a place
   * you want to get back to, so catching there is a help. Half volume is
   * not a place — it is one reading of a scale, and a slider that
   * hesitates at it is a slider fighting you for no reason.
   */
  snap?: boolean | number
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

/** What the value READS as. A pointer may land between steps; nobody
 *  should have to hear about it, and toFixed clears the float dust that
 *  makes a volume of 0.30000000000000004. */
const shown = computed(() => {
  const s = props.step
  if (!s || !Number.isFinite(s)) return model.value
  const dp = (String(s).split('.')[1] ?? '').length
  return Number((Math.round(model.value / s) * s).toFixed(dp))
})

const text = computed(() =>
  props.format
    ? props.format(shown.value)
    : props.min === 0 && props.max === 100
      ? `${shown.value} percent`
      : String(shown.value)
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

/* ---------- the magnet ---------- */

/** How close a drag has to come. Proportional, so it does not need
 *  retuning when the range changes from 0–100 to −12–12. */
const pull = computed(() =>
  typeof props.snap === 'number' ? props.snap : Math.abs(span.value) * 0.04
)

/** True while the last thing that touched this was a key. Decides both
 *  the grid and whether the magnet runs at all. */
const keying = ref(false)

const fine = computed(() => props.precision ?? props.step)
const grid = computed(() => (keying.value ? props.step : fine.value))

/** Keys that actually move the thumb. Tab is not one of them, and a Tab
 *  that rounded the value would be a keystroke changing something the
 *  user was only leaving. */
const MOVES = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Home', 'End', 'PageUp', 'PageDown'
])

function hand(el: HTMLInputElement, toKey: boolean) {
  keying.value = toKey
  el.step = String(toKey ? props.step : fine.value)
}

function onKeydown(e: KeyboardEvent) {
  if (!MOVES.has(e.key)) return
  const el = e.target as HTMLInputElement
  hand(el, true)
  if (model.value !== shown.value) {
    model.value = shown.value
    el.value = String(shown.value)
  }
}

function magnet(v: number) {
  if (!props.snap || !marks.value.length) return v
  const near = marks.value.reduce((a, b) =>
    Math.abs(b - v) < Math.abs(a - v) ? b : a
  )
  return Math.abs(near - v) <= pull.value ? near : v
}

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  const raw = Number(el.value)
  const next = keying.value ? raw : magnet(raw)
  model.value = next
  /* The thumb is painted by the input from ITS OWN value; the fill from
     the model. While the magnet holds the model still, the input keeps
     following the pointer — measured at three steps of drift, so the
     handle slid a clear eight pixels past the edge it is meant to cap.
     Nothing re-rendered, because from Vue's side nothing changed. So put
     the element back on the value we actually chose. */
  if (Number(el.value) !== next) el.value = String(next)
}
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
            :value="model"
            type="range"
            class="u-sl-track"
            :min="min"
            :max="max"
            :step="grid"
            :disabled="disabled"
            :aria-invalid="invalid"
            :aria-describedby="describedBy"
            :aria-valuetext="text"
            :aria-orientation="orientation"
            :style="{ '--sl-stop': at(model) }"
            @input="onInput"
            @keydown="onKeydown"
            @pointerdown="hand($event.target as HTMLInputElement, false)"
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
  /* The handle CROSSES the rail rather than sitting inside it: bigger
     than the track in both directions, so its silhouette and its shadow
     are what you grab rather than a shape cut out of the fill. Wider
     than it is tall — a capsule, not a disc — which is the difference
     between a grip and a bead. */
  --sl-rail: 8px;
  --sl-tw: 26px;
  --sl-th: 20px;
}
.u-s-sm .u-sl-wrap { --sl-rail: 6px;  --sl-tw: 20px; --sl-th: 16px; }
.u-s-lg .u-sl-wrap { --sl-rail: 12px; --sl-tw: 32px; --sl-th: 24px; }
/* SYMMETRIC room, and that is the point. Padding only on the side the
   marks are on moves the box's centre away from the rail's, and the row
   is centred on the box — so the icons at either end sat six pixels
   below the line they belong to. Padding both sides costs a little
   height and keeps the rail where the centring expects it. */
.u-sl-ticked { padding-block: 12px; }

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
.u-sl-vertical .u-sl-ticked { padding-block: 0; padding-inline: 12px; }
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

/*
 * The handle is LIGHT IN BOTH THEMES, not --bg.
 *
 * A theme-following handle is near-black in dark mode sitting on a dark
 * grey track — 1.47:1, measured. Every platform paints this one light in
 * both, so --solid-fg, the token that already means "what sits on a
 * saturated fill".
 *
 * THE SHADOW IS LOAD-BEARING HERE, and this is the only place in the
 * system where that is true. A white handle on the pale side of a light
 * track measures 1.32:1 and no ring changes that without becoming the
 * hard outline this deliberately does not have. So the affordance is the
 * raised silhouette: a tight dark halo doing the work of an edge, and a
 * softer one under it doing the work of height.
 *
 * It is a knowing trade, recorded as one — check-contrast still measures
 * the pair and still prints the number, held to a floor that says out
 * loud what is carrying it. In dark mode the handle needs none of this
 * and clears 13:1 on its own.
 */
.u-sl-track::-webkit-slider-thumb {
  appearance: none;
  width: var(--sl-tw);
  height: var(--sl-th);
  /* Centred on the rail rather than sitting on it. */
  margin-top: calc((var(--sl-rail) - var(--sl-th)) / 2);
  border: 0;
  border-radius: var(--r-full);
  background: var(--solid-fg);
  box-shadow: 0 0 1px rgb(0 0 0 / .32), 0 1px 4px rgb(0 0 0 / .22);
}
.u-sl-track::-moz-range-thumb {
  width: var(--sl-tw);
  height: var(--sl-th);
  border: 0;
  border-radius: var(--r-full);
  background: var(--solid-fg);
  box-shadow: 0 0 1px rgb(0 0 0 / .32), 0 1px 4px rgb(0 0 0 / .22);
}

.u-sl-track:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 2px;
  border-radius: var(--r-full);
}
.u-sl-track:disabled { cursor: not-allowed; }

/* ---- the marks ---- */

/* Anchored to the far edge of the padding that was reserved for them,
   so the gap under the handle is the same at every size. */
.u-sl-ticks {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 4px;
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
  inset-inline: auto 4px;
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
