<script setup lang="ts">
useHead({ title: 'Badges — Design Framework' })
const tones = ['neutral', 'green', 'blue', 'yellow', 'orange', 'red', 'purple'] as const
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">A marker, not a control.</p>
      <p class="t-body body">
        Fully rounded on purpose. Buttons are never capsules in this system precisely
        so that a capsule means <em>this is a label, not a thing you press</em>. The
        two shapes have to stay distinct for either rule to carry meaning.
      </p>
    </div>

    <section>
      <div class="sec-label">Tones</div>
      <div class="row">
        <UiBadge v-for="t in tones" :key="t" :tone="t">{{ t }}</UiBadge>
      </div>
      <p class="t-caption hint">
        One recipe for all six: tint ground, the hue’s own text. Yellow and orange
        land at 4.34:1 and 4.40:1 — just under AA — because a light hue on a light
        tint has the least contrast to give. Their tint is pulled paler than the
        others to claw back what it can. Consistency of the row wins here; a badge
        set where two of six invert reads as a mistake rather than a rule.
      </p>
    </section>

    <section>
      <div class="sec-label">With a dot</div>
      <div class="row">
        <UiBadge tone="green" dot>Live</UiBadge>
        <UiBadge tone="yellow" dot>Pending</UiBadge>
        <UiBadge tone="red" dot>Failed</UiBadge>
        <UiBadge tone="neutral" dot>Draft</UiBadge>
      </div>
    </section>

    <section>
      <div class="sec-label">Sizes</div>
      <div class="row">
        <UiBadge tone="blue" size="sm">Small</UiBadge>
        <UiBadge tone="blue">Medium</UiBadge>
      </div>
    </section>

    <section>
      <div class="sec-label">In context</div>
      <div class="list">
        <div v-for="r in [
          { n: 'api-gateway', t: 'green', s: 'Deployed' },
          { n: 'billing-worker', t: 'yellow', s: 'Degraded' },
          { n: 'legacy-import', t: 'red', s: 'Failing' },
          { n: 'docs-site', t: 'neutral', s: 'Paused' }
        ]" :key="r.n" class="li">
          <span class="t-body name">{{ r.n }}</span>
          <UiBadge :tone="(r.t as any)" dot size="sm">{{ r.s }}</UiBadge>
        </div>
      </div>
      <p class="t-caption hint">
        This is where badges earn their shape — scanned down a column, the capsule and
        the dot carry the status before the word is read.
      </p>
    </section>
  </div>
</template>

<style scoped>
.intro { border-left: 2px solid var(--rule); padding-left: 20px; margin-bottom: 64px; }
.lede { margin: 0 0 10px; }
.body { margin: 0; color: var(--ink-2); max-width: 68ch; }
section { margin-bottom: 64px; }
.row { display: flex; flex-wrap: wrap; gap: var(--s-5); align-items: center; }
.hint { color: var(--ink-3); margin: 14px 0 0; max-width: 68ch; line-height: 1.6; }
.list { border: 1px solid var(--rule); border-radius: var(--r-lg); overflow: hidden; max-width: 420px; }
.li {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--s-5) var(--s-6); border-bottom: 1px solid var(--rule);
}
.li:last-child { border-bottom: 0; }
.name { font-family: var(--font-mono); font-size: 12px; color: var(--ink); }
</style>
