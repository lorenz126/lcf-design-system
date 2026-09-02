<script setup lang="ts">
import { BookOpen, CircleDot, GitPullRequest, Lock } from 'lucide-vue-next'
const tab = ref('overview')
const slowTab = ref('overview')
const manyTab = ref('t1')
const sideTab = ref('general')

const repoTabs = [
  { value: 'overview', label: 'Overview', icon: BookOpen },
  { value: 'issues', label: 'Issues', icon: CircleDot, badge: 12 },
  { value: 'pulls', label: 'Pull requests', icon: GitPullRequest, badge: 3 },
  { value: 'admin', label: 'Admin', icon: Lock, disabled: true }
]

const manyTabs = Array.from({ length: 14 }, (_, i) => ({
  value: `t${i + 1}`,
  label: ['Overview', 'Issues', 'Pull requests', 'Actions', 'Projects', 'Wiki',
    'Security', 'Insights', 'Settings', 'Packages', 'Releases', 'Environments',
    'Deployments', 'Webhooks'][i]!
}))

const sideTabs = [
  { value: 'general', label: 'General' },
  { value: 'appearance', label: 'Appearance' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'advanced', label: 'Advanced' }
]
useHead({ title: 'Tabs — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Several views, one place to put them.</p>
      <p class="t-body body">
        If switching changes the URL it is not a tablist — it is navigation, and it
        wants links with <code>aria-current</code>. That line, and the one separating it
        from <NuxtLink to="/molecules/toggle-group">ToggleGroup</NuxtLink>, is most of
        the design.
      </p>
    </div>

    <section>
      <div class="sec-label">Automatic and manual</div>
      <div class="col">
        <UiTabs v-model="tab" :items="repoTabs" label="Repository">
          <template #default="{ active }">
            <UiCard>The <strong>{{ active }}</strong> panel. One panel, not four.</UiCard>
          </template>
        </UiTabs>

        <UiTabs v-model="slowTab" :items="repoTabs" variant="pill" activation="manual" label="Repository, manually" />
      </div>
      <p class="t-caption hint">
        <strong>If switching changes the URL, this is not a tablist</strong> — it is
        navigation, and it wants links with <code>aria-current</code>. A
        <code>role="tab"</code> on an anchor promises a panel that swaps in place and
        then reloads the document instead. The same line separates Tabs from
        ToggleGroup, which can be made to look identical: <em>choose by what it does,
        not by how it looks.</em> A tablist swaps what you are looking at; a radiogroup
        sets a value you will later submit.
      </p>
      <p class="t-caption hint">
        The first bar selects <strong>as the arrows move</strong>, which is the ARIA
        default and right for panels that are already there. The second is
        <code>manual</code>: arrows move focus, Enter or Space chooses. That is for a
        panel that <em>fetches</em> — automatic activation fires a request per keypress.
        Both are correct, so it is a prop, and the consumer is the one that knows.
      </p>
      <p class="t-caption hint">
        <strong>Admin is focusable.</strong> Arrow onto it: focus lands, nothing opens.
        A real <code>disabled</code> attribute would take it out of the focus order, the
        roving tabindex could not reach it, and the cursor would drift off focus — which
        is the bug the Calendar already paid for once.
      </p>

      <div class="narrow">
        <UiTabs v-model="manyTab" :items="manyTabs" label="Fourteen of them" />
      </div>
      <p class="t-caption hint">
        Fourteen tabs in a narrow box. <strong>Overflow scrolls</strong>, because of the
        three answers it is the only one that leaves the keyboard model whole. Wrapping
        keeps it but turns Left and Right into a guess about line breaks. Collapsing the
        extras into a “More” menu moves them <em>out</em> of the tablist: the arrows can
        no longer reach them, the roving tabindex spans two widgets, and
        <code>role="tablist"</code> stops containing its own tabs. Hold Right and watch
        focus carry the row along with it.
      </p>
      <p class="t-caption hint">
        The edges fade only when there is something past them — which needs a
        measurement, not a permanent mask. A fade over a row that fits says there is
        more when there is not.
      </p>

      <div class="side-demo">
        <UiTabs v-model="sideTab" :items="sideTabs" orientation="vertical" label="Settings">
          <template #default="{ active }">
            <UiCard>Settings · {{ active }}</UiCard>
          </template>
        </UiTabs>
      </div>
      <p class="t-caption hint">
        Upright, where Up and Down move instead — and Left and Right are left alone,
        because they are not this widget’s to take.
      </p>
    </section>
  </div>
</template>

<style scoped>
.narrow { max-width: 320px; }
.side-demo { max-width: 520px; }
.col { gap: var(--s-5); }
</style>
