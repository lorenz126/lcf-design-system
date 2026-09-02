<script setup lang="ts">
useHead({ title: 'List — Design Framework' })
const picked = ref<(string | number)[]>([])
const listItems = [
  { id: 1, label: 'api-gateway', description: 'Deployed 4 minutes ago' },
  { id: 2, label: 'billing-worker', description: 'Degraded — retrying' },
  { id: 3, label: 'legacy-import', description: 'Failing since 09:12', disabled: true },
  { id: 4, label: 'docs-site', description: 'Paused' }
]
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Rows, selection, and the two states a list is usually missing.</p>
      <p class="t-body body">
        An <strong>organism</strong> because it owns a data shape: hand it items and it
        decides what becomes a row. <NuxtLink to="/molecules/card">Card</NuxtLink> is a
        molecule for the opposite reason — it bounds whatever you put in it and knows
        nothing about the contents.
      </p>
    </div>

    <section>
      <div class="sec-label">Rows and selection</div>
      <UiCard padding="none">
        <UiList v-model:selected="picked" :items="listItems" select="multiple">
          <template #trailing="{ item }">
            <UiButton variant="plain" tone="neutral" size="sm" icon-only
                      :aria-label="`Actions for ${item.label}`">
              <UiIcon :is="MoreHorizontal" size="sm" />
            </UiButton>
          </template>
        </UiList>
      </UiCard>
      <p class="t-caption hint">
        Selected: {{ picked.length ? picked.join(', ') : 'none' }}. Selection uses real
        checkboxes, so the space bar and screen-reader announcement come along —
        a list of divs with click handlers has neither. Card with
        <code>padding="none"</code> lets the rows reach the border.
      </p>
    </section>

    <section>
      <div class="sec-label">List — empty and loading</div>
      <div class="cards two">
        <UiCard padding="none"><UiList :items="[]" /></UiCard>
        <UiCard padding="none"><UiList :items="[]" loading /></UiCard>
      </div>
    </section>
  </div>
</template>
