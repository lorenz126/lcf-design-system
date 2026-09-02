<script setup lang="ts">
useHead({ title: 'Card — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">It bounds what you put in it and knows nothing about the contents.</p>
      <p class="t-body body">
        A <strong>molecule</strong>, and the tier is the whole point: hand
        <NuxtLink to="/organisms/list">List</NuxtLink> some items and it decides what
        becomes a row, which is a data shape and therefore an organism. Card decides
        nothing.
      </p>
    </div>

    <section>
      <div class="sec-label">Card — border or shadow</div>
      <div class="cards">
        <UiCard>
          <template #header><strong class="t-headline">Flat</strong></template>
          A border. Sits <em>in</em> the layout — the default.
        </UiCard>
        <UiCard variant="raised">
          <template #header><strong class="t-headline">Raised</strong></template>
          A shadow. Sits <em>on</em> the layout.
        </UiCard>
        <UiCard variant="glass">
          <template #header><strong class="t-headline">Glass</strong></template>
          Needs something behind it to mean anything.
        </UiCard>
      </div>
      <p class="t-caption hint">
        The light is in front, so an even offset-free halo reads as “lifted toward the
        viewer”. That makes a shadow a claim that the thing is <em>on</em> the layout —
        and a grid where every card is raised claims it of all of them, so none of them
        read as raised. Border is the default for that reason.
      </p>
    </section>
  </div>
</template>

<style scoped>
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--s-6); }
.cards.two { grid-template-columns: repeat(2, 1fr); }
</style>
