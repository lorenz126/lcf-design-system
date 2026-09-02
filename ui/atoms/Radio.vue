<script setup lang="ts">
/**
 * Radio — a styled native input.
 *
 * `name` is required rather than optional: a radio without a group is a
 * checkbox that cannot be unchecked, and the shared name is what gives
 * arrow-key navigation between options. Making it required stops that
 * being discovered later.
 */
const props = defineProps<{
  modelValue?: string
  value: string
  name: string
  label?: string
  help?: string
  disabled?: boolean
  /** Supply one when something outside has to reference the control —
   *  an error summary linking to it, for instance. Generated otherwise. */
  id?: string
}>()

/**
 * UNMATCHED ATTRIBUTES GO ON THE INPUT, not on the wrapper.
 *
 * By default Vue puts them on the root element, which here is the
 * <div> holding the box and the label — so `aria-label` landed on a
 * div and named nothing. That is how Table and List shipped a column of
 * selection checkboxes a screen reader announces as "checkbox, checkbox,
 * checkbox", with no way for the caller to fix it from outside.
 *
 * name, required, form, aria-* and data-* all belong to the control
 * rather than to the box drawn around it.
 */
defineOptions({ inheritAttrs: false })

defineEmits<{ 'update:modelValue': [string] }>()

const uid = useId()
const id = computed(() => props.id ?? `r-${uid}`)
</script>

<template>
  <div class="u-row" :class="{ 'u-disabled': disabled }">
    <input
      v-bind="$attrs"
      :id="id"
      type="radio"
      class="u-dot"
      :name="name"
      :value="value"
      :checked="modelValue === value"
      :disabled="disabled"
      :aria-describedby="help ? `${id}-h` : undefined"
      @change="$emit('update:modelValue', value)"
    >
    <div v-if="label || help" class="u-text">
      <label :for="id" class="u-label">{{ label }}</label>
      <p v-if="help" :id="`${id}-h`" class="u-help">{{ help }}</p>
    </div>
  </div>
</template>

<style scoped>
.u-row { display: flex; gap: var(--s-4); align-items: start; }

.u-dot {
  appearance: none;
  width: 16px; height: 16px; flex: none; margin: 0;
  margin-block-start: 1px;
  border: var(--border-width) solid var(--border-strong);
  border-radius: var(--r-full);
  background: var(--bg);
  cursor: pointer;
  transition: border-color var(--dur-fast) var(--ease-out),
              border-width var(--dur-fast) var(--ease-out);
}
.u-dot:hover:not(:disabled) { border-color: var(--fg-subtle); }
/* Checked is a thick accent ring, not a dot on a fill — one property
   animates, and it stays crisp at any zoom. */
.u-dot:checked { border-width: 5px; border-color: var(--accent); }
.u-dot:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 1px;
}
.u-dot:disabled { opacity: .5; cursor: not-allowed; }

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
</style>
