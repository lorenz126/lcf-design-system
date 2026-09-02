<script setup lang="ts">
useHead({ title: 'Table — Design Framework' })
const rowsPicked = ref<(string | number)[]>(['b'])
const gridPicked = ref<(string | number)[]>([])
const fmt = (n: number) => n.toLocaleString('en-US')

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

const wideColumns = [
  { key: 'name', label: 'Service', sortable: true, width: '150px' },
  { key: 'env', label: 'Environment' },
  { key: 'region', label: 'Region' },
  { key: 'owner', label: 'Owner' },
  { key: 'version', label: 'Version' },
  { key: 'requests', label: 'Requests', numeric: true, sortable: true },
  { key: 'p95', label: 'p95', numeric: true, sortable: true },
  { key: 'status', label: 'Status' }
]
const wideRows = [
  { id: 'a', name: 'api-gateway', env: 'production', region: 'eu-central-1', owner: 'platform', version: '4.12.0', requests: 1284900, p95: 41.8, status: 'green' },
  { id: 'b', name: 'billing-worker', env: 'production', region: 'eu-west-1', owner: 'payments', version: '2.3.9', requests: 9911, p95: 1204.25, status: 'yellow' },
  { id: 'c', name: 'legacy-import', env: 'staging', region: 'us-east-1', owner: 'data', version: '0.9.1', requests: 417, p95: 8930.5, status: 'red' },
  { id: 'd', name: 'docs-site', env: 'production', region: 'eu-central-1', owner: 'growth', version: '1.0.4', requests: 11003, p95: 96, status: 'neutral' },
  { id: 'e', name: 'search-indexer', env: 'production', region: 'eu-central-1', owner: 'search', version: '7.1.2', requests: 220481, p95: 312.4, status: 'green' }
]
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Columns that know what kind of thing they hold.</p>
      <p class="t-body body">
        An <strong>organism</strong>, for the same reason
        <NuxtLink to="/organisms/list">List</NuxtLink> is one: it is handed columns and
        rows and decides what a cell becomes. Numeric columns align right and take
        tabular figures without being told twice.
      </p>
    </div>

    <section>
      <div class="sec-label">Table — rows</div>
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

    <section>
      <div class="sec-label">Table — grid</div>
      <UiCard padding="none">
        <UiTable
          v-model:selected="gridPicked"
          variant="grid"
          :columns="wideColumns"
          :rows="wideRows"
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
        The variant is a choice about what the reader is doing. <strong>Rows</strong>
        has horizontal rules only and room to breathe — for reading <em>down</em> one
        column. <strong>Grid</strong> rules both ways and packs tight — for reading
        <em>across</em> a row and comparing many columns. The vertical lines are what
        let the eye track sideways without losing its place.
      </p>
      <p class="t-caption hint">
        Grid’s rules are far fainter (<code>--rule-faint</code>, 5%) than the row
        variant’s. At this density a normal border every few pixels turns the table
        into a cage; the lines only need to be enough to follow, not to see. Cells
        truncate rather than wrap, because one two-line row breaks the rhythm of all
        the others.
      </p>
    </section>
  </div>
</template>
