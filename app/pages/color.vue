<script setup lang="ts">
import { semantic, primitives } from '~/data/colorTokens'
useHead({ title: 'Colour — Design Framework' })

interface Resolved { hex: string; ratio?: number; grade?: string }

const resolved = ref<Record<string, Resolved>>({})
const probe = useTemplateRef<HTMLElement>('probe')

/** Read every token's real computed value out of the CSS, so this page
 *  reports what the browser actually resolved — not what we assumed. */
function measure() {
  const el = probe.value
  if (!el) return

  const read = (token: string) => {
    el.style.backgroundColor = `var(${token})`
    return parseRgb(getComputedStyle(el).backgroundColor)
  }

  const bg = read('--bg')
  const out: Record<string, Resolved> = {}

  for (const g of [...semantic, ...primitives]) {
    for (const token of g.tokens) {
      const rgb = read(token)
      if (!rgb) continue
      const entry: Resolved = { hex: toHex(rgb) }
      if (g.checkContrast && bg) {
        entry.ratio = contrast(rgb, bg)
        entry.grade = grade(entry.ratio)
      }
      out[token] = entry
    }
  }
  resolved.value = out
}

let observer: MutationObserver | undefined
onMounted(() => {
  measure()
  // Re-measure when the theme flips.
  observer = new MutationObserver(measure)
  observer.observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme']
  })
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div>
    <div ref="probe" class="probe" aria-hidden="true" />

    <div class="intro">
      <p class="t-lead lede">Two tiers, and the separation is the whole point.</p>
      <p class="t-body body">
        <strong>Primitives</strong> are literal values. <strong>Semantic</strong> tokens are
        roles. Components may only ever reference the semantic tier — that indirection is
        what lets you re-theme, add dark mode, or fix a contrast failure without touching a
        single component.
      </p>
      <p class="t-caption warn">
        Every value here is a placeholder. The neutral ramp is deliberately untuned
        (equal R/G/B) and the accent is a generic blue. Replace them in
        <code>tokens/color.css</code>.
      </p>
    </div>

    <section>
      <div class="sec-label">Tier 2 · Semantic — the only tier components may use</div>
      <div v-for="g in semantic" :key="g.group" class="group">
        <div class="head">
          <h2>{{ g.group }}</h2>
          <span v-if="g.scope" class="scope">{{ g.scope }}</span>
        </div>
        <div class="grid">
          <div v-for="t in g.tokens" :key="t" class="swatch">
            <div class="chip" :style="{ background: `var(${t})` }" />
            <div class="info">
              <div class="name">{{ t }}</div>
              <div class="hex">{{ resolved[t]?.hex ?? '…' }}</div>
              <div v-if="resolved[t]?.ratio" class="ratio">
                <span :class="['badge', resolved[t]!.grade === 'Fail' ? 'bad' : 'good']">
                  {{ resolved[t]!.grade }}
                </span>
                <span class="num">{{ resolved[t]!.ratio!.toFixed(2) }}:1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="sec-label">Tier 1 · Primitives — never reference these in a component</div>
      <div v-for="g in primitives" :key="g.group" class="group">
        <div class="head"><h2>{{ g.group }}</h2></div>
        <div class="ramp">
          <div v-for="t in g.tokens" :key="t" class="step">
            <div class="bar" :style="{ background: `var(${t})` }" />
            <div class="step-name">{{ t.replace('--', '') }}</div>
            <div class="step-hex">{{ resolved[t]?.hex ?? '' }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.probe { position: absolute; width: 0; height: 0; visibility: hidden; }
.intro { border-left: 2px solid var(--rule); padding-left: 20px; margin-bottom: 64px; }
.lede { margin: 0 0 10px; }
.body { margin: 0; color: var(--ink-2); max-width: 68ch; }
.warn { margin: 14px 0 0; color: var(--ink-3); max-width: 68ch; line-height: 1.6; }
code { font-family: var(--font-mono); font-size: 11px; }

section { margin-bottom: 72px; }
.group { margin-bottom: 40px; }
.head {
  display: flex; align-items: baseline; gap: 12px;
  padding-bottom: 10px; border-bottom: 1px solid var(--rule); margin-bottom: 20px;
}
h2 {
  margin: 0; font: var(--w-semibold) var(--fs-title-sm)/1.2 var(--font-sans);
  letter-spacing: var(--tr-title-sm);
}
.scope { color: var(--ink-3); font-size: var(--fs-small); }

.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.swatch {
  display: flex; gap: 14px; align-items: center;
  border: 1px solid var(--rule); border-radius: 10px; padding: 12px;
}
.chip {
  width: 44px; height: 44px; border-radius: 8px; flex: none;
  box-shadow: inset 0 0 0 1px rgb(128 128 128 / .25);
}
.info { min-width: 0; }
.name {
  font-family: var(--font-mono); font-size: 11px; color: var(--ink);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.hex { font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); margin-top: 2px; }
.ratio { display: flex; align-items: center; gap: 6px; margin-top: 5px; }
.badge {
  font-size: 10px; font-weight: var(--w-semibold); padding: 1px 5px; border-radius: 4px;
}
.good { background: color-mix(in srgb, var(--always) 16%, transparent); color: var(--always); }
.bad  { background: color-mix(in srgb, var(--never) 16%, transparent);  color: var(--never); }
.num { font-family: var(--font-mono); font-size: 10px; color: var(--ink-3); }

.ramp { display: flex; gap: 2px; }
.step { flex: 1; min-width: 0; }
.bar {
  height: 64px; border-radius: 4px;
  box-shadow: inset 0 0 0 1px rgb(128 128 128 / .2);
}
.step-name {
  font-family: var(--font-mono); font-size: 9px; color: var(--ink-2);
  margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.step-hex { font-family: var(--font-mono); font-size: 9px; color: var(--ink-3); }
</style>
