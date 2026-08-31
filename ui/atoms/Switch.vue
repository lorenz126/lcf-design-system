<script setup lang="ts">
/**
 * Switch — a checkbox with role="switch".
 *
 * Still a native input: role="switch" changes how it is announced, not how
 * it behaves. A switch takes effect immediately; if the change only lands
 * on Save, that is a checkbox and should look like one.
 */
const props = defineProps<{
  modelValue?: boolean
  label?: string
  help?: string
  disabled?: boolean
  /** Supply one when something outside has to reference the control —
   *  an error summary linking to it, for instance. Generated otherwise. */
  id?: string
}>()

defineEmits<{ 'update:modelValue': [boolean] }>()

const uid = useId()
const id = computed(() => props.id ?? `sw-${uid}`)
</script>

<template>
  <div class="u-row" :class="{ 'u-disabled': disabled }">
    <input
      :id="id"
      type="checkbox"
      role="switch"
      class="u-track"
      :checked="modelValue"
      :disabled="disabled"
      :aria-describedby="help ? `${id}-h` : undefined"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    >
    <div v-if="label || help" class="u-text">
      <label :for="id" class="u-label">{{ label }}</label>
      <p v-if="help" :id="`${id}-h`" class="u-help">{{ help }}</p>
    </div>
  </div>
</template>

<style scoped>
.u-row { display: flex; gap: var(--s-5); align-items: start; }

.u-track {
  appearance: none;
  position: relative;
  width: 34px; height: 20px; flex: none; margin: 0;
  border-radius: var(--r-full);
  background: var(--fill-strong);
  cursor: pointer;
  transition: background-color var(--dur-base) var(--ease-out);
}
.u-track::after {
  content: "";
  position: absolute;
  inset-block-start: 2px; inset-inline-start: 2px;
  width: 16px; height: 16px;
  border-radius: var(--r-full);
  background: #fff;
  box-shadow: var(--shadow-1);
  /* The one place the spring easing earns its keep: a switch is a physical
     metaphor, so the knob should overshoot slightly and settle. */
  transition: translate var(--dur-base) var(--ease-spring);
}
.u-track:checked { background: var(--accent); }
.u-track:checked::after { translate: 14px 0; }

.u-track:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 2px;
}
.u-track:disabled { opacity: .5; cursor: not-allowed; }

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
