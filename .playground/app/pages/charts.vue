<script setup lang="ts">
useHead({ title: 'Charts — Design Framework' })

const categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const three = [
  { name: 'Direct', values: [4200, 4800, 5100, 4900, 6200, 6800] },
  { name: 'Search', values: [2800, 3100, 2900, 3600, 3900, 4400] },
  { name: 'Referral', values: [1200, 1400, 1900, 1700, 2100, 2600] }
]
const five = [
  ...three,
  { name: 'Social', values: [800, 950, 1100, 1400, 1300, 1800] },
  { name: 'Email', values: [600, 700, 640, 900, 1100, 1250] }
]
const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k` : String(n)
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Three series, and the ceiling is measured.</p>
      <p class="t-body body">
        Charts use their own palette, not the six UI hues. Those fail as a categorical
        set: yellow leaves the lightness band, three tones sit under 3:1 against the
        surface, and yellow↔orange land at ΔE 6.5 for <em>normal</em> vision against a
        floor of 15 — at the lightness a light surface demands, both collapse toward
        brown.
      </p>
      <p class="t-caption warn">
        The three below are staggered in <strong>lightness</strong> as well as hue.
        Protanopia collapses hue and leaves lightness, so three tones of equal
        lightness — which is exactly what carrying white text demands — are
        indistinguishable to it however different their hues look to everyone else.
      </p>
    </div>

    <section>
      <div class="sec-label">Bar</div>
      <UiChart :series="three" :categories="categories" :format="fmt" unit="visits">
        <template #title>Sessions by channel</template>
      </UiChart>
    </section>

    <section>
      <div class="sec-label">Line</div>
      <UiChart type="line" :series="three" :categories="categories" :format="fmt" unit="visits">
        <template #title>Sessions by channel</template>
      </UiChart>
      <p class="t-caption hint">
        Hover anywhere across the plot: the band and the tooltip follow the category,
        not the individual mark, so every series is readable at that point in one
        gesture.
      </p>
    </section>

    <section>
      <div class="sec-label">Area</div>
      <UiChart type="area" :series="[three[0]!]" :categories="categories" :format="fmt">
        <template #title>Direct sessions</template>
      </UiChart>
      <p class="t-caption hint">
        A single series gets no legend — the title already names it. A legend box for
        one thing is noise.
      </p>
    </section>

    <section>
      <div class="sec-label">More than three</div>
      <UiChart :series="five" :categories="categories" :format="fmt">
        <template #title>Sessions by channel</template>
      </UiChart>
      <p class="t-caption hint">
        Five series, so it facets on its own. A fourth colour is not available — it
        would be a colour nobody can reliably tell from another. Small multiples give
        up cross-series comparison at a glance and keep every series legible, which is
        the better trade.
      </p>
    </section>

    <section>
      <div class="sec-label">Without colour at all</div>
      <p class="t-caption hint">
        Every chart above carries a <strong>Show data table</strong> toggle. Colour
        never carries meaning alone here: there is a legend for identity, and the table
        for anyone who cannot use either.
      </p>
    </section>
  </div>
</template>

<style scoped>
.intro { border-left: 2px solid var(--rule); padding-left: 20px; margin-bottom: 64px; }
.lede { margin: 0 0 10px; }
.body { margin: 0 0 14px; color: var(--ink-2); max-width: 68ch; }
.warn { margin: 0; color: var(--ink-3); max-width: 68ch; line-height: 1.6; }
section { margin-bottom: 64px; }
.hint { color: var(--ink-3); margin: 14px 0 0; max-width: 68ch; line-height: 1.6; }
</style>
