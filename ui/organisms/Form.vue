<script setup lang="ts">
/**
 * Form — submission and error orchestration around the controls.
 *
 * It adds no input of its own. What it owns is the part every form gets
 * wrong on its own: where errors are announced, what happens on submit,
 * and what the whole thing does while it is busy.
 *
 * `novalidate` is deliberate. Native validation shows a browser tooltip
 * on one field at a time, vanishes on blur, cannot be styled, and is
 * announced inconsistently. Turning it off and rendering errors ourselves
 * is the only way they can be persistent, styled, and summarised.
 */
const props = withDefaults(defineProps<{
  /** Keyed by field id, so the summary can link straight to the input.
   *  Pass `id` on the field to control that key. */
  errors?: Record<string, string>
  busy?: boolean
  summaryTitle?: string
}>(), { summaryTitle: 'Please fix the following' })

const emit = defineEmits<{ submit: [] }>()

const entries = computed(() => Object.entries(props.errors ?? {}))
const summary = useTemplateRef<HTMLElement>('summary')

/** On a failed submit, move focus to the summary. Without this the
 *  errors appear above a keyboard user's position and are never
 *  announced — the form simply seems not to submit. */
watch(entries, (now, before) => {
  if (now.length && now.length !== before?.length) {
    nextTick(() => summary.value?.focus())
  }
})

function onSubmit() {
  if (props.busy) return
  emit('submit')
}
</script>

<template>
  <form class="u-form" novalidate @submit.prevent="onSubmit">
    <div
      v-if="entries.length"
      ref="summary"
      class="u-form-summary"
      role="alert"
      tabindex="-1"
    >
      <p class="u-form-summary-title">{{ summaryTitle }}</p>
      <ul class="u-form-summary-list">
        <li v-for="[id, message] in entries" :key="id">
          <a :href="`#${id}`">{{ message }}</a>
        </li>
      </ul>
    </div>

    <!-- disabled on a fieldset disables everything inside it, including
         the submit button, without touching a single field. -->
    <fieldset class="u-form-body" :disabled="busy">
      <slot />
    </fieldset>

    <div v-if="$slots.actions" class="u-form-actions">
      <slot name="actions" :busy="busy" />
    </div>
  </form>
</template>

<style scoped>
.u-form { display: flex; flex-direction: column; gap: var(--s-8); }
.u-form-body {
  border: 0; margin: 0; padding: 0; min-width: 0;
  display: flex; flex-direction: column; gap: var(--s-8);
}
.u-form-body:disabled { opacity: .6; }

.u-form-summary {
  border: var(--border-width) solid var(--danger-text);
  border-radius: var(--r-md);
  background: var(--red-fill);
  padding: var(--s-5) var(--s-6);
  color: var(--danger-text);
}
.u-form-summary:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 2px;
}
.u-form-summary-title {
  margin: 0 0 var(--s-3);
  font: var(--w-semibold) var(--fs-body)/1.4 var(--font-sans);
}
.u-form-summary-list {
  margin: 0; padding-inline-start: var(--s-6);
  font: var(--w-regular) var(--fs-small)/1.6 var(--font-sans);
}
.u-form-summary-list a { color: inherit; }

.u-form-actions { display: flex; gap: var(--s-4); }
</style>
