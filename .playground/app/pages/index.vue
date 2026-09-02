<script setup lang="ts">
import { principles } from '~/data/principles'
useHead({ title: 'Principles — Design Framework' })

const defined = computed(() => principles.reduce((n, g) => n + g.items.length, 0))
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Taste is as much refusal as preference.</p>
      <p class="t-body body">
        These are the rules behind the tokens — the decisions that stay constant across
        projects. Written as <em>always</em> and <em>never</em> so they can actually settle
        an argument. Every principle carries its reason; a rule you can’t justify is a
        habit, not a principle.
      </p>
      <p class="t-caption meta">{{ defined }} defined across {{ principles.length }} groups</p>
    </div>

    <PrincipleGroup v-for="g in principles" :key="g.group" :group="g" />
  </div>
</template>

<style scoped>
.meta { margin: 14px 0 0; color: var(--ink-2); font-family: var(--font-mono); }
</style>
