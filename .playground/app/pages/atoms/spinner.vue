<script setup lang="ts">
useHead({ title: 'Spinner — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">One of these, not three.</p>
      <p class="t-body body">
        It exists because it had already been written twice, and the second copy is
        where a system starts to diverge without anyone deciding to.
      </p>
    </div>

    <section>
      <div class="sec-label">Sizes, and inside a button</div>
      <div class="row">
        <UiSpinner size="sm" />
        <UiSpinner size="md" />
        <UiSpinner size="lg" />
        <UiButton loading>Saving</UiButton>
        <UiButton variant="outline" tone="neutral" loading>Checking</UiButton>
        <span class="t-title inh"><UiSpinner size="inherit" /></span>
      </div>
      <p class="t-caption hint">
        There used to be two of these — Button had one and List had a second,
        identical down to the 0.6s and the border trick, under two different keyframe
        names. A table that was also loading had neither and said “Loading…” in text.
        That is what duplication looks like just before it becomes divergence.
      </p>
      <p class="t-caption hint">
        <strong>Reduced motion slows it; it does not stop it.</strong> Everything else
        in the system collapses to 1ms under <code>prefers-reduced-motion</code>, which
        is right for a transition — the end state is the point. A stopped spinner is
        not a finished one, it is a frozen one, and it says the opposite of what it is
        there to say. Two seconds a turn is calm and still clearly alive.
      </p>
      <p class="t-caption hint">
        The last one is <code>size="inherit"</code>: 1em, so it takes the size of
        whatever text it stands in. That is how it sits inside a button without being
        told the button’s size.
      </p>
    </section>
  </div>
</template>

<style scoped>
.row { gap: var(--s-5); }
.inh { color: var(--ink-2); }
</style>
