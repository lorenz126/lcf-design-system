<script setup lang="ts">
/**
 * Textarea — several lines of text.
 *
 * Missing until now, which the demo application found the hard way: it
 * collected an issue description in a single-line Input, and that was
 * wrong the moment it was written.
 *
 * GROWING WITH ITS CONTENT is the only interesting part. `field-sizing:
 * content` does it in one declaration and is not everywhere yet, so this
 * is the same shape as the anchor-positioning decision in useAnchored:
 * take the good path where it exists, keep the fallback small enough to
 * delete later, and say which is which.
 *
 * The fallback measures scrollHeight, which requires resetting the height
 * first — a textarea's scrollHeight never shrinks on its own, so without
 * that reset it grows and never comes back down.
 *
 * A COUNTER REPORTS, IT DOES NOT BLOCK. `maxLength` here sets no
 * maxlength attribute: silently refusing keystrokes is the same lie as
 * refusing a kanban card over a WIP limit — the text does not get
 * shorter, it gets finished somewhere else and pasted in. The count
 * turns red, the form decides what to do about it.
 */
const props = withDefaults(defineProps<{
  label?: string
  help?: string
  error?: string
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  id?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  /** Starting height. Also the floor when it grows. */
  rows?: number
  /** Stop growing here and scroll instead. */
  maxRows?: number
  autoGrow?: boolean
  /** Shows a count. Advisory — see above. */
  maxLength?: number
}>(), { size: 'md', rows: 3, autoGrow: true })

const model = defineModel<string>({ default: '' })

const el = useTemplateRef<HTMLTextAreaElement>('el')
const over = computed(() => !!props.maxLength && model.value.length > props.maxLength)

/** Only used where field-sizing is missing; see the note above. */
function measure() {
  const t = el.value
  if (!props.autoGrow || !t) return
  if (CSS.supports?.('field-sizing', 'content')) return
  t.style.height = 'auto'
  const line = parseFloat(getComputedStyle(t).lineHeight) || 20
  const cap = props.maxRows ? props.maxRows * line + 16 : Infinity
  t.style.height = `${Math.min(t.scrollHeight, cap)}px`
  t.style.overflowY = t.scrollHeight > cap ? 'auto' : 'hidden'
}

onMounted(measure)
watch(model, () => nextTick(measure))
</script>

<template>
  <UiField
    :id="id"
    :label="label"
    :help="help"
    :error="error"
    :required="required"
    :size="size"
    :block="block"
  >
    <template #default="{ id: fieldId, describedBy, invalid }">
      <textarea
        :id="fieldId"
        ref="el"
        v-model="model"
        class="u-ta"
        :class="{ 'u-ta-grow': autoGrow }"
        :rows="rows"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :aria-invalid="invalid"
        :aria-describedby="describedBy"
        :style="maxRows ? { '--ta-max': maxRows } : undefined"
      />
      <p v-if="maxLength" class="u-ta-count" :class="{ 'u-ta-over': over }">
        {{ model.length }} / {{ maxLength }}
      </p>
    </template>
  </UiField>
</template>

<style scoped>
.u-ta {
  width: 100%;
  min-height: var(--fld-h, var(--field-md));
  padding: var(--s-4) var(--fld-pad, var(--s-5));
  color: var(--fg);
  background: var(--bg);
  border: var(--border-width) solid var(--border-strong);
  border-radius: var(--r-md);
  font: var(--w-regular) var(--fld-fs, var(--fs-body))/1.5 var(--font-sans);
  letter-spacing: var(--tr-body);
  /* Sideways is never what a paragraph wants; downwards is the browser's
     job when it runs out of room. */
  resize: vertical;
  transition: border-color var(--dur-fast) var(--ease-out);
}

/* The one-declaration path. Where it exists, measure() returns early and
   nothing runs on input at all. */
@supports (field-sizing: content) {
  .u-ta-grow {
    field-sizing: content;
    max-height: calc(var(--ta-max, 12) * 1.5em + var(--s-8));
    resize: none;
  }
}

.u-ta::placeholder { color: var(--fg-subtle); }
.u-ta:hover:not(:disabled):not(:read-only) { border-color: var(--fg-subtle); }
.u-ta:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 0;
  border-color: var(--accent);
}
.u-ta:disabled { opacity: .5; cursor: not-allowed; background: var(--fill-quiet); }
.u-ta:read-only:not(:disabled) { background: var(--fill-quiet); border-color: var(--border); }

.u-invalid .u-ta { border-color: var(--danger-text); }
.u-invalid .u-ta:focus-visible {
  outline-color: color-mix(in srgb, var(--danger-text) 40%, transparent);
}

.u-ta-count {
  margin: 0;
  align-self: flex-end;
  color: var(--fg-subtle);
  font: var(--w-regular) var(--fs-micro)/1 var(--font-sans);
  font-variant-numeric: tabular-nums;
}
.u-ta-over { color: var(--danger-text); }
</style>
