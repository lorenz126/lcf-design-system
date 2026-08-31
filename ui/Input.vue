<script setup lang="ts">
/**
 * Input — label, field, and message as one unit.
 *
 * The three parts ship together on purpose. A bare input with the label
 * and error wired up by the caller is where accessibility quietly breaks:
 * the label ends up unassociated, and the error is announced by nothing.
 * Here the id is generated once and for/aria-describedby follow from it.
 */
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  modelValue?: string
  label?: string
  /** Guidance shown under the field. Replaced by `error` when present. */
  help?: string
  /** Any non-empty string puts the field in its error state. */
  error?: string
  size?: Size
  type?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  block?: boolean
}>(), { size: 'md', type: 'text' })

defineEmits<{ 'update:modelValue': [string] }>()

const uid = useId()
const fieldId = computed(() => `f-${uid}`)
const msgId = computed(() => `m-${uid}`)
const hasMsg = computed(() => Boolean(props.error || props.help))
</script>

<template>
  <div class="u-field" :class="[`u-s-${size}`, { 'u-block': block, 'u-invalid': !!error }]">
    <label v-if="label" :for="fieldId" class="u-label">
      {{ label }}
      <span v-if="required" class="u-req" aria-hidden="true">*</span>
    </label>

    <input
      :id="fieldId"
      class="u-input"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="hasMsg ? msgId : undefined"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >

    <p v-if="hasMsg" :id="msgId" class="u-msg" :class="{ 'u-err': !!error }">
      {{ error || help }}
    </p>
  </div>
</template>

<style scoped>
.u-field { display: inline-flex; flex-direction: column; gap: var(--s-2); }
.u-block { display: flex; width: 100%; }

.u-label {
  font: var(--w-medium) var(--fs-small)/1.3 var(--font-sans);
  letter-spacing: var(--tr-small);
  color: var(--fg);
}
.u-req { color: var(--danger-text); }

.u-input {
  --h: var(--field-md);
  width: 100%;
  height: var(--h);
  padding-inline: var(--s-5);
  color: var(--fg);
  background: var(--bg);
  border: var(--border-width) solid var(--border-strong);
  /* Same 40% cap as the button — a field is not a pill either. */
  border-radius: min(var(--r-control), calc(var(--h) * 0.4));
  font: var(--w-regular) var(--fs-body)/1 var(--font-sans);
  letter-spacing: var(--tr-body);
  transition: border-color var(--dur-fast) var(--ease-out),
              background-color var(--dur-fast) var(--ease-out),
              outline-color var(--dur-fast) var(--ease-out);
}
.u-s-sm .u-input { --h: var(--field-sm); font-size: var(--fs-small); padding-inline: var(--s-4); }
.u-s-md .u-input { --h: var(--field-md); }
.u-s-lg .u-input { --h: var(--field-lg); font-size: var(--fs-lead); padding-inline: var(--s-6); }

.u-input::placeholder { color: var(--fg-subtle); }

.u-input:hover:not(:disabled):not(:read-only) { border-color: var(--fg-subtle); }

/* Focus uses the same ring as every other control, plus an accent border
   so the field still reads as focused for anyone who cannot see the ring
   colour against their background. */
.u-input:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 0;
  border-color: var(--accent);
}

.u-invalid .u-input { border-color: var(--danger-text); }
.u-invalid .u-input:focus-visible {
  outline-color: color-mix(in srgb, var(--danger-text) 40%, transparent);
}

.u-input:disabled {
  opacity: .5;
  cursor: not-allowed;
  background: var(--fill-quiet);
}
.u-input:read-only:not(:disabled) {
  background: var(--fill-quiet);
  border-color: var(--border);
}

.u-msg {
  margin: 0;
  font: var(--w-regular) var(--fs-caption)/1.4 var(--font-sans);
  letter-spacing: var(--tr-caption);
  color: var(--fg-muted);
}
.u-msg.u-err { color: var(--danger-text); }
</style>
