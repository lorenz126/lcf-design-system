<script setup lang="ts">
const rename = ref(false)
const confirm = ref(false)
const required = ref(false)
const newName = ref('Quarterly report')
useHead({ title: 'Dialog — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">The native one, and five things it gives you.</p>
      <p class="t-body body">
        <code>showModal()</code> supplies the focus trap, Escape, the inert
        background, the backdrop and focus returning to the trigger — five things a
        hand-built modal reimplements and usually gets one of wrong.
      </p>
    </div>

    <section>
      <div class="sec-label">Three of them</div>
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
