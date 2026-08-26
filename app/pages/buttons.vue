<script setup lang="ts">
useHead({ title: 'Buttons — Design Framework' })

const variants = ['solid', 'tinted', 'outline', 'plain'] as const
const tones = ['accent', 'green', 'red', 'orange', 'yellow', 'purple'] as const
const sizes = ['sm', 'md', 'lg'] as const
const loading = ref(false)
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Four variants, one hierarchy.</p>
      <p class="t-body body">
        <strong>Solid</strong> is the thing you want pressed — one per screen.
        <strong>Tinted</strong> carries colour without competing.
        <strong>Outline</strong> is neutral secondary.
        <strong>Plain</strong> reads as a link with a hit area.
      </p>
      <p class="t-caption warn">
        White text fails AA on every Apple tone — blue 4.02, red 3.55, yellow 1.51 —
        so solid buttons use the same lightness split as the badges: light hues keep
        the bright tone and take deep text, dark hues use the darkened tone and take
        white.
      </p>
    </div>

    <section>
      <div class="sec-label">Variants × tones</div>
      <div class="matrix">
        <div class="corner" />
        <div v-for="t in tones" :key="t" class="col-head">{{ t }}</div>
        <template v-for="v in variants" :key="v">
          <div class="row-head">{{ v }}</div>
          <div v-for="t in tones" :key="v + t" class="cell">
            <UiButton :variant="v" :tone="t">Label</UiButton>
          </div>
        </template>
      </div>
    </section>

    <section>
      <div class="sec-label">Sizes</div>
      <div class="row">
        <UiButton v-for="s in sizes" :key="s" :size="s">Continue</UiButton>
        <UiButton v-for="s in sizes" :key="'t' + s" :size="s" variant="tinted">Continue</UiButton>
      </div>
    </section>

    <section>
      <div class="sec-label">States</div>
      <div class="row">
        <UiButton>Default</UiButton>
        <UiButton disabled>Disabled</UiButton>
        <UiButton :loading="loading" @click="loading = !loading">
          {{ loading ? 'Working' : 'Click to load' }}
        </UiButton>
        <UiButton variant="outline" href="#">As a link</UiButton>
      </div>
      <p class="t-caption hint">
        Tab to a button to see the focus ring — one definition shared by every
        control in the system.
      </p>
    </section>

    <section>
      <div class="sec-label">Destructive pairing</div>
      <div class="row">
        <UiButton tone="red">Delete project</UiButton>
        <UiButton variant="plain" tone="neutral">Cancel</UiButton>
      </div>
      <p class="t-caption hint">
        The destructive action is solid, the escape is plain. Never two solids —
        it makes the dangerous choice look equally routine.
      </p>
    </section>

    <section>
      <div class="sec-label">Full width</div>
      <div class="stack">
        <UiButton block>Continue</UiButton>
        <UiButton block variant="outline" tone="neutral">Not now</UiButton>
      </div>
    </section>
  </div>
</template>

<style scoped>
.intro { border-left: 2px solid var(--rule); padding-left: 20px; margin-bottom: 64px; }
.lede { margin: 0 0 10px; }
.body { margin: 0; color: var(--ink-2); max-width: 68ch; }
.warn { margin: 14px 0 0; color: var(--ink-3); max-width: 68ch; line-height: 1.6; }
section { margin-bottom: 64px; }

.matrix {
  display: grid;
  grid-template-columns: 78px repeat(6, 1fr);
  gap: var(--s-4);
  align-items: center;
}
.col-head, .row-head {
  font-family: var(--font-mono); font-size: 10px; color: var(--ink-3);
}
.row-head { text-align: right; padding-right: var(--s-2); }
.cell { display: flex; }

.row { display: flex; flex-wrap: wrap; gap: var(--s-5); align-items: center; }
.stack { display: flex; flex-direction: column; gap: var(--s-4); max-width: 340px; }
.hint { color: var(--ink-3); margin: 14px 0 0; max-width: 68ch; line-height: 1.6; }
</style>
