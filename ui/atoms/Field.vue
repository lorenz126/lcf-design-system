<script setup lang="ts">
/**
 * Field — the label, the message, and the wiring between them.
 *
 * AN ATOM, and it took a moment to be sure. Field would read as a
 * molecule — it is a small composition with one job — except that its
 * callers are Input, Select, Textarea and Slider, and the first three of
 * those are atoms. An atom that cannot use it is an atom that keeps its
 * own copy, which is the situation this exists to end.
 *
 * The definition settles it rather than the convenience: an atom is a
 * primitive that does not decompose into smaller parts of the layer, and
 * Field composes nothing from ui/ at all. It is a label, a slot and a
 * paragraph. Button already uses Spinner on the same footing.
 *
 * WHAT IT DOES NOT COVER is the checkbox family. Checkbox, Radio and
 * Switch put their label BESIDE the control, with the control first, so
 * wrapping them would mean a wrapper with a hole in the middle. The five
 * files that looked like one duplication are two: four fields that stack,
 * and three controls that sit in a row. Only the first is this.
 *
 * The id is generated here and handed back through the slot, along with
 * the two attributes that have to agree with it. That is the actual
 * defect this prevents: a label pointing at nothing, or help text that
 * exists on screen and not in the accessibility tree.
 *
 * Sizing is a CONTRACT, not an accident: this sets --fld-h, --fld-fs and
 * --fld-pad from `size`, and the control inside reads them. A control
 * that reached back up with a descendant selector would break the moment
 * it was used anywhere else.
 */
const props = withDefaults(defineProps<{
  label?: string
  help?: string
  /** Replaces the help text and turns the field invalid. */
  error?: string
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  /** Supply one when something outside has to reference the control —
   *  an error summary linking to it, or a label rendered elsewhere. */
  id?: string
}>(), { size: 'md' })

const uid = useId()
const fieldId = computed(() => props.id ?? `f-${uid}`)
const msgId = computed(() => `${fieldId.value}-m`)

const message = computed(() => props.error || props.help)
</script>

<template>
  <div
    class="u-fld"
    :class="[`u-s-${size}`, { 'u-block': block, 'u-invalid': !!error }]"
  >
    <label v-if="label" :for="fieldId" class="u-fld-label">
      {{ label }}
      <span v-if="required" class="u-fld-req" aria-hidden="true">*</span>
    </label>

    <slot
      :id="fieldId"
      :described-by="message ? msgId : undefined"
      :invalid="error ? true : undefined"
    />

    <p v-if="message" :id="msgId" class="u-fld-msg" :class="{ 'u-fld-err': !!error }">
      {{ message }}
    </p>
  </div>
</template>

<style scoped>
.u-fld {
  display: inline-flex;
  flex-direction: column;
  gap: var(--s-2);
  /* Read by whatever control sits in the slot. */
  --fld-h: var(--field-md);
  --fld-fs: var(--fs-body);
  --fld-pad: var(--s-5);
}
.u-block { display: flex; width: 100%; }

.u-s-sm { --fld-h: var(--field-sm); --fld-fs: var(--fs-small); --fld-pad: var(--s-4); }
.u-s-md { --fld-h: var(--field-md); --fld-fs: var(--fs-body);  --fld-pad: var(--s-5); }
.u-s-lg { --fld-h: var(--field-lg); --fld-fs: var(--fs-lead);  --fld-pad: var(--s-6); }

.u-fld-label {
  font: var(--w-medium) var(--fs-small)/1.3 var(--font-sans);
  letter-spacing: var(--tr-small);
  color: var(--fg);
}
.u-fld-req { color: var(--danger-text); }

.u-fld-msg {
  margin: 0;
  font: var(--w-regular) var(--fs-caption)/1.4 var(--font-sans);
  letter-spacing: var(--tr-caption);
  color: var(--fg-muted);
}
.u-fld-err { color: var(--danger-text); }
</style>
