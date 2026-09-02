<script setup lang="ts">
useHead({ title: 'Textarea — Design Framework' })
const notes = ref('')
const bio = ref('Two lines already, so the box has something to grow from.\nPress Enter a few times.')
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">It grows with what you put in it.</p>
      <p class="t-body body">
        Everything else about it is <NuxtLink to="/atoms/input">Input</NuxtLink> with
        more lines. The growing is the part with a decision in it, and so is the
        counter.
      </p>
    </div>

    <section>
      <div class="sec-label">Growing, and counted</div>
      <div class="col">
        <UiTextarea
          v-model="bio"
          label="Description"
          help="It grows as you type, and stops at eight lines."
          :max-rows="8"
          block
        />
        <UiTextarea
          v-model="notes"
          label="Notes"
          placeholder="Say what happened"
          :max-length="120"
          block
        />
      </div>
      <p class="t-caption hint">
        Growing with the content is the only interesting part.
        <code>field-sizing: content</code> does it in one declaration and is not
        everywhere yet, so this takes the good path where it exists and measures
        <code>scrollHeight</code> where it does not — the same shape as the anchor
        positioning decision, and the fallback is small enough to delete later.
      </p>
      <p class="t-caption hint">
        The counter <strong>reports, it does not block</strong>. There is no
        <code>maxlength</code> attribute: silently refusing keystrokes at a limit is
        the same lie as refusing a kanban card over a WIP limit — the text does not
        get shorter, it gets finished somewhere else and pasted in.
      </p>
    </section>
  </div>
</template>

<style scoped>
.col { max-width: 380px; }
</style>
