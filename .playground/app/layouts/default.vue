<script setup lang="ts">
import { NuxtLink } from '#components'
import type { MenuItem } from '../../../ui/molecules/Menu.vue'
import type { SearchSuggestion } from '../../../ui/molecules/SearchField.vue'
import { Moon, Shapes, Sun } from 'lucide-vue-next'
import { foundations, sidebar, tiers } from '~/data/nav'

/**
 * The workshop wears its own chrome: AppShell holding UiTopBar and
 * UiSidebar. Which means every defect in them shows up here first, on
 * every page, before anyone else meets it.
 */
const route = useRoute()

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

/* The search goes to a dropdown rather than filtering the sidebar. Two
   result surfaces for one query is one too many, and the navigation
   collapsing under you while you read a list above it is noise. */
const q = ref('')

const everything: SearchSuggestion[] = [
  ...foundations.map(f => ({ id: `f-${f.name}`, label: f.name, note: 'Foundation' })),
  ...tiers.flatMap(t =>
    t.items.map(i => ({ id: `${t.label}-${i.name}`, label: i.name, note: t.label }))
  )
]
const where = new Map<string | number, string>([
  ...foundations.map(f => [`f-${f.name}`, f.to] as const),
  ...tiers.flatMap(t => t.items.map(i => [`${t.label}-${i.name}`, i.to] as const))
])

const matches = computed(() => {
  const needle = q.value.trim().toLowerCase()
  if (!needle) return []
  // Names that START with the query first: typing "ta" wants Table
  // before Attachments.
  const hits = everything.filter(s => s.label.toLowerCase().includes(needle))
  return hits.sort((a, b) => {
    const ai = a.label.toLowerCase().startsWith(needle) ? 0 : 1
    const bi = b.label.toLowerCase().startsWith(needle) ? 0 : 1
    return ai - bi || a.label.localeCompare(b.label)
  })
})

/* The field takes recents as a prop and never writes them itself, so the
   remembering is here — where the storage decision belongs. */
const RECENT_KEY = 'search-recent'
const recent = ref<SearchSuggestion[]>([])
onMounted(() => {
  try {
    const ids: (string | number)[] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    recent.value = ids
      .map(id => everything.find(e => e.id === id))
      .filter((e): e is SearchSuggestion => !!e)
  } catch { /* a corrupted list is not worth a broken page */ }
})

function remember(s: SearchSuggestion) {
  recent.value = [s, ...recent.value.filter(r => r.id !== s.id)].slice(0, 5)
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.value.map(r => r.id)))
}

function goTo(s: SearchSuggestion) {
  remember(s)
  q.value = ''
  navigateTo(where.get(s.id))
}

/** Enter with nothing highlighted takes the best match. */
function onSubmit() {
  const first = matches.value[0]
  if (first) goTo(first)
}
</script>

<template>
  <UiAppShell sidebar-width="248px">
    <template #topbar="{ toggle }">
      <UiTopBar title="Design Framework" :logo="Shapes" href="/" @toggle="toggle">
        <template #search>
          <UiSearchField
            v-model="q"
            size="lg"
            block
            placeholder="Search components"
            label="Search components"
            :suggestions="matches"
            :recent="recent"
            recent-label="Recently opened"
            empty-text="No component by that name."
            @select="goTo"
            @submit="onSubmit"
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

          <UiMenu
            :items="themeItems"
            align="end"
            label="Theme"
            @select="setTheme($event.id as 'light' | 'dark')"
          >
            <template #trigger="{ props: p }">
              <button class="who" aria-label="Theme and account" v-bind="p">
                <UiAvatar name="Lorenz Flechtenmacher" size="md" />
              </button>
            </template>
          </UiMenu>
        </template>
      </UiTopBar>
    </template>

    <template #sidebar>
      <UiSidebar
        :items="sidebar"
        :current="route.path"
        :link="NuxtLink"
        label="Framework"
      />
    </template>

    <div class="wrap">
      <slot />
    </div>
  </UiAppShell>
</template>

<style scoped>
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
