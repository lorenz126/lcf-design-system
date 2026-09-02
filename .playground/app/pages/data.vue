<script setup lang="ts">
import { Inbox, MoreHorizontal, Plus } from 'lucide-vue-next'
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

const page = ref(4)
const gridPicked = ref<(string | number)[]>([])
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

    <section>
      <div class="sec-label">EmptyState</div>
      <div class="cards two">
        <UiCard padding="none">
          <UiEmptyState
            size="sm"
            :icon="Inbox"
            title="No requests yet"
            description="Anything that arrives today will show up here."
          />
        </UiCard>
        <UiCard padding="none">
          <UiEmptyState
            :icon="Inbox"
            title="Nothing in this project"
            description="A project starts empty. Add the first item and the list takes over from here."
          >
            <UiButton size="sm">
              <template #leading><UiIcon :is="Plus" /></template>
              New item
            </UiButton>
          </UiEmptyState>
        </UiCard>
      </div>
      <p class="t-caption hint">
        “No rows.” is not an empty state, it is a status line. The difference matters
        because empty is usually the <em>first</em> thing anyone sees — a new board, a
        fresh filter, an inbox just cleared. It is the one moment an interface can say
        what the thing is for, and a greyed-out sentence in the middle of a table
        spends it saying nothing.
      </p>
      <p class="t-caption hint">
        Which is why the action is a <strong>slot</strong>, not a prop: a useful empty
        state ends in a way out — create the first one, clear the filter, go back — and
        what that way out is belongs to the application. List and Table now render the
        small size by default and take an <code>empty</code> slot for the rest.
      </p>
    </section>

    <section>
      <div class="sec-label">Pagination</div>
      <div class="col">
        <UiPagination v-model="page" :total="24" />
        <UiPagination :model-value="1" :total="5" size="sm" />
        <UiPagination :model-value="12" :total="12" size="sm" />
      </div>
      <p class="t-caption hint">
        Page <strong>{{ page }}</strong> of 24. Walk it with the arrows: the row of
        numbers never changes width. If the run grew and shrank as you moved through
        it, the button under your pointer would change meaning between clicks — ends,
        ellipses and the current neighbourhood always take the same number of slots, so
        page 7 sits where page 6 was.
      </p>
      <p class="t-caption hint">
        An ellipsis is <em>not</em> a control. It is a gap in a sequence, so it is
        text: a button that jumps somewhere unstated is worse than no button. And these
        are buttons rather than links, which is a real limit — a pagination whose pages
        are URLs can be shared and reopened, but it needs the app to say what a page’s
        address is, and half the places this belongs have none to give.
      </p>
    </section>

    <section>
      <div class="sec-label">Divider</div>
      <div class="dv">
        <p class="t-small">A block of content.</p>
        <UiDivider />
        <p class="t-small">Another, separated by a rule that belongs to neither.</p>
        <UiDivider>or</UiDivider>
        <p class="t-small">A labelled divider is a div, not an hr — a horizontal rule
          cannot have content.</p>
        <UiDivider spacing="lg" />
        <div class="dvrow">
          <span class="t-small">Toolbar</span>
          <UiDivider orientation="vertical" spacing="sm" />
          <span class="t-small">groups</span>
          <UiDivider orientation="vertical" spacing="sm" />
          <span class="t-small">divided</span>
        </div>
      </div>
      <p class="t-caption hint">
        A separator is not a border. A border belongs to a box and says where the box
        ends; a divider is a thing in the flow saying the blocks either side of it are
        not the same block. That is why it carries <code>role="separator"</code> and
        its own spacing — and why Menu and Sidebar both stopped drawing their own.
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
.col { display: flex; flex-direction: column; gap: var(--s-6); align-items: flex-start; }
.dv { max-width: 460px; }
.dvrow { display: flex; align-items: center; gap: var(--s-5); }
.hint { color: var(--ink-3); margin: 14px 0 0; max-width: 68ch; line-height: 1.6; }
</style>
