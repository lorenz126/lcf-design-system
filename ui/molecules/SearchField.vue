<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'

/**
 * SearchField — a filled search pill for application chrome.
 *
 * NOT A FLAG ON INPUT, and the reason is that it is not the same thing.
 * Input is a labelled form field: it sits in a form, it carries a label,
 * help text and an error, and its border says "this is an editable box"
 * next to text that is not. A search field lives in chrome, has no label
 * because the glyph is the label, and its ground is what marks it out
 * rather than an outline. Adding `variant`, `leadingIcon` and
 * `clearable` to Input to reach this would have made one component
 * answer two jobs and get both slightly wrong.
 *
 * The clear button is a real button, so it is reachable without a mouse
 * — and Escape clears too, because that is what everyone tries first.
 * Both go through the same `clear()`.
 */
withDefaults(defineProps<{
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  /** Fills the width it is given. Chrome usually wants this. */
  block?: boolean
  disabled?: boolean
  /** Accessible name. The glyph is not one. */
  label?: string
  id?: string
}>(), { size: 'md', placeholder: 'Search', label: 'Search' })

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ clear: [] }>()

const uid = useId()
const field = useTemplateRef<HTMLInputElement>('field')

function clear() {
  model.value = ''
  emit('clear')
  // Clearing and then losing the field is how you end up typing into the
  // page instead of the box.
  field.value?.focus()
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && model.value) {
    // Stop it here: an Escape that clears the field must not also close
    // the dialog or menu the field happens to be sitting in.
    e.preventDefault()
    e.stopPropagation()
    clear()
  }
}

/** Focus the field from outside — a ⌘K shortcut, a toolbar button. */
defineExpose({ focus: () => field.value?.focus() })
</script>

<template>
  <div class="u-sf" :class="[`u-s-${size}`, { 'u-sf-block': block, 'u-sf-off': disabled }]">
    <UiIcon :is="Search" size="sm" class="u-sf-glyph" />
    <input
      :id="id ?? `sf-${uid}`"
      ref="field"
      v-model="model"
      type="search"
      class="u-sf-input"
      :placeholder="placeholder"
      :aria-label="label"
      :disabled="disabled"
      @keydown="onKey"
    >
    <button
      v-if="model"
      type="button"
      class="u-sf-clear"
      aria-label="Clear search"
      @click="clear"
    ><UiIcon :is="X" size="sm" /></button>
  </div>
</template>

<style scoped>
.u-sf {
  display: inline-flex;
  align-items: center;
  gap: var(--s-3);
  height: var(--h);
  padding-inline: var(--s-5);
  border-radius: var(--r-full);
  /* The ground marks the field out, not an outline. Translucent rather
     than a grey token, so it reads the same on the page, on a card and
     in a top bar without anyone choosing which. */
  background: var(--fill-quiet);
  color: var(--fg);
  transition: background-color var(--dur-fast) var(--ease-out);
}
.u-sf-block { display: flex; width: 100%; }
.u-sf:hover:not(.u-sf-off) { background: var(--fill); }
.u-sf:focus-within {
  background: var(--fill);
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 1px;
}
.u-sf-off { opacity: .5; }

.u-s-sm { --h: var(--control-sm); --fs: var(--fs-small); }
.u-s-md { --h: var(--control-md); --fs: var(--fs-small); }
.u-s-lg { --h: var(--control-lg); --fs: var(--fs-body); }

.u-sf-glyph { flex: none; color: var(--fg-subtle); }

.u-sf-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  font: var(--w-regular) var(--fs)/1 var(--font-sans);
  letter-spacing: var(--tr-small);
}
.u-sf-input:focus { outline: none; }
.u-sf-input::placeholder { color: var(--fg-subtle); }
/* The platform's own clear affordance is unstyleable and appears in one
   browser only, which makes it a difference nobody asked for. */
.u-sf-input::-webkit-search-cancel-button,
.u-sf-input::-webkit-search-decoration { appearance: none; }

.u-sf-clear {
  flex: none;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  margin-inline-end: calc(var(--s-2) * -1);
  padding: 0;
  border: 0;
  border-radius: var(--r-full);
  background: transparent;
  color: var(--fg-subtle);
  cursor: pointer;
}
.u-sf-clear:hover { background: var(--fill-strong); color: var(--fg); }
.u-sf-clear:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 1px;
}
</style>
