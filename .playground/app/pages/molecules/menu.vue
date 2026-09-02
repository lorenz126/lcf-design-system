<script setup lang="ts">
import type { MenuItem } from '../../../../ui/molecules/Menu.vue'
import { Archive, Check, Copy, MoreHorizontal, Pencil, Share2, Trash2 } from 'lucide-vue-next'
const lastAction = ref('—')

const actions: MenuItem[] = [
  { id: 'rename', label: 'Rename', icon: Pencil, shortcut: '⏎' },
  { id: 'duplicate', label: 'Duplicate', icon: Copy, shortcut: '⌘D' },
  { id: 'share', label: 'Share…', icon: Share2 },
  { id: 'archive', label: 'Archive', icon: Archive, disabled: true },
  { id: 'delete', label: 'Delete', icon: Trash2, danger: true, divider: true, shortcut: '⌫' }
]

const shown = ref<Record<string, boolean>>({ done: true, archived: false, drafts: true })
const view = computed<MenuItem[]>(() => [
  { id: 'done', label: 'Completed', checked: shown.value.done },
  { id: 'archived', label: 'Archived', checked: shown.value.archived },
  { id: 'drafts', label: 'Drafts', checked: shown.value.drafts },
  { id: 'reset', label: 'Reset to defaults', divider: true }
])

function onView(item: MenuItem) {
  if (item.id === 'reset') { shown.value = { done: true, archived: false, drafts: true }; return }
  shown.value = { ...shown.value, [item.id]: !shown.value[item.id as string] }
}
useHead({ title: 'Menu — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Where the browser stops helping.</p>
      <p class="t-body body">
        <NuxtLink to="/molecules/popover">Popover</NuxtLink> gives it the top layer
        and the light dismiss. The roving tabindex, the typeahead and the wrap at both
        ends are ours, because no element does them — which is exactly the threshold at
        which a component earns its code.
      </p>
    </div>

    <section>
      <div class="sec-label">Actions, and a view menu</div>
      <div class="row">
        <UiMenu :items="actions" label="Report actions" @select="lastAction = $event.label">
          <template #trigger="{ props: p }">
            <UiButton variant="outline" tone="neutral" v-bind="p">
              <template #leading><UiIcon :is="MoreHorizontal" /></template>
              Actions
            </UiButton>
          </template>
        </UiMenu>

        <UiMenu :items="view" label="What to show" align="end" @select="onView">
          <template #trigger="{ props: p }">
            <UiButton variant="plain" tone="neutral" v-bind="p">
              <template #leading><UiIcon :is="Check" /></template>
              View
            </UiButton>
          </template>
        </UiMenu>

        <span class="t-small dim">Last action: {{ lastAction }}</span>
      </div>
      <p class="t-caption hint">
        Open it and put the mouse down. Arrows move and wrap past the disabled row,
        Home and End jump to the ends, and typing jumps by name — press
        <strong>d</strong> twice and it cycles Duplicate, Delete. Tab closes the menu
        and carries on to the next control rather than trapping you.
      </p>
      <p class="t-caption hint">
        <strong>Enter and Space are not handled at all.</strong> Every row is a real
        <code>&lt;button&gt;</code>, so the browser already activates it — the same
        rule that makes the trigger use <code>popovertarget</code> instead of a click
        handler. The second menu uses <code>menuitemcheckbox</code>; it emits and the
        page owns the state, because a menu that remembers is a second source of truth.
      </p>
    </section>
  </div>
</template>

<style scoped>
.dim { color: var(--ink-3); }
</style>
