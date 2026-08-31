<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import { foundations, tiers } from '~/data/nav'

const theme = ref<'light' | 'dark'>('light')
onMounted(() => {
  theme.value = (document.documentElement.dataset.theme as 'light' | 'dark') ?? 'light'
})
function toggle() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  document.documentElement.dataset.theme = theme.value
  localStorage.setItem('theme', theme.value)
}

const route = useRoute()
/** A tier is "current" when the open page demonstrates anything in it. */
function tierActive(items: { to: string }[]) {
  return items.some(i => i.to === route.path)
}
</script>

<template>
  <div>
    <header>
      <div class="bar">
        <span class="brand">Design Framework</span>

        <nav class="nav">
          <NuxtLink
            v-for="f in foundations"
            :key="f.to"
            :to="f.to"
            class="tab"
          >{{ f.name }}</NuxtLink>

          <span class="sep" aria-hidden="true" />

          <UiPopover v-for="t in tiers" :key="t.label" placement="bottom">
            <template #trigger="{ props: p }">
              <button
                class="tab tab-menu"
                :class="{ on: tierActive(t.items) }"
                :disabled="!t.items.length"
                v-bind="p"
              >
                {{ t.label }}
                <span class="count">{{ t.items.length }}</span>
                <UiIcon :is="ChevronDown" size="sm" />
              </button>
            </template>

            <template #default="{ close }">
              <ul class="menu">
                <li v-for="i in t.items" :key="i.name + i.to">
                  <NuxtLink :to="i.to" class="mi" @click="close">
                    <span class="mi-name">{{ i.name }}</span>
                    <span v-if="i.note" class="mi-note">{{ i.note }}</span>
                  </NuxtLink>
                </li>
              </ul>
            </template>
          </UiPopover>
        </nav>

        <button class="ghost" @click="toggle">
          {{ theme === 'light' ? 'Dark' : 'Light' }}
        </button>
      </div>
    </header>

    <div class="wrap">
      <slot />
    </div>
  </div>
</template>

<style scoped>
header {
  position: sticky; top: 0; z-index: var(--z-sticky);
  background: var(--ui-bg);
  border-bottom: 1px solid var(--rule);
  margin-bottom: 56px;
}
.bar {
  max-width: 1080px; margin: 0 auto; padding: 0 40px;
  display: flex; align-items: center; gap: var(--s-7); height: 60px;
}
.brand {
  font: var(--w-semibold) var(--fs-body)/1 var(--font-sans);
  letter-spacing: var(--tr-body);
}
.nav { display: flex; align-items: center; gap: var(--s-1); margin-right: auto; }
.sep { width: 1px; height: 18px; background: var(--rule); margin-inline: var(--s-4); }

.tab {
  display: inline-flex; align-items: center; gap: var(--s-2);
  border: 0; background: transparent; cursor: pointer;
  font: var(--w-medium) var(--fs-small)/1 var(--font-sans);
  color: var(--ink-2); padding: 7px 10px; border-radius: 7px;
  text-decoration: none; white-space: nowrap;
}
.tab:hover:not(:disabled) { background: var(--ui-bg-2); color: var(--ink); }
.tab.router-link-exact-active, .tab.on { background: var(--ui-bg-2); color: var(--ink); }
.tab:disabled { opacity: .45; cursor: default; }
.tab:focus-visible { outline: var(--focus-width) solid var(--focus-color); outline-offset: 1px; }

.count {
  font-family: var(--font-mono); font-size: 10px;
  color: var(--ink-3);
}

.ghost {
  font: var(--w-medium) var(--fs-caption)/1 var(--font-sans);
  padding: 7px 12px; border-radius: 7px;
  border: 1px solid var(--rule); background: transparent;
  color: var(--ink-2); cursor: pointer;
}
.ghost:hover { color: var(--ink); }

/* Pulls the popover's own padding back so rows reach its edges. */
.menu {
  list-style: none; margin: calc(var(--s-5) * -1); padding: var(--s-3);
  min-width: 200px; display: flex; flex-direction: column;
}
.mi {
  display: flex; flex-direction: column; gap: 1px;
  padding: var(--s-3) var(--s-4); border-radius: var(--r-sm);
  text-decoration: none; color: var(--ink);
  font: var(--w-regular) var(--fs-small)/1.3 var(--font-sans);
}
.mi:hover { background: var(--ui-bg-2); }
.mi.router-link-exact-active .mi-name { color: var(--accent-text); }
.mi-note { font-size: var(--fs-micro); color: var(--ink-3); }
</style>
