<script setup lang="ts">
const theme = ref<'light' | 'dark'>('light')

onMounted(() => {
  theme.value = (document.documentElement.dataset.theme as 'light' | 'dark') ?? 'light'
})

function toggle() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  document.documentElement.dataset.theme = theme.value
  localStorage.setItem('theme', theme.value)
}

const tabs = [
  { to: '/',     label: 'Principles' },
  { to: '/type', label: 'Type' },
  { to: '/color', label: 'Colour' },
  { to: '/buttons', label: 'Buttons' },
  { to: '/inputs', label: 'Inputs' },
  { to: '/badges', label: 'Badges' },
  { to: '/controls', label: 'Controls' },
  { to: '/overlays', label: 'Overlays' },
  { to: '/data', label: 'Data' },
]
</script>

<template>
  <div>
    <header>
      <div class="bar">
        <span class="brand">Design Framework</span>
        <nav class="tabs">
          <NuxtLink v-for="t in tabs" :key="t.to" :to="t.to" class="tab">{{ t.label }}</NuxtLink>
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
  position: sticky; top: 0; z-index: 10;
  background: var(--ui-bg);
  border-bottom: 1px solid var(--rule);
  margin-bottom: 56px;
}
.bar {
  max-width: 1080px; margin: 0 auto; padding: 0 40px;
  display: flex; align-items: center; gap: 28px; height: 60px;
}
.brand {
  font: var(--w-semibold) var(--fs-body)/1 var(--font-sans);
  letter-spacing: var(--tr-body);
  margin-right: 8px;
}
.tabs { display: flex; gap: 2px; margin-right: auto; }
.tab {
  font: var(--w-medium) var(--fs-small)/1 var(--font-sans);
  color: var(--ink-2); padding: 7px 12px; border-radius: 7px;
  text-decoration: none;
}
.tab:hover { background: var(--ui-bg-2); color: var(--ink); }
.tab.router-link-exact-active { background: var(--ui-bg-2); color: var(--ink); }
.ghost {
  font: var(--w-medium) var(--fs-caption)/1 var(--font-sans);
  padding: 7px 12px; border-radius: 7px;
  border: 1px solid var(--rule); background: transparent;
  color: var(--ink-2); cursor: pointer;
}
.ghost:hover { color: var(--ink); }
</style>
