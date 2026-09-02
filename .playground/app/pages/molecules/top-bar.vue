<script setup lang="ts">
import { Bell, Search, Settings } from 'lucide-vue-next'
useHead({ title: 'TopBar — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Slots, a height, and a rule under it.</p>
      <p class="t-body body">
        It carries no navigation of its own. Everything in it is passed in, because a
        top bar that knew what belonged in it would be wrong for the second application
        that used it.
      </p>
    </div>

    <section>
      <div class="sec-label">On its own</div>
      <div class="frame">
        <UiTopBar>
          <template #leading><strong class="t-small">Design Framework</strong></template>
          <template #center>
            <UiSearchField size="md" placeholder="Search" block />
          </template>
          <template #trailing>
            <UiButton variant="plain" tone="neutral" icon-only aria-label="Notifications">
              <UiIcon :is="Bell" />
            </UiButton>
            <UiButton variant="plain" tone="neutral" icon-only aria-label="Settings">
              <UiIcon :is="Settings" />
            </UiButton>
            <UiAvatar name="Lorenz Flechtenmacher" size="sm" />
          </template>
        </UiTopBar>
      </div>
      <p class="t-caption hint">
        Three slots, and the middle one is the only one that stretches. That is the
        whole layout: a bar whose centre grew or shrank with its contents would move
        the search field every time a badge appeared beside it.
      </p>
      <p class="t-caption hint">
        In a shell it spans the <strong>full</strong> width by default, which puts the
        sidebar toggle above the sidebar — over the thing it controls.
        <code>topbar="main"</code> stops it at the content instead, for a shell whose
        sidebar carries its own brand. See
        <NuxtLink to="/templates/app-shell">AppShell</NuxtLink>, where the choice
        actually shows.
      </p>
    </section>
  </div>
</template>

<style scoped>
.frame { border: 1px solid var(--rule); border-radius: var(--r-lg); overflow: clip; }
</style>
