<script setup lang="ts">
import type { MenuItem } from '../../../ui/molecules/Menu.vue'
import {
  Archive, Check, Copy, Info, MoreHorizontal, Pencil, Share2, Trash2
} from 'lucide-vue-next'
useHead({ title: 'Overlays — Design Framework' })

const rename = ref(false)
const confirm = ref(false)
const required = ref(false)
const lastAction = ref('—')
const newName = ref('Quarterly report')

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
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">The browser already built most of this.</p>
      <p class="t-body body">
        Tooltip and Popover render in the <strong>top layer</strong> via the popover
        attribute, so neither can be clipped by an ancestor’s overflow and neither
        needs a z-index. Dialog is the native <code>&lt;dialog&gt;</code>:
        <code>showModal()</code> supplies the focus trap, Escape, the inert
        background and focus returning to the trigger — five things a hand-built
        modal reimplements and usually gets one of wrong.
      </p>
    </div>

    <section>
      <div class="sec-label">Tooltip</div>
      <div class="row">
        <UiTooltip text="Deletes the project and everything in it.">
          <UiButton tone="red" variant="tinted">Delete</UiButton>
        </UiTooltip>
        <UiTooltip text="Below instead of above." placement="bottom">
          <UiButton variant="outline" tone="neutral">Placed below</UiButton>
        </UiTooltip>
        <UiTooltip text="Appears at once when focused by keyboard.">
          <UiButton variant="plain" icon-only aria-label="More information">
            <UiIcon :is="Info" />
          </UiButton>
        </UiTooltip>
      </div>
      <p class="t-caption hint">
        Hover waits 400ms; keyboard focus shows it at once, because you already
        committed by tabbing there. A tooltip is unreachable by touch and adds nothing
        for a screen reader beyond the trigger’s own name — so what it says must never
        be the only place that information exists.
      </p>
    </section>

    <section>
      <div class="sec-label">Menu</div>
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

    <section>
      <div class="sec-label">Popover</div>
      <div class="row">
        <UiPopover v-model:open="rename" placement="bottom">
          <template #trigger="{ props: p }">
            <UiButton variant="outline" tone="neutral" v-bind="p">
              <template #leading><UiIcon :is="Pencil" /></template>
              Rename
            </UiButton>
          </template>
          <template #default="{ close }">
            <div class="panel">
              <UiInput v-model="newName" label="Name" size="sm" />
              <div class="panel-foot">
                <UiButton variant="plain" tone="neutral" size="sm" @click="close">Cancel</UiButton>
                <UiButton size="sm" @click="lastAction = `Renamed to ${newName}`; close()">Save</UiButton>
              </div>
            </div>
          </template>
        </UiPopover>
        <span class="t-small dim">A popover holds anything; a menu holds commands.</span>
      </div>
      <p class="t-caption hint">
        The trigger carries <code>popovertarget</code>, so the browser owns opening
        and closing — no click handler. Driving it from JavaScript instead races the
        same click: the popover opens, the click keeps bubbling, and auto’s
        light-dismiss shuts it in the same tick.
      </p>
    </section>

    <section>
      <div class="sec-label">Dialog</div>
      <div class="row">
        <UiButton tone="red" @click="confirm = true">Delete project</UiButton>
        <UiButton variant="outline" tone="neutral" @click="required = true">
          Must be answered
        </UiButton>
      </div>

      <UiDialog v-model:open="confirm" title="Delete this project?">
        This removes the project and everything in it. It cannot be undone.
        <template #footer="{ close }">
          <UiButton variant="plain" tone="neutral" @click="close">Cancel</UiButton>
          <UiButton tone="red" @click="lastAction = 'Deleted'; close()">Delete</UiButton>
        </template>
      </UiDialog>

      <UiDialog v-model:open="required" title="Choose one" :dismissible="false">
        Escape and backdrop clicks are disabled here. There is no way out except
        answering — which is why this should be rare.
        <template #footer="{ close }">
          <UiButton variant="outline" tone="neutral" @click="close">Decline</UiButton>
          <UiButton @click="close">Accept</UiButton>
        </template>
      </UiDialog>

      <p class="t-caption hint">
        Open one and press Tab repeatedly: focus never leaves. Escape closes the first
        and not the second. Close either and focus returns to the button that opened
        it — none of that is wired up here.
      </p>
    </section>
  </div>
</template>

<style scoped>
.intro { border-left: 2px solid var(--rule); padding-left: 20px; margin-bottom: 64px; }
.lede { margin: 0 0 10px; }
.body { margin: 0; color: var(--ink-2); max-width: 68ch; }
code { font-family: var(--font-mono); font-size: 11px; }
section { margin-bottom: 64px; }
.row { display: flex; flex-wrap: wrap; gap: var(--s-6); align-items: center; }
.hint { color: var(--ink-3); margin: 14px 0 0; max-width: 68ch; line-height: 1.6; }
.dim { color: var(--ink-3); }

.panel { display: flex; flex-direction: column; gap: var(--s-5); min-width: 220px; }
.panel-foot { display: flex; justify-content: flex-end; gap: var(--s-4); }
</style>
