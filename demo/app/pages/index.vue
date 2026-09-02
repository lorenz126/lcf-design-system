<script setup lang="ts">
import type { MenuItem } from '../../../ui/molecules/Menu.vue'
import { Inbox, MoreHorizontal, Plus, SearchX, Trash2 } from 'lucide-vue-next'
import {
  LABELS, PEOPLE, PRIORITY, STATUS, ago, priorityTone, statusLabel, statusTone,
  type Issue, type Priority, type Status
} from '~/data/issues'

useHead({ title: 'Issues — Tracker' })

const route = useRoute()
const { issues, update, remove } = useIssues()

/* ---------- filtering ---------- */

const status = ref<string>('')
const assignee = ref<string>('')
const highOnly = ref(false)
const label = computed(() => (route.query.label as string) ?? '')

const filtered = computed(() =>
  issues.value.filter(i =>
    (!status.value || i.status === status.value) &&
    (!assignee.value || i.assignee === assignee.value) &&
    (!label.value || i.label === label.value) &&
    (!highOnly.value || i.priority === 'high')
  )
)

const anyFilter = computed(
  () => !!status.value || !!assignee.value || !!label.value || highOnly.value
)
function clearFilters() {
  status.value = ''
  assignee.value = ''
  highOnly.value = false
  if (label.value) navigateTo('/')
}

/* ---------- paging ---------- */

const PER = 10
const page = ref(1)
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PER)))
const rows = computed(() => filtered.value.slice((page.value - 1) * PER, page.value * PER))

/* A filter that shrinks the list can leave you on a page that no longer
   exists, and an empty table is a worse answer than the last page. */
watch(filtered, () => { if (page.value > pages.value) page.value = pages.value })

/* ---------- selection ---------- */

const picked = ref<(string | number)[]>([])
/* Selecting rows and then filtering them away would delete things that
   are no longer on screen. */
watch(filtered, () => {
  const visible = new Set(filtered.value.map(i => i.id))
  picked.value = picked.value.filter(id => visible.has(id as number))
})

/* ---------- deleting ---------- */

const confirming = ref(false)
const pendingIds = ref<number[]>([])

function askToDelete(ids: number[]) {
  pendingIds.value = ids
  confirming.value = true
}
function doDelete() {
  remove(pendingIds.value)
  picked.value = picked.value.filter(id => !pendingIds.value.includes(id as number))
  confirming.value = false
}
const pendingTitle = computed(() =>
  pendingIds.value.length === 1
    ? issues.value.find(i => i.id === pendingIds.value[0])?.title ?? ''
    : `${pendingIds.value.length} issues`
)

/* ---------- the new issue ---------- */

const creating = ref(false)
const draft = reactive({ title: '', body: '', priority: 'normal' as Priority, label: LABELS[0]! })
const errors = ref<Record<string, string>>({})

function create() {
  errors.value = {}
  if (draft.title.trim().length < 6) {
    errors.value['new-title'] = 'Give it a title of at least six characters.'
  }
  if (Object.keys(errors.value).length) return

  const id = Math.max(0, ...issues.value.map(i => i.id)) + 1
  issues.value = [
    {
      id,
      key: `TRK-${100 + id}`,
      title: draft.title.trim(),
      body: draft.body.trim() || 'No description yet.',
      status: 'todo',
      priority: draft.priority,
      assignee: null,
      label: draft.label,
      updated: new Date().toISOString()
    },
    ...issues.value
  ]
  creating.value = false
  draft.title = ''
  draft.body = ''
  page.value = 1
}

/* ---------- table ---------- */

/* Five fixed widths and one flexible one: below the minimum the table
   scrolls rather than crushing the title into a column of single words. */
const columns = [
  { key: 'key', label: 'Key', width: '88px' },
  { key: 'title', label: 'Issue', sortable: true },
  { key: 'status', label: 'Status', width: '116px' },
  { key: 'priority', label: 'Priority', width: '96px' },
  { key: 'assignee', label: 'Assignee', width: '164px' },
  { key: 'updated', label: 'Updated', width: '132px', align: 'end' as const }
]

const rowMenu: MenuItem[] = [
  { id: 'open', label: 'Open' },
  ...STATUS.map(s => ({ id: `to-${s.value}`, label: `Move to ${s.label}` })),
  { id: 'delete', label: 'Delete', icon: Trash2, danger: true, divider: true }
]

function onRowAction(issue: Issue, item: MenuItem) {
  const id = String(item.id)
  if (id === 'open') return navigateTo(`/issues/${issue.id}`)
  if (id === 'delete') return askToDelete([issue.id])
  update(issue.id, { status: id.replace('to-', '') as Status })
}
</script>

<template>
  <div>
    <header class="head">
      <div>
        <h1 class="t-title">Issues</h1>
        <p class="t-small dim">
          {{ filtered.length }} of {{ issues.length }}<span v-if="label"> · {{ label }}</span>
        </p>
      </div>
      <UiButton @click="creating = true">
        <template #leading><UiIcon :is="Plus" /></template>
        New issue
      </UiButton>
    </header>

    <div class="filters">
      <UiSelect
        v-model="status"
        :options="[{ value: '', label: 'Any status' }, ...STATUS]"
        size="sm"
        label="Status"
      />
      <UiSelect
        v-model="assignee"
        :options="[{ value: '', label: 'Anyone' }, ...PEOPLE.map(p => ({ value: p, label: p }))]"
        size="sm"
        label="Assignee"
      />
      <UiSwitch v-model="highOnly" label="High priority only" />
      <UiButton
        v-if="anyFilter"
        variant="plain"
        tone="neutral"
        size="sm"
        class="clear"
        @click="clearFilters"
      >Clear filters</UiButton>
    </div>

    <!-- Only while something is selected: a bar that is always there is a
         bar that is usually lying about what it can act on. -->
    <div v-if="picked.length" class="bulk">
      <span class="t-small">{{ picked.length }} selected</span>
      <UiDivider orientation="vertical" spacing="sm" />
      <UiButton
        variant="plain"
        tone="red"
        size="sm"
        @click="askToDelete(picked as number[])"
      >
        <template #leading><UiIcon :is="Trash2" /></template>
        Delete
      </UiButton>
      <UiButton variant="plain" tone="neutral" size="sm" @click="picked = []">Clear</UiButton>
    </div>

    <UiCard padding="none">
      <UiTable
        v-model:selected="picked"
        :columns="columns"
        :rows="rows"
        min-width="880px"
        selectable
      >
        <template #cell-key="{ row }">
          <NuxtLink :to="`/issues/${row.id}`" class="key">{{ row.key }}</NuxtLink>
        </template>

        <template #cell-title="{ row }">
          <NuxtLink :to="`/issues/${row.id}`" class="title">{{ row.title }}</NuxtLink>
        </template>

        <template #cell-status="{ value }">
          <UiBadge :tone="statusTone(value)" size="sm" dot>{{ statusLabel(value) }}</UiBadge>
        </template>

        <template #cell-priority="{ value }">
          <UiBadge :tone="priorityTone(value)" size="sm">
            {{ PRIORITY.find(p => p.value === value)!.label }}
          </UiBadge>
        </template>

        <template #cell-assignee="{ value }">
          <span v-if="value" class="who">
            <UiAvatar :name="value" size="sm" />{{ value }}
          </span>
          <span v-else class="dim t-caption">Unassigned</span>
        </template>

        <template #cell-updated="{ value, row }">
          <span class="when">
            {{ ago(value) }}
            <UiMenu :items="rowMenu" align="end" label="Issue actions" @select="onRowAction(row, $event)">
              <template #trigger="{ props: p }">
                <UiButton
                  variant="plain"
                  tone="neutral"
                  size="sm"
                  icon-only
                  :aria-label="`Actions for ${row.key}`"
                  v-bind="p"
                ><UiIcon :is="MoreHorizontal" size="sm" /></UiButton>
              </template>
            </UiMenu>
          </span>
        </template>

        <template #empty>
          <UiEmptyState
            size="sm"
            :icon="anyFilter ? SearchX : Inbox"
            :title="anyFilter ? 'Nothing matches those filters' : 'No issues left'"
            :description="anyFilter
              ? 'Widen one of them, or clear them all and start again.'
              : 'Everything here has been closed. Enjoy it while it lasts.'"
          >
            <UiButton v-if="anyFilter" size="sm" variant="outline" tone="neutral" @click="clearFilters">
              Clear filters
            </UiButton>
          </UiEmptyState>
        </template>
      </UiTable>
    </UiCard>

    <div v-if="pages > 1" class="pager">
      <UiPagination v-model="page" :total="pages" />
    </div>

    <!-- Destructive, so it asks — and says exactly what it will destroy. -->
    <UiDialog v-model:open="confirming" title="Delete this?" width="420px">
      <p class="t-body">
        <strong>{{ pendingTitle }}</strong> will be removed. There is no undo in this
        demo, which is itself a design decision worth arguing about.
      </p>
      <template #footer="{ close }">
        <UiButton variant="plain" tone="neutral" @click="close">Cancel</UiButton>
        <UiButton tone="red" @click="doDelete">Delete</UiButton>
      </template>
    </UiDialog>

    <UiDialog v-model:open="creating" title="New issue" width="520px">
      <UiForm :errors="errors" @submit="create">
        <UiFormSection description="It starts in Todo and unassigned; both are easy to change later.">
          <UiInput
            id="new-title"
            v-model="draft.title"
            label="Title"
            placeholder="What is wrong?"
            :error="errors['new-title']"
            block
            required
          />
          <UiInput v-model="draft.body" label="Description" placeholder="Optional" block />
          <div class="pair">
            <UiSelect v-model="draft.priority" :options="PRIORITY" label="Priority" />
            <UiSelect
              v-model="draft.label"
              :options="LABELS.map(l => ({ value: l, label: l }))"
              label="Label"
            />
          </div>
        </UiFormSection>
        <template #actions>
          <UiButton variant="plain" tone="neutral" type="button" @click="creating = false">
            Cancel
          </UiButton>
          <UiButton type="submit">Create issue</UiButton>
        </template>
      </UiForm>
    </UiDialog>
  </div>
</template>

<style scoped>
.head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: var(--s-6); margin-bottom: var(--s-8);
}
.head h1 { margin: 0 0 2px; }
.dim { color: var(--fg-muted); }

.filters {
  display: flex; flex-wrap: wrap; align-items: flex-end;
  gap: var(--s-6); margin-bottom: var(--s-6);
}
.clear { margin-bottom: 2px; }

.bulk {
  display: flex; align-items: center; gap: var(--s-4);
  margin-bottom: var(--s-5); padding: var(--s-3) var(--s-5);
  border-radius: var(--r-md); background: var(--fill-quiet);
}

.key { font-family: var(--font-mono); font-size: var(--fs-caption); color: var(--fg-muted); text-decoration: none; }
.key:hover { color: var(--accent-text); }
.title { color: var(--fg); text-decoration: none; }
.title:hover { text-decoration: underline; }

.who { display: inline-flex; align-items: center; gap: var(--s-4); }
.when { display: inline-flex; align-items: center; justify-content: flex-end; gap: var(--s-3); white-space: nowrap; }

.pager { display: flex; justify-content: center; margin-top: var(--s-7); }
.pair { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-6); }
</style>
