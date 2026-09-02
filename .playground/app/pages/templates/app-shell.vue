<script setup lang="ts">
import type { SidebarItem } from '../../../../ui/organisms/Sidebar.vue'
import {
  Archive, Bell, BookOpen, CircleDot, GitPullRequest, Home, Inbox, Layers,
  Lock, Search, Settings, Star
} from 'lucide-vue-next'

const navOpen = ref(false)
const navCollapsed = ref(false)

/* No router in an embedded demo, so the rows are buttons and the
   highlight is driven by `id` rather than by a path. */
const here = ref<string | number>('inbox')

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
    to: 'https://github.com/lorenz126/flechtenmacher-font',
    icon: BookOpen,
    external: true,
    divider: true,
    heading: 'Elsewhere'
  }
]
useHead({ title: 'AppShell — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">The shell, and the two components it holds.</p>
      <p class="t-body body">
        AppShell is slots and a breakpoint. <NuxtLink to="/molecules/top-bar">TopBar</NuxtLink>
        and <NuxtLink to="/organisms/sidebar">Sidebar</NuxtLink> are shown here rather
        than on their own pages because the shell is what makes them behave — the rail,
        the overlay and the sticky header are a property of the three together.
      </p>
    </div>

    <section>
      <div class="sec-label">AppShell · TopBar · Sidebar</div>
      <div class="frame">
        <UiAppShell
          v-model:open="navOpen"
          v-model:collapsed="navCollapsed"
          height="100%"
          sidebar-width="216px"
        >
          <template #topbar="{ toggle }">
            <UiTopBar title="Mailbox" :logo="Inbox" @toggle="toggle">
              <template #search>
                <UiSearchField size="md" block placeholder="Search mail" label="Search mail" />
              </template>
              <template #actions>
                <UiButton variant="plain" tone="neutral" size="sm" icon-only
                          aria-label="Notifications">
                  <UiIcon :is="Bell" size="sm" />
                </UiButton>
                <UiButton variant="plain" tone="neutral" size="sm" icon-only
                          aria-label="Settings">
                  <UiIcon :is="Settings" size="sm" />
                </UiButton>
                <UiAvatar name="Anna Weber" size="md" label="Anna Weber" />
              </template>
            </UiTopBar>
          </template>

          <template #sidebar="{ collapsed }">
            <UiSidebar
              :items="mail"
              :current="here"
              :collapsed="collapsed"
              label="Mailbox"
              @select="here = $event.id!"
              @expand="navCollapsed = false"
            />
          </template>

          <div class="content">
            <UiProse measure="wide">
              <h2>The main region scrolls, not the page</h2>
              <p>
                That is the decision this template makes for you, and it has
                consequences: a sticky header inside the content sticks to this
                region rather than the viewport, and window scroll listeners see
                nothing. The alternative lets the sidebar scroll away with the
                page, which is not what application chrome is for.
              </p>
              <p>
                Press the button at the far left. On a wide screen the sidebar
                narrows to a rail of icons; below 860px it is an overlay that opens
                over the content. Two different states, one button — a top bar
                should not have to know which case it is in.
              </p>
              <p>
                Scroll this panel: the sidebar and topbar stay exactly where they
                are, because they are not in the scrolling box.
              </p>
              <p>
                Keep scrolling. There is more here than fits, on purpose, so the
                independent scroll is visible rather than described.
              </p>
            </UiProse>
          </div>
        </UiAppShell>
      </div>
      <p class="t-caption hint">
        The bar spans the <strong>full</strong> width by default, which puts the
        sidebar toggle above the sidebar — over the thing it controls. Pass
        <code>topbar="main"</code> to stop it at the content instead, which suits a
        shell whose sidebar carries its own brand. It is a real choice, not a
        cosmetic one, so it is a prop rather than a house style.
      </p>
      <p class="t-caption hint">
        Collapsed is a <strong>rail</strong> rather than a disappearance — see
        <NuxtLink to="/organisms/sidebar">Sidebar</NuxtLink> for why.
      </p>
      <p class="t-caption hint">
        This is also the page you are on. The workshop wears the same three
        components, so anything broken about them is broken here first, on every
        page, before anyone else meets it.
      </p>
    </section>
  </div>
</template>

<style scoped>
/* A stand-in for a browser window, so a full-page template can be seen
   in the middle of a documentation page. */
.frame {
  height: 420px;
  border: 1px solid var(--rule);
  border-radius: var(--r-lg);
  overflow: clip;
}
.content { padding: var(--s-8); }
.dim { color: var(--ink-3); }
</style>
