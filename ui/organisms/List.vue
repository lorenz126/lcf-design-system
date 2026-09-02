<script setup lang="ts">
/**
 * List — rows driven by data.
 *
 * An organism because it owns a data shape: it is handed items and
 * decides how they become rows, rather than being a container you fill
 * yourself. That distinction is the whole reason for the tier.
 *
 * Selection uses real checkboxes, so the space bar, shift-click ranges
 * from the browser, and screen-reader announcement all come along. A
 * list of divs with click handlers has none of that.
 */
export interface ListItem {
  id: string | number
  label: string
  description?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  items: ListItem[]
  /** 'none' renders plain rows; 'single'/'multiple' add selection. */
  select?: 'none' | 'single' | 'multiple'
  loading?: boolean
  /** Title of the default empty state. Replace the whole block with the
   *  `empty` slot when it deserves a description and a way out. */
  emptyText?: string
  /** Rows become buttons. Mutually exclusive with selection. */
  interactive?: boolean
  dividers?: boolean
}>(), { select: 'none', emptyText: 'Nothing here yet.', dividers: true })

const selected = defineModel<(string | number)[]>('selected', { default: () => [] })
const emit = defineEmits<{ activate: [ListItem] }>()

const uid = useId()
const groupName = computed(() => `list-${uid}`)

function isOn(id: string | number) { return selected.value.includes(id) }

function toggle(item: ListItem) {
  if (item.disabled) return
  if (props.select === 'single') {
    selected.value = isOn(item.id) ? [] : [item.id]
  } else {
    selected.value = isOn(item.id)
      ? selected.value.filter(x => x !== item.id)
      : [...selected.value, item.id]
  }
}
</script>

<template>
  <div class="u-list" :class="{ 'u-list-dividers': dividers }" role="list">
    <div v-if="loading" class="u-list-state">
      <UiSpinner size="sm" />
      <span>Loading…</span>
    </div>

    <slot v-else-if="!items.length" name="empty">
      <UiEmptyState size="sm" :title="emptyText" />
    </slot>

    <template v-else>
      <div
        v-for="item in items"
        :key="item.id"
        class="u-list-row"
        :class="{ 'u-list-on': isOn(item.id), 'u-list-off': item.disabled }"
        role="listitem"
      >
        <UiCheckbox
          v-if="select === 'multiple'"
          :model-value="isOn(item.id)"
          :disabled="item.disabled"
          @update:model-value="toggle(item)"
        />
        <UiRadio
          v-else-if="select === 'single'"
          :model-value="isOn(item.id) ? String(item.id) : ''"
          :value="String(item.id)"
          :name="groupName"
          :disabled="item.disabled"
          @update:model-value="toggle(item)"
        />

        <component
          :is="interactive ? 'button' : 'div'"
          class="u-list-main"
          :disabled="interactive && item.disabled ? true : undefined"
          @click="interactive && !item.disabled && emit('activate', item)"
        >
          <slot name="item" :item="item">
            <span class="u-list-label">{{ item.label }}</span>
            <span v-if="item.description" class="u-list-desc">{{ item.description }}</span>
          </slot>
        </component>

        <div v-if="$slots.trailing" class="u-list-trailing">
          <slot name="trailing" :item="item" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.u-list { display: flex; flex-direction: column; }

.u-list-row {
  display: flex;
  align-items: flex-start;
  gap: var(--s-5);
  padding: var(--s-5) var(--s-6);
}
.u-list-dividers .u-list-row + .u-list-row {
  border-top: var(--border-width) solid var(--border);
}
.u-list-on { background: var(--accent-subtle); }
.u-list-off { opacity: .55; }

.u-list-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  /* Reset only what a button brings; the div case inherits nothing. */
  border: 0; background: transparent; padding: 0; margin: 0;
  text-align: start; font: inherit; color: inherit;
}
button.u-list-main { cursor: pointer; }
button.u-list-main:disabled { cursor: not-allowed; }
button.u-list-main:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 2px;
  border-radius: var(--r-xs);
}

.u-list-label {
  font: var(--w-regular) var(--fs-body)/1.35 var(--font-sans);
  letter-spacing: var(--tr-body);
}
.u-list-desc {
  font: var(--w-regular) var(--fs-caption)/1.4 var(--font-sans);
  color: var(--fg-muted);
}
.u-list-trailing { flex: none; display: flex; align-items: center; gap: var(--s-4); }

.u-list-state {
  display: flex; align-items: center; justify-content: center; gap: var(--s-4);
  margin: 0; padding: var(--s-10) var(--s-6);
  color: var(--fg-muted);
  font: var(--w-regular) var(--fs-small)/1.4 var(--font-sans);
}
</style>
