<script setup lang="ts">
import type { MenuItem } from '../../../ui/molecules/Menu.vue'
import type { SearchSuggestion } from '../../../ui/molecules/SearchField.vue'
import type { SidebarItem } from '../../../ui/organisms/Sidebar.vue'
import { Bug, LayoutGrid, ListChecks, Moon, Sun } from 'lucide-vue-next'
import { LABELS } from '~/data/issues'

/**
 * The shell. Nothing here is a placeholder: the search searches, the
 * labels filter, the counts count. A control that does nothing teaches
 * the reader to stop trusting the ones that do.
 */
const route = useRoute()
const { issues } = useIssues()

const collapsed = ref(false)

/* ---------- theme ---------- */

const theme = ref<'light' | 'dark'>('light')
onMounted(() => {
  theme.value = (document.documentElement.dataset.theme as 'light' | 'dark') ?? 'light'
})
function setTheme(next: 'light' | 'dark') {
  theme.value = next
  document.documentElement.dataset.theme = next
  localStorage.setItem('theme', next)
}
const themeItems = computed<MenuItem[]>(() => [
  { id: 'light', label: 'Light', checked: theme.value === 'light' },
  { id: 'dark', label: 'Dark', checked: theme.value === 'dark' }
])

/* ---------- navigation ---------- */

const open = computed(() => issues.value.filter(i => i.status !== 'done').length)

const nav = computed<SidebarItem[]>(() => [
  { label: 'All issues', to: '/', icon: ListChecks, badge: String(open.value), badgeTone: 'blue' },
  { label: 'Board', to: '/board', icon: LayoutGrid },
  {
    label: 'Labels',
    icon: Bug,
    heading: 'Filter',
    divider: true,
    children: LABELS.map(l => ({
      label: l,
      to: `/?label=${encodeURIComponent(l)}`,
      avatar: {}
    }))
  }
])

/* The label rows carry a query, so the path alone cannot say which is
   current — a route with `?label=Design` is still `/`. */
const current = computed(() =>
  route.path === '/' && route.query.label
    ? `/?label=${encodeURIComponent(String(route.query.label))}`
    : route.path
)

/* ---------- search ---------- */

const q = ref('')
const matches = computed<SearchSuggestion[]>(() => {
  const n = q.value.trim().toLowerCase()
  if (!n) return []
  return issues.value
    .filter(i => i.title.toLowerCase().includes(n) || i.key.toLowerCase().includes(n))
    .slice(0, 8)
    .map(i => ({ id: i.id, label: i.title, note: i.key }))
})

const RECENT = 'tracker-recent'
const recent = ref<SearchSuggestion[]>([])
onMounted(() => {
  try {
    const ids: number[] = JSON.parse(localStorage.getItem(RECENT) ?? '[]')
    recent.value = ids
      .map(id => issues.value.find(i => i.id === id))
      .filter(Boolean)
      .map(i => ({ id: i!.id, label: i!.title, note: i!.key }))
  } catch { /* a corrupted list is not worth a broken page */ }
})

function goTo(s: SearchSuggestion) {
  recent.value = [s, ...recent.value.filter(r => r.id !== s.id)].slice(0, 5)
  localStorage.setItem(RECENT, JSON.stringify(recent.value.map(r => r.id)))
  q.value = ''
  navigateTo(`/issues/${s.id}`)
}
</script>

<template>
  <UiAppShell v-model:collapsed="collapsed" sidebar-width="232px">
    <template #topbar="{ toggle }">
      <UiTopBar title="Tracker" :logo="Bug" href="/" @toggle="toggle">
        <template #search>
          <UiSearchField
            v-model="q"
            size="lg"
            block
            shortcut="k"
            placeholder="Search issues"
            label="Search issues"
            :suggestions="matches"
            :recent="recent"
            recent-label="Recently opened"
            empty-text="No issue says that."
            @select="goTo"
            @submit="matches[0] && goTo(matches[0])"
          />
        </template>

        <template #actions>
          <UiButton
            variant="plain"
            tone="neutral"
            size="sm"
            icon-only
            :aria-label="theme === 'light' ? 'Use the dark theme' : 'Use the light theme'"
            @click="setTheme(theme === 'light' ? 'dark' : 'light')"
          >
            <UiIcon :is="theme === 'light' ? Moon : Sun" size="sm" />
          </UiButton>

          <UiMenu :items="themeItems" align="end" label="Theme" @select="setTheme($event.id as 'light' | 'dark')">
            <template #trigger="{ props: p }">
              <button class="who" aria-label="Theme" v-bind="p">
                <UiAvatar name="Anna Weber" size="md" />
              </button>
            </template>
          </UiMenu>
        </template>
      </UiTopBar>
    </template>

    <template #sidebar="{ collapsed: rail }">
      <UiSidebar
        :items="nav"
        :current="current"
        :collapsed="rail"
        label="Tracker"
        @expand="collapsed = false"
      />
    </template>

    <div class="page">
      <slot />
    </div>
  </UiAppShell>
</template>

<style scoped>
.page { max-width: 1040px; margin: 0 auto; padding: 32px 40px 96px; }

.who {
  display: inline-grid;
  place-items: center;
  padding: 2px;
  border: 0;
  border-radius: var(--r-full);
  background: transparent;
  cursor: pointer;
}
.who:hover { background: var(--fill-quiet); }
.who:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 1px;
}
</style>
