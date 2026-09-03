<script setup lang="ts">
import type { SidebarItem } from '../../../../ui/organisms/Sidebar.vue'
import { Archive, BookOpen, Inbox, Layers, Star } from 'lucide-vue-next'
useHead({ title: 'Sidebar — Design Framework' })

/* No router in an embedded demo, so the rows are buttons and the
   highlight is driven by `id` rather than by a path. */
const here = ref<string | number>('inbox')
const railed = ref(false)

const mail: SidebarItem[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, badge: '12', badgeTone: 'blue' },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'archive', label: 'Archive', icon: Archive },
  {
    id: 'spaces',
    label: 'Spaces',
    icon: Layers,
    heading: 'Workspaces',
    divider: true,
    children: [
      { id: 'dewa', label: 'dewa commercial', avatar: { text: '🛰' } },
      { id: 'dev', label: 'Development', avatar: {} },
      { id: 'design', label: 'Design Framework', avatar: {} }
    ]
  },
  {
    label: 'Documentation',
    to: 'https://github.com/lorenz126/lcf-design-system',
    icon: BookOpen,
    external: true,
    divider: true,
    heading: 'Elsewhere'
  }
]
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">One level of nesting, and it refuses a second.</p>
      <p class="t-body body">
        An <strong>organism</strong> because it owns a data shape: handed a tree, it
        decides what becomes a row, a group, a heading or a rule. What it will not do
        is arbitrary depth — that is
        <NuxtLink to="/">TreeView</NuxtLink>, a component that does not exist yet, and
        growing into it one nesting level at a time is how a navigation column becomes
        a file explorer nobody asked for.
      </p>
    </div>

    <section>
      <div class="sec-label">A mailbox</div>
      <div class="rail-demo">
        <UiSidebar
          :items="mail"
          :current="here"
          :collapsed="railed"
          label="Mailbox"
          @select="here = $event.id!"
          @expand="railed = false"
        />
        <div class="beside">
          <UiButton variant="outline" tone="neutral" size="sm" @click="railed = !railed">
            {{ railed ? 'Expand' : 'Collapse to a rail' }}
          </UiButton>
          <p class="t-caption hint">
            Current: <strong>{{ here }}</strong>
          </p>
        </div>
      </div>
      <p class="t-caption hint">
        Collapsed is a <strong>rail</strong>, not a disappearance. Folding the column
        to nothing buys 260px and costs every destination in the application — you can
        still see where you are, but no longer where you might go. So the icons stay,
        each with a tooltip, because an icon on its own is a guess. A group has nowhere
        to put its children in a strip that narrow, so its row asks for the width back
        rather than opening something nobody can see.
      </p>
      <p class="t-caption hint">
        The rows take a <strong>link component</strong>, not a string. Passing
        <code>"NuxtLink"</code> renders a literal <code>&lt;nuxtlink&gt;</code> element
        — it looks right, it highlights right, and it is not clickable. That happened
        three times before a plugin started providing the component app-wide.
      </p>
      <p class="t-caption hint">
        In a shell it is a column that stays put while the content scrolls — see
        <NuxtLink to="/templates/app-shell">AppShell</NuxtLink>. This is also the
        component you are looking at on the left of this page.
      </p>
    </section>
  </div>
</template>

<style scoped>
.rail-demo {
  display: flex;
  gap: var(--s-8);
  align-items: flex-start;
  border: 1px solid var(--rule);
  border-radius: var(--r-lg);
  overflow: clip;
  min-height: 380px;
}
.beside { padding: var(--s-7); display: flex; flex-direction: column; gap: var(--s-5); }
</style>
