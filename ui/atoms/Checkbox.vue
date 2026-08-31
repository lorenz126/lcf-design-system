<script setup lang="ts">
/**
 * Checkbox — a styled native input.
 *
 * appearance:none on the real <input> rather than a div with ARIA. That
 * keeps the space bar, form submission, label association and screen
 * reader semantics for free; a rebuilt checkbox has to earn all four back
 * and usually gets one of them wrong.
 *
 * The tick is hand-drawn on a 10px grid rather than Lucide's Check, which
 * every other icon in the layer comes from. Measured: Lucide draws on a
 * 24px viewBox, so at 10px its stroke resolves to 0.73px — sub-pixel, and
 * it renders as a soft grey smudge instead of a crisp mark. This path is
 * native to 10px at 1.8px stroke. Do not "unify" it away.
 */
const props = defineProps<{
  modelValue?: boolean
  label?: string
  help?: string
  /** Neither checked nor unchecked — a parent of partly-selected children. */
  indeterminate?: boolean
  disabled?: boolean
  value?: string
  /** Any non-empty string puts the control in its error state. */
  error?: string
  /** Supply one when something outside has to reference the control —
   *  an error summary linking to it, for instance. Generated otherwise. */
  id?: string
}>()

defineEmits<{ 'update:modelValue': [boolean] }>()

const uid = useId()
const id = computed(() => props.id ?? `c-${uid}`)
const el = useTemplateRef<HTMLInputElement>('el')

// indeterminate is a DOM property, not an attribute — it cannot be bound.
watchEffect(() => {
  if (el.value) el.value.indeterminate = Boolean(props.indeterminate)
})
</script>

<template>
  <div class="u-row" :class="{ 'u-disabled': disabled, 'u-invalid': !!error }">
    <input
      :id="id"
      ref="el"
      type="checkbox"
      class="u-box"
      :checked="modelValue"
      :disabled="disabled"
      :value="value"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error || help ? `${id}-h` : undefined"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    >
    <span class="u-mark" aria-hidden="true">
      <svg v-if="indeterminate" viewBox="0 0 10 10"><path d="M2 5h6" /></svg>
      <svg v-else viewBox="0 0 10 10"><path d="M1.5 5.2l2.2 2.3L8.5 2.8" /></svg>
    </span>
    <div v-if="label || help || error" class="u-text">
      <label :for="id" class="u-label">{{ label }}</label>
      <p v-if="error || help" :id="`${id}-h`" class="u-help" :class="{ 'u-help-err': !!error }">
        {{ error || help }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.u-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--s-2) var(--s-4);
  align-items: start;
}
.u-box, .u-mark { grid-area: 1 / 1; }
.u-text { grid-area: 1 / 2; }

.u-box {
  appearance: none;
  width: 16px; height: 16px; margin: 0;
  /* Nudged down so the box optically centres on the first line of label
     text rather than sitting on its ascender. */
  margin-block-start: 1px;
  border: var(--border-width) solid var(--border-strong);
  border-radius: var(--r-xs);
  background: var(--bg);
  cursor: pointer;
  transition: background-color var(--dur-fast) var(--ease-out),
              border-color var(--dur-fast) var(--ease-out);
}
.u-box:hover:not(:disabled) { border-color: var(--fg-subtle); }
.u-box:checked, .u-box:indeterminate {
  background: var(--accent);
  border-color: var(--accent);
}
.u-box:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 1px;
}
.u-box:disabled { opacity: .5; cursor: not-allowed; }

.u-mark {
  width: 16px; height: 16px; margin-block-start: 1px;
  display: grid; place-items: center;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--dur-instant) var(--ease-out);
}
.u-mark svg { width: 10px; height: 10px; }
.u-mark path {
  fill: none; stroke: var(--solid-fg); stroke-width: 1.8;
  stroke-linecap: round; stroke-linejoin: round;
}
.u-box:checked ~ .u-mark, .u-box:indeterminate ~ .u-mark { opacity: 1; }

.u-label {
  font: var(--w-regular) var(--fs-body)/1.35 var(--font-sans);
  letter-spacing: var(--tr-body);
  color: var(--fg); cursor: pointer;
}
.u-help {
  margin: var(--s-1) 0 0;
  font: var(--w-regular) var(--fs-caption)/1.4 var(--font-sans);
  color: var(--fg-muted);
}
.u-disabled .u-label, .u-disabled .u-help { opacity: .5; cursor: not-allowed; }
.u-help-err { color: var(--danger-text); }
.u-invalid .u-box { border-color: var(--danger-text); }
</style>
