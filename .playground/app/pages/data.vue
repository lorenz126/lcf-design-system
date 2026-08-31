<script setup lang="ts">
import { MoreHorizontal } from 'lucide-vue-next'
useHead({ title: 'Data — Design Framework' })

const picked = ref<(string | number)[]>([])
const rowsPicked = ref<(string | number)[]>(['b'])
const listItems = [
  { id: 1, label: 'api-gateway', description: 'Deployed 4 minutes ago' },
  { id: 2, label: 'billing-worker', description: 'Degraded — retrying' },
  { id: 3, label: 'legacy-import', description: 'Failing since 09:12', disabled: true },
  { id: 4, label: 'docs-site', description: 'Paused' }
]

const columns = [
  { key: 'name', label: 'Service', sortable: true },
  { key: 'env', label: 'Environment' },
  { key: 'requests', label: 'Requests', numeric: true, sortable: true },
  { key: 'p95', label: 'p95', numeric: true, sortable: true },
  { key: 'status', label: 'Status' }
]
const rows = [
  { id: 'a', name: 'api-gateway', env: 'production', requests: 1284900, p95: 41.8, status: 'green' },
  { id: 'b', name: 'billing-worker', env: 'production', requests: 9911, p95: 1204.25, status: 'yellow' },
  { id: 'c', name: 'legacy-import', env: 'staging', requests: 417, p95: 8930.5, status: 'red' },
  { id: 'd', name: 'docs-site', env: 'production', requests: 11003, p95: 96, status: 'neutral' }
]
const fmt = (n: number) => n.toLocaleString('en-US')
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Two organisms and the surface they sit on.</p>
      <p class="t-body body">
        List and Table are <strong>organisms</strong> because they own a data shape —
        handed items or columns, they decide what becomes a row. Card is a
        <strong>molecule</strong>: it bounds whatever you put in it and knows nothing
        about the contents.
      </p>
    </div>

    <section>
      <div class="sec-label">Card — border or shadow</div>
      <div class="cards">
        <UiCard>
          <template #header><strong class="t-headline">Flat</strong></template>
          A border. Sits <em>in</em> the layout — the default.
        </UiCard>
        <UiCard variant="raised">
          <template #header><strong class="t-headline">Raised</strong></template>
          A shadow. Sits <em>on</em> the layout.
        </UiCard>
        <UiCard variant="glass">
          <template #header><strong class="t-headline">Glass</strong></template>
          Needs something behind it to mean anything.
        </UiCard>
      </div>
      <p class="t-caption hint">
        The light is in front, so an even offset-free halo reads as “lifted toward the
        viewer”. That makes a shadow a claim that the thing is <em>on</em> the layout —
        and a grid where every card is raised claims it of all of them, so none of them
        read as raised. Border is the default for that reason.
      </p>
    </section>

    <section>
      <div class="sec-label">List</div>
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

    <section>
      <div class="sec-label">Table</div>
      <UiCard padding="none">
        <UiTable
          v-model:selected="rowsPicked"
          :columns="columns"
          :rows="rows"
          selectable
          sticky-header
        >
          <template #cell-requests="{ value }">{{ fmt(value) }}</template>
          <template #cell-p95="{ value }">{{ value.toFixed(2) }} ms</template>
          <template #cell-status="{ value }">
            <UiBadge :tone="value" dot size="sm">{{ value === 'neutral' ? 'paused' : value }}</UiBadge>
          </template>
        </UiTable>
      </UiCard>
      <p class="t-caption hint">
        Sort by Requests or p95 and watch the numbers: they stay in their columns
        because numeric cells get <code>.nums-tabular</code> automatically. Proportional
        digits change width per glyph, so a column of them never lines up and a
        changing value jitters in place.
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
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--s-6); }
.cards.two { grid-template-columns: repeat(2, 1fr); }
.hint { color: var(--ink-3); margin: 14px 0 0; max-width: 68ch; line-height: 1.6; }
</style>
