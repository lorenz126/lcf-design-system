<script setup lang="ts">
const selected = ref<number | null>(null)
const messages = [
  { id: 1, label: 'Quarterly review', description: 'Anna Weber · 09:14' },
  { id: 2, label: 'Design system sync', description: 'Tom Krause · 08:02' },
  { id: 3, label: 'Invoice #2291', description: 'Billing · yesterday' },
  { id: 4, label: 'Welcome aboard', description: 'People · Monday' }
]
const current = computed(() => messages.find(m => m.id === selected.value))
useHead({ title: 'SplitView — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">A list and a detail, and one of them at a time on a phone.</p>
      <p class="t-body body">
        The breakpoint is the component: on a wide screen both panes are present, on
        a narrow one the detail replaces the list and something has to bring you back.
      </p>
    </div>

    <section>
      <div class="sec-label">A mailbox</div>
      <div class="frame">
        <UiSplitView :has-detail="selected !== null" list-width="240px">
          <template #list>
            <UiList
              :items="messages"
              interactive
              @activate="i => (selected = i.id as number)"
            />
          </template>
          <template #detail>
            <div v-if="current" class="detail">
              <UiButton variant="plain" tone="neutral" size="sm"
                        class="only-narrow" @click="selected = null">Back</UiButton>
              <h3 class="t-title-sm">{{ current.label }}</h3>
              <p class="t-caption dim">{{ current.description }}</p>
              <UiProse size="sm">
                <p>
                  The two panes scroll independently, which is the entire point:
                  picking the eleventh item and reading it should not lose your
                  place in the list.
                </p>
              </UiProse>
            </div>
          </template>
          <template #empty>Pick a message.</template>
        </UiSplitView>
      </div>
      <p class="t-caption hint">
        Below 860px the panes cannot sit side by side, so the detail <em>covers</em>
        the list rather than squeezing beside it. Which one to show stays the
        caller’s call — only the caller knows whether anything is selected.
      </p>
    </section>
  </div>
</template>

<style scoped>
/* A stand-in for a browser window, so a full-page template can be seen
   in the middle of a documentation page. */
.frame {
  height: 420px;
  border: 1px solid var(--rule);
  border-radius: var(--r-lg);
  overflow: clip;
}
.detail { padding: var(--s-8); display: flex; flex-direction: column; gap: var(--s-3); }
.only-narrow { display: none; }
@media (max-width: 860px) { .only-narrow { display: inline-flex; } }
</style>
