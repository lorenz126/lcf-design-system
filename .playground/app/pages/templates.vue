<script setup lang="ts">
import type { SidebarItem } from '../../../ui/organisms/Sidebar.vue'
import {
  Archive, Bell, BookOpen, Inbox, Layers, Search, Settings, Star
} from 'lucide-vue-next'
useHead({ title: 'Templates — Design Framework' })

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
const selected = ref<number | null>(null)
const messages = [
  { id: 1, label: 'Quarterly review', description: 'Anna Weber · 09:14' },
  { id: 2, label: 'Design system sync', description: 'Tom Krause · 08:02' },
  { id: 3, label: 'Invoice #2291', description: 'Billing · yesterday' },
  { id: 4, label: 'Welcome aboard', description: 'People · Monday' }
]
const current = computed(() => messages.find(m => m.id === selected.value))
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Slots and nothing else.</p>
      <p class="t-body body">
        A template holds no data and makes no decisions about content — it only says
        where things go and what scrolls. That is what separates this tier from an
        organism: <code>Table</code> knows it has rows, <code>AppShell</code> knows
        only that something is on the left.
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
        Collapsed is a <strong>rail</strong>, not a disappearance. Folding the column
        to nothing buys 260px and costs every destination in the application — you can
        still see where you are, but no longer where you might go. So the icons stay,
        each with a tooltip, because an icon on its own is a guess. A group has nowhere
        to put its children in a strip that narrow, so its row asks for the width back
        rather than opening something nobody can see.
      </p>
      <p class="t-caption hint">
        This is also the page you are on. The workshop wears the same three
        components, so anything broken about them is broken here first, on every
        page, before anyone else meets it.
      </p>
    </section>

    <section>
      <div class="sec-label">Avatar</div>
      <div class="row">
        <UiAvatar name="Anna Weber" size="lg" label="Anna Weber" />
        <UiAvatar name="Tom Krause" size="lg" label="Tom Krause" />
        <UiAvatar name="Lorenz Flechtenmacher" size="lg" label="Lorenz Flechtenmacher" />
        <span class="gap" />
        <UiAvatar name="dewa commercial" shape="square" size="lg" label="dewa commercial" />
        <UiAvatar name="Development" shape="square" size="lg" label="Development" />
        <UiAvatar text="🛰" shape="square" size="lg" tone="orange" label="Satellites" />
        <span class="gap" />
        <UiAvatar name="Anna Weber" size="sm" />
        <UiAvatar name="Anna Weber" size="md" />
        <UiAvatar name="Anna Weber" size="lg" />
      </div>
      <p class="t-caption hint">
        Circles are people, squares are things. Both need a mark, and if they look
        alike the sidebar stops saying which is which.
      </p>
      <p class="t-caption hint">
        The colour is <strong>derived from the name</strong>, not configured — so the
        same workspace is the same colour on every screen it appears on and nobody
        maintains a map of thing-to-colour. Pass a tone only when the colour itself
        means something.
      </p>
    </section>

    <section>
      <div class="sec-label">SplitView</div>
      <div class="frame">
        <UiSplitView :has-detail="selected !== null" list-width="240px">
          <template #list>
            <UiList
              :items="messages"
              interactive
              @activate="i => (selected = i.id as number)"
            />
          </template>
          <template #detail>
            <div v-if="current" class="detail">
              <UiButton variant="plain" tone="neutral" size="sm"
                        class="only-narrow" @click="selected = null">Back</UiButton>
              <h3 class="t-title-sm">{{ current.label }}</h3>
              <p class="t-caption dim">{{ current.description }}</p>
              <UiProse size="sm">
                <p>
                  The two panes scroll independently, which is the entire point:
                  picking the eleventh item and reading it should not lose your
                  place in the list.
                </p>
              </UiProse>
            </div>
          </template>
          <template #empty>Pick a message.</template>
        </UiSplitView>
      </div>
      <p class="t-caption hint">
        Below 860px the panes cannot sit side by side, so the detail <em>covers</em>
        the list rather than squeezing beside it. Which one to show stays the
        caller’s call — only the caller knows whether anything is selected.
      </p>
    </section>

    <section>
      <div class="sec-label">DocLayout</div>
      <p class="t-caption hint">
        Used for real on the <NuxtLink to="/docs">Docs</NuxtLink> page. The aside is
        declared <em>after</em> the article in the DOM and placed by grid, so a
        keyboard or screen reader reaches the content before the contents — a table
        of contents read out first is a list of links to nothing yet.
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
.hint { color: var(--ink-3); margin: 14px 0 0; max-width: 68ch; line-height: 1.6; }
.dim { color: var(--ink-3); }

/* A stand-in for a browser window, so a full-page template can be seen
   in the middle of a documentation page. */
.frame {
  height: 420px;
  border: 1px solid var(--rule);
  border-radius: var(--r-lg);
  overflow: clip;
}

.row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-5); }
.gap { width: var(--s-6); }
.content { padding: var(--s-8); }
.detail { padding: var(--s-8); display: flex; flex-direction: column; gap: var(--s-3); }

.only-narrow { display: none; }
@media (max-width: 860px) { .only-narrow { display: inline-flex; } }
</style>
