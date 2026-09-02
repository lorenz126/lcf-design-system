<script setup lang="ts">
import { Home, ListChecks, Trash2 } from 'lucide-vue-next'
import {
  LABELS, PEOPLE, PRIORITY, STATUS, ago, priorityTone, statusLabel, statusTone,
  type Priority, type Status
} from '~/data/issues'

const route = useRoute()
const { issues, byId, update, remove } = useIssues()

const id = computed(() => Number(route.params.id))
const issue = computed(() => byId(id.value))

useHead({ title: () => (issue.value ? `${issue.value.key} — Tracker` : 'Not found — Tracker') })

/* A draft, so the form can be cancelled. Editing the issue directly
   would make Cancel a button with nothing left to undo. */
const draft = reactive({
  status: 'todo' as Status,
  priority: 'normal' as Priority,
  assignee: '',
  label: ''
})
watchEffect(() => {
  if (!issue.value) return
  draft.status = issue.value.status
  draft.priority = issue.value.priority
  draft.assignee = issue.value.assignee ?? ''
  draft.label = issue.value.label
})

const dirty = computed(() =>
  !!issue.value &&
  (draft.status !== issue.value.status ||
    draft.priority !== issue.value.priority ||
    draft.assignee !== (issue.value.assignee ?? '') ||
    draft.label !== issue.value.label)
)

const saved = ref(false)
function save() {
  if (!issue.value) return
  update(issue.value.id, {
    status: draft.status,
    priority: draft.priority,
    assignee: draft.assignee || null,
    label: draft.label
  })
  saved.value = true
  setTimeout(() => { saved.value = false }, 2000)
}

const confirming = ref(false)
function doDelete() {
  if (!issue.value) return
  remove([issue.value.id])
  confirming.value = false
  navigateTo('/')
}

const neighbours = computed(() => {
  if (!issue.value) return []
  return issues.value.filter(i => i.id !== issue.value!.id && i.label === issue.value!.label).slice(0, 4)
})
</script>

<template>
  <div v-if="issue">
    <UiBreadcrumb
      class="crumbs"
      :items="[
        { label: 'Tracker', to: '/', icon: Home },
        { label: 'Issues', to: '/', icon: ListChecks },
        { label: issue.key }
      ]"
    />

    <header class="head">
      <div>
        <h1 class="t-title-lg">{{ issue.title }}</h1>
        <div class="meta">
          <UiBadge :tone="statusTone(issue.status)" size="sm" dot>
            {{ statusLabel(issue.status) }}
          </UiBadge>
          <UiBadge :tone="priorityTone(issue.priority)" size="sm">
            {{ PRIORITY.find(p => p.value === issue!.priority)!.label }}
          </UiBadge>
          <UiBadge size="sm">{{ issue.label }}</UiBadge>
          <span class="t-caption dim">{{ issue.key }} · updated {{ ago(issue.updated) }}</span>
        </div>
      </div>
      <UiButton variant="plain" tone="red" @click="confirming = true">
        <template #leading><UiIcon :is="Trash2" /></template>
        Delete
      </UiButton>
    </header>

    <div class="split">
      <UiProse>
        <p>{{ issue.body }}</p>
        <h2>What to check</h2>
        <ul>
          <li>Whether it reproduces on both themes.</li>
          <li>Whether it survives a keyboard, with the pointer left alone.</li>
          <li>Whether the fix belongs to the component or to the page.</li>
        </ul>
      </UiProse>

      <UiCard>
        <UiForm @submit="save">
          <UiFormSection title="Details">
            <UiSelect v-model="draft.status" :options="STATUS" label="Status" block />
            <UiSelect v-model="draft.priority" :options="PRIORITY" label="Priority" block />
            <UiSelect
              v-model="draft.assignee"
              :options="[{ value: '', label: 'Unassigned' }, ...PEOPLE.map(p => ({ value: p, label: p }))]"
              label="Assignee"
              block
            />
            <UiSelect
              v-model="draft.label"
              :options="LABELS.map(l => ({ value: l, label: l }))"
              label="Label"
              block
            />
          </UiFormSection>
          <template #actions>
            <!-- Disabled until something has actually changed: a Save that
                 is always available says nothing about whether it is needed. -->
            <UiButton type="submit" :disabled="!dirty">Save</UiButton>
            <span v-if="saved" class="t-caption ok">Saved</span>
          </template>
        </UiForm>
      </UiCard>
    </div>

    <section v-if="neighbours.length" class="also">
      <UiDivider />
      <h2 class="t-title-sm">Others labelled {{ issue.label }}</h2>
      <UiCard padding="none">
        <UiList
          :items="neighbours.map(n => ({ id: n.id, label: n.title, description: `${n.key} · ${statusLabel(n.status)}` }))"
          interactive
          @activate="navigateTo(`/issues/${$event.id}`)"
        />
      </UiCard>
    </section>

    <UiDialog v-model:open="confirming" title="Delete this issue?" width="420px">
      <p class="t-body"><strong>{{ issue.title }}</strong> will be removed.</p>
      <template #footer="{ close }">
        <UiButton variant="plain" tone="neutral" @click="close">Cancel</UiButton>
        <UiButton tone="red" @click="doDelete">Delete</UiButton>
      </template>
    </UiDialog>
  </div>

  <UiEmptyState
    v-else
    title="No such issue"
    description="It may have been deleted, or the address may be wrong."
  >
    <UiButton @click="navigateTo('/')">Back to the list</UiButton>
  </UiEmptyState>
</template>

<style scoped>
.crumbs { margin-bottom: var(--s-6); }
.head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: var(--s-6); margin-bottom: var(--s-9);
}
.head h1 { margin: 0 0 var(--s-4); max-width: 34ch; }
.meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-4); }
.dim { color: var(--fg-muted); }
.ok { color: var(--success-text); align-self: center; }

.split { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: var(--s-9); align-items: start; }
@media (max-width: 860px) { .split { grid-template-columns: minmax(0, 1fr); } }

.also { margin-top: var(--s-10); }
.also h2 { margin: var(--s-6) 0; }
</style>
