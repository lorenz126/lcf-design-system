<script setup lang="ts">
import { ArrowRight, Plus, Trash2, Settings } from 'lucide-vue-next'
useHead({ title: 'Button — Design Framework' })

const variants = ['solid', 'tinted', 'outline', 'plain', 'floating'] as const
const tones = ['accent', 'green', 'red', 'orange', 'yellow', 'purple'] as const
const sizes = ['sm', 'md', 'lg'] as const
const loading = ref(false)
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Six variants, one hierarchy.</p>
      <p class="t-body body">
        <strong>Solid</strong> is the thing you want pressed — one per screen.
        <strong>Tinted</strong> carries colour without competing.
        <strong>Outline</strong> is neutral secondary.
        <strong>Plain</strong> reads as a link with a hit area.
        <strong>Floating</strong> is solid, lifted — for actions sitting on content
        rather than in the layout. <strong>Glass</strong> needs something behind it.
      </p>
      <p class="t-caption warn">
        Solid is white text always, so the background moves instead: each tone is the
        brightest version of its hue that still carries white at 4.5:1. Apple’s own
        tones do not clear it (blue 4.02, red 3.55, yellow 1.51), so these sit a step
        deeper. Blue, purple and red stay recognisable; yellow and orange cannot —
        at the lightness white needs, they are brown.
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
      <div class="sec-label">Icons</div>
      <div class="row">
        <UiButton>
          <template #leading><UiIcon :is="Plus" /></template>
          New project
        </UiButton>
        <UiButton variant="tinted">
          Continue
          <template #trailing><UiIcon :is="ArrowRight" /></template>
        </UiButton>
        <UiButton variant="outline" tone="neutral" icon-only aria-label="Settings">
          <UiIcon :is="Settings" />
        </UiButton>
        <UiButton tone="red" icon-only aria-label="Delete project">
          <UiIcon :is="Trash2" />
        </UiButton>
        <UiButton loading>
          <template #leading><UiIcon :is="Plus" /></template>
          Working
        </UiButton>
      </div>
      <p class="t-caption hint">
        The spinner takes the leading slot’s place rather than adding to it, so the
        button keeps its width while it works. Icon-only buttons require
        <code>aria-label</code> — the component warns in dev if it is missing, rather
        than leaving it to documentation.
      </p>
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
        <UiButton variant="tinted" tone="red">Archive instead</UiButton>
        <UiButton variant="plain" tone="neutral">Cancel</UiButton>
      </div>
      <p class="t-caption hint">
        Three weights, three levels of consequence: solid destroys, tinted is the
        reversible alternative, plain escapes. Never two solids — it makes the
        dangerous choice look equally routine.
      </p>
    </section>

    <section>
      <div class="sec-label">Floating</div>
      <div class="float-stage">
        <UiButton variant="floating">Compose</UiButton>
        <UiButton variant="floating" tone="green">Publish</UiButton>
        <UiButton variant="floating" tone="neutral">Dismiss</UiButton>
      </div>
      <p class="t-caption hint">
        The light sits directly in front, so the shadow is centred rather than
        cast downward, and depth reads as scale instead of vertical travel.
        Hover and press one: it grows toward you, then drops back past its
        resting shadow.
      </p>
    </section>

    <section>
      <div class="sec-label">Glass</div>
      <div class="glass-stage">
        <UiButton variant="glass">Continue</UiButton>
        <UiButton variant="glass" tone="red">Delete</UiButton>
        <UiButton variant="glass" tone="neutral">Cancel</UiButton>
      </div>
      <div class="glass-stage alt">
        <UiButton variant="glass">Continue</UiButton>
        <UiButton variant="glass" tone="green">Save</UiButton>
        <UiButton variant="glass" tone="neutral">Cancel</UiButton>
      </div>
      <p class="t-caption hint">
        Glass only exists against a backdrop — on a flat surface it reads as a weak
        outline. Its contrast cannot be guaranteed the way the other variants can,
        because what sits behind it is unknown; the tint opacity is the only thing
        holding the label legible.
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
.matrix {
  display: grid;
  grid-template-columns: 78px repeat(6, 1fr);
  gap: var(--s-4);
  align-items: center;
}
.col-head, .row-head {
  font-family: var(--font-mono); font-size: 10px; color: var(--ink-2);
}
.row-head { text-align: right; padding-right: var(--s-2); }
.cell { display: flex; }

.row { gap: var(--s-5); }
.stack { gap: var(--s-4); max-width: 340px; }

.float-stage {
  display: flex; gap: var(--s-6); align-items: center;
  padding: var(--s-9); border-radius: var(--r-lg);
  background: var(--bg-raised);
  border: 1px solid var(--rule);
}
.glass-stage {
  display: flex; gap: var(--s-6); align-items: center;
  padding: var(--s-9); border-radius: var(--r-lg);
  background:
    radial-gradient(circle at 15% 20%, #ff9500, transparent 45%),
    radial-gradient(circle at 70% 15%, #af52de, transparent 50%),
    radial-gradient(circle at 40% 90%, #007aff, transparent 55%),
    linear-gradient(120deg, #34c759, #ffcc00);
}
.glass-stage.alt {
  margin-top: var(--s-4);
  background:
    radial-gradient(circle at 80% 30%, #5856d6, transparent 55%),
    linear-gradient(140deg, #1c1c1e, #48484a 60%, #8e8e93);
}
</style>
