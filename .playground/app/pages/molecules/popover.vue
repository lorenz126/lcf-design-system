<script setup lang="ts">
import { SlidersHorizontal } from 'lucide-vue-next'
const onlyMine = ref(true)
useHead({ title: 'Popover — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">The same top layer, with something you can reach into.</p>
      <p class="t-body body">
        The browser already built most of this. It renders in the
        <strong>top layer</strong> via the popover attribute, so nothing can clip it
        with an ancestor’s overflow and it needs no z-index at all.
      </p>
    </div>

    <section>
      <div class="sec-label">A filter panel</div>
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
  </div>
</template>

<style scoped>
.panel { display: flex; flex-direction: column; gap: var(--s-5); min-width: 220px; }
.panel-foot { display: flex; justify-content: flex-end; gap: var(--s-4); }
</style>
