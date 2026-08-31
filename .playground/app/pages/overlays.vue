<script setup lang="ts">
import { Info, MoreHorizontal, Trash2 } from 'lucide-vue-next'
useHead({ title: 'Overlays — Design Framework' })

const menu = ref(false)
const confirm = ref(false)
const required = ref(false)
const lastAction = ref('—')
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
      <div class="sec-label">Popover</div>
      <div class="row">
        <UiPopover v-model:open="menu" placement="bottom">
          <template #trigger="{ props: p }">
            <UiButton variant="outline" tone="neutral" v-bind="p">
              <template #leading><UiIcon :is="MoreHorizontal" /></template>
              Actions
            </UiButton>
          </template>
          <template #default="{ close }">
            <div class="menu">
              <button class="mi" @click="lastAction = 'Renamed'; close()">Rename</button>
              <button class="mi" @click="lastAction = 'Duplicated'; close()">Duplicate</button>
              <div class="sep" />
              <button class="mi danger" @click="lastAction = 'Deleted'; close()">
                <UiIcon :is="Trash2" size="sm" /> Delete
              </button>
            </div>
          </template>
        </UiPopover>
        <span class="t-small dim">Last action: {{ lastAction }}</span>
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

.menu { display: flex; flex-direction: column; min-width: 170px; margin: calc(var(--s-5) * -1); padding: var(--s-3); }
.mi {
  display: flex; align-items: center; gap: var(--s-4);
  padding: var(--s-3) var(--s-4); border: 0; background: transparent;
  border-radius: var(--r-sm); cursor: pointer; text-align: left;
  font: var(--w-regular) var(--fs-body)/1 var(--font-sans); color: var(--fg);
}
.mi:hover { background: var(--fill); }
.mi.danger { color: var(--danger-text); }
.sep { height: 1px; background: var(--border); margin: var(--s-2) 0; }
</style>
