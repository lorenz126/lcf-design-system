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

const props = withDefaults(defineProps<{
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

const uid = useId()
const fieldId = computed(() => props.id ?? `s-${uid}`)
const msgId = computed(() => `sm-${uid}`)
</script>

<template>
  <div class="u-field" :class="[`u-s-${size}`, { 'u-block': block, 'u-invalid': !!error }]">
    <label v-if="label" :for="fieldId" class="u-label">
      {{ label }}<span v-if="required" class="u-req" aria-hidden="true">*</span>
    </label>

    <div class="u-select-shell">
      <select
        :id="fieldId"
        class="u-select"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error || help ? msgId : undefined"
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

    <p v-if="error || help" :id="msgId" class="u-msg" :class="{ 'u-err': !!error }">
      {{ error || help }}
    </p>
  </div>
</template>

<style scoped>
.u-field { display: inline-flex; flex-direction: column; gap: var(--s-2); }
.u-block { display: flex; width: 100%; }
.u-label {
  font: var(--w-medium) var(--fs-small)/1.3 var(--font-sans);
  letter-spacing: var(--tr-small); color: var(--fg);
}
.u-req { color: var(--danger-text); margin-inline-start: 2px; }

/* Named defensively. Scoped styles stop this component's rules leaking
   OUT; they do nothing to stop a consumer's global rules leaking IN. A
   class called .wrap collided with a global .wrap and inherited 140px of
   padding. Component classes in this layer carry a u- prefix for that
   reason. */
.u-select-shell { position: relative; display: flex; }

.u-select {
  --h: var(--field-md);
  appearance: none;
  width: 100%;
  height: var(--h);
  /* Room for the chevron, which is not part of the text flow. */
  padding-inline: var(--s-5) var(--s-8);
  color: var(--fg);
  background: var(--bg);
  border: var(--border-width) solid var(--border-strong);
  border-radius: min(var(--r-control), calc(var(--h) * 0.4));
  font: var(--w-regular) var(--fs-body)/1 var(--font-sans);
  letter-spacing: var(--tr-body);
  cursor: pointer;
  transition: border-color var(--dur-fast) var(--ease-out);
}
.u-s-sm .u-select { --h: var(--field-sm); font-size: var(--fs-small); padding-inline: var(--s-4) var(--s-7); }
.u-s-lg .u-select { --h: var(--field-lg); font-size: var(--fs-lead); }

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

.u-invalid .u-select { border-color: var(--danger-text); }
.u-invalid .u-select:focus-visible {
  outline-color: color-mix(in srgb, var(--danger-text) 40%, transparent);
}

.u-msg {
  margin: 0;
  font: var(--w-regular) var(--fs-caption)/1.4 var(--font-sans);
  letter-spacing: var(--tr-caption); color: var(--fg-muted);
}
.u-msg.u-err { color: var(--danger-text); }
</style>
