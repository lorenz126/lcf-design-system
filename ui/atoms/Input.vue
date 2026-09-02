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

withDefaults(defineProps<{
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
  /** Supply one when something outside has to reference the field —
   *  an error summary linking to it, or a label rendered elsewhere.
   *  Generated when omitted. */
  id?: string
}>(), { size: 'md', type: 'text' })

defineEmits<{ 'update:modelValue': [string] }>()

</script>

<template>
  <UiField
    :label="label"
    :help="help"
    :error="error"
    :required="required"
    :size="size"
    :block="block"
    :id="id"
  >
    <template #default="{ id: fieldId, describedBy, invalid }">
      <input
        :id="fieldId"
        class="u-input"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :aria-invalid="invalid"
        :aria-describedby="describedBy"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      >
    </template>
  </UiField>
</template>

<style scoped>
.u-input {
  width: 100%;
  /* Set by Field from `size`. The fallback is for an input used bare. */
  height: var(--fld-h, var(--field-md));
  padding-inline: var(--fld-pad, var(--s-5));
  color: var(--fg);
  background: var(--bg);
  border: var(--border-width) solid var(--border-strong);
  /* Same 40% cap as the button — a field is not a pill either. */
  border-radius: min(var(--r-control), calc(var(--fld-h, var(--field-md)) * 0.4));
  font: var(--w-regular) var(--fld-fs, var(--fs-body))/1 var(--font-sans);
  letter-spacing: var(--tr-body);
  transition: border-color var(--dur-fast) var(--ease-out),
              background-color var(--dur-fast) var(--ease-out),
              outline-color var(--dur-fast) var(--ease-out);
}

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

/* .u-invalid sits on Field's root, which is this component's own root
   element too — Vue stamps the parent's scope id onto a child's root, so
   the descendant selector resolves. :deep() would be wrong here: it looks
   DOWN, and this is looking up. */
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
</style>
