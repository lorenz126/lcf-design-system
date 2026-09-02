<script setup lang="ts">
import {
  Archive, Bell, Check, ChevronRight, Download, Heart, Plus, Search, Settings,
  Star, Trash2, Upload
} from 'lucide-vue-next'
useHead({ title: 'Icon — Design Framework' })
const glyphs = [Search, Bell, Settings, Star, Heart, Check, Plus, Trash2, Archive, Download, Upload, ChevronRight]
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">It takes the component, not a name.</p>
      <p class="t-body body">
        A name-based lookup would need the whole library in the bundle to resolve at
        runtime. Passing the component keeps tree-shaking intact — you ship the icons
        you actually used, and nothing else.
      </p>
    </div>

    <section>
      <div class="sec-label">Sizes</div>
      <div class="row sizes">
        <span class="spec"><UiIcon :is="Settings" size="sm" /> <code>sm</code></span>
        <span class="spec"><UiIcon :is="Settings" size="md" /> <code>md</code></span>
        <span class="spec"><UiIcon :is="Settings" size="lg" /> <code>lg</code></span>
        <span class="spec"><UiIcon :is="Settings" :size="40" /> <code>40</code></span>
        <span class="spec t-title"><UiIcon :is="Settings" size="inherit" /> <code class="dim">inherit</code></span>
      </div>
      <p class="t-caption hint">
        <strong>The stroke thins as the glyph grows.</strong> A 1.75px line that reads
        correctly at 16px is a heavy rope at 40, so the weight is tied to the size
        rather than fixed — which is the same thing a typeface does across its optical
        sizes, and for the same reason.
      </p>
      <p class="t-caption hint">
        <code>size="inherit"</code> is 1em, so the glyph takes the size of whatever text
        it stands in. That is how an icon sits inside a button without being told the
        button’s size.
      </p>
    </section>

    <section>
      <div class="sec-label">A glyph is not a name</div>
      <div class="row">
        <UiButton icon-only aria-label="Delete project" tone="red"><UiIcon :is="Trash2" /></UiButton>
        <UiButton variant="outline" tone="neutral" icon-only aria-label="Settings"><UiIcon :is="Settings" /></UiButton>
        <span class="spec"><UiIcon :is="Star" :label="'Favourite'" /> <code>label</code></span>
        <span class="spec"><UiIcon :is="Star" /> <code class="dim">decorative</code></span>
      </div>
      <p class="t-caption hint">
        <strong>Decorative by default</strong>, because most icons sit beside text that
        already says the thing and reading them out is noise. Anything a glyph
        communicates that the surrounding words do not gets a <code>label</code>, which
        turns it into an <code>img</code> role with an accessible name. Icon refuses to
        be a name, and so does
        <NuxtLink to="/atoms/button">Button</NuxtLink> — an icon-only button warns in
        development if its <code>aria-label</code> is missing, rather than leaving it to
        documentation.
      </p>
    </section>

    <section>
      <div class="sec-label">The set</div>
      <div class="grid">
        <UiIcon v-for="(g, i) in glyphs" :key="i" :is="g" size="lg" />
      </div>
      <p class="t-caption hint">
        Lucide, because it is one consistent grid and stroke rather than a set of
        drawings that happen to be in one file. The framework does not wrap the whole
        library — it wraps the three things that were being got wrong per call site:
        size, stroke and whether the thing has a name.
      </p>
    </section>
  </div>
</template>

<style scoped>
.sizes { align-items: flex-end; gap: var(--s-8); }
.spec { display: inline-flex; align-items: center; gap: var(--s-3); color: var(--ink-2); }
.grid { display: flex; flex-wrap: wrap; gap: var(--s-7); color: var(--ink-2); }
</style>
