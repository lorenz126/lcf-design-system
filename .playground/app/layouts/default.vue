<script setup lang="ts">
import type { MenuItem } from '../../../ui/molecules/Menu.vue'
import type { SidebarItem } from '../../../ui/organisms/Sidebar.vue'
import { Moon, Shapes, Sun } from 'lucide-vue-next'
import { sidebar } from '~/data/nav'

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

/* The search filters the navigation. A search box in a workshop about
   not shipping decoration had better do something. */
const q = ref('')
const items = computed<SidebarItem[]>(() => {
  const needle = q.value.trim().toLowerCase()
  if (!needle) return sidebar
  const hit = (s: string) => s.toLowerCase().includes(needle)
  return sidebar.flatMap(i => {
    if (!i.children) return hit(i.label) ? [i] : []
    const kids = i.children.filter(k => hit(k.label))
    // A group whose own name matches keeps all of its children.
    if (hit(i.label)) return [i]
    return kids.length ? [{ ...i, children: kids }] : []
  })
})
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
        :items="items"
        :current="route.path"
        :expand-all="!!q.trim()"
        link="NuxtLink"
        label="Framework"
        empty-text="Nothing matches that."
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
