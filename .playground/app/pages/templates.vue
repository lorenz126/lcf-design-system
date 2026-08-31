<script setup lang="ts">
import { Menu, Inbox, Star, Archive, Settings } from 'lucide-vue-next'
useHead({ title: 'Templates — Design Framework' })

const navOpen = ref(false)
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
      <div class="sec-label">AppShell</div>
      <div class="frame">
        <UiAppShell v-model:open="navOpen" height="100%" sidebar-width="200px">
          <template #sidebar>
            <div class="side">
              <p class="side-title">Mailbox</p>
              <a v-for="n in [['Inbox', Inbox], ['Starred', Star], ['Archive', Archive]]"
                 :key="n[0] as string" class="side-link" href="#">
                <UiIcon :is="n[1] as any" size="sm" />{{ n[0] }}
              </a>
            </div>
          </template>

          <template #topbar="{ toggle }">
            <div class="top">
              <UiButton class="only-narrow" variant="plain" tone="neutral" size="sm"
                        icon-only aria-label="Open navigation" @click="toggle">
                <UiIcon :is="Menu" size="sm" />
              </UiButton>
              <strong class="t-body">Inbox</strong>
              <UiButton variant="plain" tone="neutral" size="sm" icon-only
                        aria-label="Settings" class="push">
                <UiIcon :is="Settings" size="sm" />
              </UiButton>
            </div>
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
                Narrow the browser past 860px and the sidebar leaves the layout
                entirely — a fixed 200px column on a 700px screen is most of the
                screen. The button on the left of the topbar appears with it.
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
  height: 380px;
  border: 1px solid var(--rule);
  border-radius: var(--r-lg);
  overflow: clip;
}

.side { padding: var(--s-5); display: flex; flex-direction: column; gap: 2px; }
.side-title {
  margin: 0 0 var(--s-4); padding-inline: var(--s-3);
  font: var(--w-semibold) var(--fs-caption)/1 var(--font-sans);
  letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3);
}
.side-link {
  display: flex; align-items: center; gap: var(--s-4);
  padding: var(--s-3) var(--s-4); border-radius: var(--r-sm);
  color: var(--ink); text-decoration: none;
  font: var(--w-regular) var(--fs-small)/1 var(--font-sans);
}
.side-link:hover { background: var(--ui-bg-2); }

.top { display: flex; align-items: center; gap: var(--s-4); padding: var(--s-4) var(--s-6); }
.push { margin-inline-start: auto; }
.content { padding: var(--s-8); }
.detail { padding: var(--s-8); display: flex; flex-direction: column; gap: var(--s-3); }

.only-narrow { display: none; }
@media (max-width: 860px) { .only-narrow { display: inline-flex; } }
</style>
