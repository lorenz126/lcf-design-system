<script setup lang="ts">
useHead({ title: 'Type — Design Framework' })

/** Step names only. Every displayed value is read back from the rendered
 *  element, so this page can never drift from tokens/type.css. */
const steps = [
  'display-lg', 'display', 'display-sm',
  'title-lg', 'title', 'title-sm',
  'lead', 'body', 'small', 'caption', 'micro'
] as const

const SENTENCE = 'Design that disappears into the work it supports, quietly and without ceremony'

/** Longer text for smaller steps so every line fills its measure. */
function sample(step: string) {
  const short = ['display-lg', 'display', 'display-sm', 'title-lg']
  const mid = ['title', 'title-sm']
  if (short.includes(step)) return 'Design that disappears'
  if (mid.includes(step)) return 'Design that disappears into the work'
  if (step === 'lead') return 'Design that disappears into the work it supports'
  if (step === 'micro') return SENTENCE.toUpperCase()
  return SENTENCE
}

const WEIGHT_NAMES: Record<string, string> = {
  '400': 'regular', '500': 'medium', '600': 'semibold', '700': 'bold'
}

const measured = ref<Record<string, string>>({})
const samples = useTemplateRef<HTMLElement[]>('samples')

onMounted(() => {
  const out: Record<string, string> = {}
  for (const el of samples.value ?? []) {
    const s = getComputedStyle(el)
    const step = el.dataset.step!
    const size = Math.round(parseFloat(s.fontSize))
    const lh = Math.round(parseFloat(s.lineHeight))
    // letter-spacing computes to px; convert back to em for legibility
    const tr = parseFloat(s.letterSpacing) / size
    const sign = tr > 0.0005 ? '+' : ''
    out[step] = `${size} / ${lh} / ${WEIGHT_NAMES[s.fontWeight] ?? s.fontWeight}\n` +
                `${sign}${tr.toFixed(3)}em`
  }
  measured.value = out
})
</script>

<template>
  <div>
    <section>
      <div class="sec-label">The ramp — measured from the rendered output</div>
      <div v-for="step in steps" :key="step" class="row">
        <div class="meta">
          <b>{{ step }}</b>
          <span class="vals">{{ measured[step] ?? '…' }}</span>
        </div>
        <div ref="samples" :data-step="step" :class="`sample t-${step}`">{{ sample(step) }}</div>
      </div>
    </section>

    <section>
      <div class="sec-label">Why tracking matters</div>
      <div class="cmp">
        <div>
          <h4>Tracked (this system)</h4>
          <div class="t-display-sm">Hamburgefonstiv</div>
          <div class="t-title sp">Hamburgefonstiv 24</div>
          <div class="t-caption sp">HAMBURGEFONSTIV AT TWELVE PIXELS</div>
        </div>
        <div>
          <h4>letter-spacing: 0</h4>
          <div class="t-display-sm flat">Hamburgefonstiv</div>
          <div class="t-title flat sp">Hamburgefonstiv 24</div>
          <div class="t-caption flat sp">HAMBURGEFONSTIV AT TWELVE PIXELS</div>
        </div>
      </div>
    </section>

    <section>
      <div class="sec-label">Weights — four, not nine</div>
      <div class="weights t-title-sm">
        <div style="font-weight:400">Regular 400 · body copy, long-form reading</div>
        <div style="font-weight:500">Medium 500 · UI labels, buttons, table headers</div>
        <div style="font-weight:600">Semibold 600 · headings, the workhorse</div>
        <div style="font-weight:700">Bold 700 · display and hard emphasis only</div>
      </div>
    </section>

    <section>
      <div class="sec-label">Reading test</div>
      <p class="t-lead measure first">A type scale is not a list of font sizes. It is a set of decisions about hierarchy that you make once, so you never have to make them again.</p>
      <p class="t-body measure dim">The steps here are hand-tuned rather than generated from a modular ratio. Pure ratios produce values like 12.8px and 20.5px, which land off the pixel grid and render soft. Every size in this ramp is a whole number, and the gaps widen as the scale climbs — small jumps where UI text needs fine gradation, large jumps where display type needs real contrast.</p>
      <p class="t-small measure dim">Secondary text sits at 13px with zero tracking — the point where SF needs neither tightening nor opening.</p>
    </section>

    <section>
      <div class="sec-label">Tabular numerals</div>
      <div class="cmp">
        <div>
          <h4>tabular-nums</h4>
          <div class="t-body nums-tabular figs">1,284.00<br>9,911.25<br>&nbsp;&nbsp;417.80<br>11,003.05</div>
        </div>
        <div>
          <h4>default (proportional)</h4>
          <div class="t-body figs">1,284.00<br>9,911.25<br>&nbsp;&nbsp;417.80<br>11,003.05</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.row {
  display: grid; grid-template-columns: 132px 1fr; gap: 28px;
  align-items: baseline; padding: 16px 0; border-bottom: 1px solid var(--rule);
}
.meta { color: var(--ink-2); font-family: var(--font-mono); font-size: 11px; line-height: 1.5; }
.meta b {
  display: block; color: var(--ink-2); font-family: var(--font-sans);
  font-weight: var(--w-medium); font-size: 12px; margin-bottom: 3px;
}
.vals { white-space: pre-line; }
.sample { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cmp { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
.cmp > div { padding: 24px; background: var(--ui-bg-2); border-radius: 12px; }
h4 {
  margin: 0 0 14px; font-size: 11px; letter-spacing: .09em;
  text-transform: uppercase; color: var(--ink-2); font-weight: var(--w-semibold);
}
.sp { margin-top: 12px; }
.flat { letter-spacing: 0 !important; }
.weights div { padding: 10px 0; border-bottom: 1px solid var(--rule); }
.first { margin-top: 0; }
.dim { color: var(--ink-2); }
.figs { line-height: 1.8; }
</style>
