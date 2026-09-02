<script setup lang="ts">
/**
 * Select — a styled native <select>.
 *
 * Native on purpose. A custom listbox means rebuilding typeahead, option
 * scrolling, and the platform picker that mobile users expect, all to gain
 * styling of the dropdown itself — which no browser lets you style anyway.
 * When the options need icons or descriptions, that is a different
 * component (a Combobox), not a flag on this one.
 */
import { ChevronDown } from 'lucide-vue-next'

export interface Option { value: string; label: string; disabled?: boolean }

withDefaults(defineProps<{
  modelValue?: string
  options: Option[]
  label?: string
  help?: string
  error?: string
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  required?: boolean
  block?: boolean
  /** Supply one when something outside has to reference the field —
   *  an error summary linking to it, or a label rendered elsewhere.
   *  Generated when omitted. */
  id?: string
}>(), { size: 'md' })

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
      <div class="u-select-shell">
        <select
          :id="fieldId"
          class="u-select"
          :value="modelValue"
          :disabled="disabled"
          :required="required"
          :aria-invalid="invalid"
          :aria-describedby="describedBy"
          @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
        >
          <option v-if="placeholder" value="" disabled :selected="!modelValue">
            {{ placeholder }}
          </option>
          <option v-for="o in options" :key="o.value" :value="o.value" :disabled="o.disabled">
            {{ o.label }}
          </option>
        </select>

        <UiIcon :is="ChevronDown" size="sm" class="u-chevron" />
      </div>
    </template>
  </UiField>
</template>

<style scoped>
/* Named defensively. Scoped styles stop this component's rules leaking
   OUT; they do nothing to stop a consumer's global rules leaking IN. A
   class called .wrap collided with a global .wrap and inherited 140px of
   padding. Component classes in this layer carry a u- prefix for that
   reason. */
.u-select-shell { position: relative; display: flex; }

.u-select {
  appearance: none;
  width: 100%;
  /* Set by Field from `size`; the fallback is for a bare select. */
  height: var(--fld-h, var(--field-md));
  /* Room for the chevron, which is not part of the text flow. */
  padding-inline: var(--fld-pad, var(--s-5)) var(--s-8);
  color: var(--fg);
  background: var(--bg);
  border: var(--border-width) solid var(--border-strong);
  border-radius: min(var(--r-control), calc(var(--fld-h, var(--field-md)) * 0.4));
  font: var(--w-regular) var(--fld-fs, var(--fs-body))/1 var(--font-sans);
  letter-spacing: var(--tr-body);
  cursor: pointer;
  transition: border-color var(--dur-fast) var(--ease-out);
}
.u-s-sm .u-select { padding-inline-end: var(--s-7); }

.u-select:hover:not(:disabled) { border-color: var(--fg-subtle); }
.u-select:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  border-color: var(--accent);
}
.u-select:disabled { opacity: .5; cursor: not-allowed; background: var(--fill-quiet); }

.u-chevron {
  position: absolute; inset-inline-end: var(--s-5); top: 50%;
  translate: 0 -50%;
  color: var(--fg-muted); pointer-events: none;
}
.u-s-sm .u-chevron { inset-inline-end: var(--s-4); }
.u-select:disabled + .u-chevron { opacity: .5; }

/* Both of these hang off Field's root, which Vue also stamps with this
   component's scope id. */
.u-invalid .u-select { border-color: var(--danger-text); }
.u-invalid .u-select:focus-visible {
  outline-color: color-mix(in srgb, var(--danger-text) 40%, transparent);
}
</style>
