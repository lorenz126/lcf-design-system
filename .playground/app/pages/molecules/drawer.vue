<script setup lang="ts">
const filters = ref(false)
const sheet = ref(false)
const modalDrawer = ref(false)
useHead({ title: 'Drawer — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">A panel from an edge, and the question of whether it traps you.</p>
      <p class="t-body body">
        <code>showModal()</code> or <code>show()</code> — the same element, and the
        difference decides whether the page behind it is still yours. That is the whole
        design of this component.
      </p>
    </div>

    <section>
      <div class="sec-label">Three edges, two behaviours</div>
      <div class="row">
        <UiButton variant="outline" tone="neutral" @click="filters = true">
          <template #leading><UiIcon :is="SlidersHorizontal" /></template>
          Filters (non-modal)
        </UiButton>
        <UiButton variant="outline" tone="neutral" @click="modalDrawer = true">
          <template #leading><UiIcon :is="PanelRight" /></template>
          Details (modal)
        </UiButton>
        <UiButton variant="plain" tone="neutral" @click="sheet = true">From the bottom</UiButton>
      </div>

      <UiDrawer v-model:open="filters" :modal="false" title="Filters" side="inline-end">
        <p class="t-small dim">
          The page behind is still live — scroll it, click it, type in the search box.
          Focus is not trapped, because nothing here is a question you must answer.
        </p>
        <div class="stack">
          <UiSwitch v-model="onlyMine" label="Only mine" />
          <UiInput label="Contains" placeholder="Any word" block />
        </div>
        <template #footer="{ close }">
          <UiButton variant="plain" tone="neutral" @click="close">Reset</UiButton>
          <UiButton @click="close">Apply</UiButton>
        </template>
      </UiDrawer>

      <UiDrawer v-model:open="modalDrawer" title="Details">
        <p class="t-small dim">
          The same element and the same top layer, opened with
          <code>showModal()</code> instead of <code>show()</code>. Tab as much as you
          like: focus cannot leave, Escape closes, and it returns to the button that
          opened it. All of that is the browser’s.
        </p>
        <template #footer="{ close }">
          <UiButton @click="close">Done</UiButton>
        </template>
      </UiDrawer>

      <UiDrawer v-model:open="sheet" title="Sheet" side="block-end" size="320px">
        <p class="t-small dim">
          The same component from a different edge — the shape a phone wants when a
          panel would be most of the screen.
        </p>
      </UiDrawer>

      <p class="t-caption hint">
        <strong>Modal or not is the whole decision</strong>, and it is not a styling
        choice. A filter panel you keep open while reading the list behind it, and a
        confirmation you must answer, are different components that happen to look
        identical. So it is one prop, and it changes one call: <code>showModal()</code>
        gives the focus trap, Escape, the inert background, the backdrop and focus
        returning to the trigger; <code>show()</code> gives the same top layer and
        leaves the page live.
      </p>
      <p class="t-caption hint">
        Which means Escape and the backdrop are <em>ours</em> in the non-modal case,
        because the browser only supplies them for the modal one. The Escape listener
        sits on the panel rather than on the window, so a drawer left open cannot
        swallow the Escape meant for something the user is actually in.
      </p>
    </section>
  </div>
</template>
