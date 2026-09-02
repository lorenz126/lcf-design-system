<script setup lang="ts">
/**
 * Chart — bar, line and area on a validated three-colour palette.
 *
 * THREE series is a hard ceiling, and it is measured rather than chosen:
 * beyond three, no set of tones drawn from this system's hues clears the
 * colourblind-separation floor. A fourth series therefore does not get a
 * fourth colour — it gets small multiples, one panel per series, which
 * this component switches to on its own.
 *
 * Everything the eye needs is here twice: colour AND a legend, colour AND
 * a table view. Identity is never carried by colour alone.
 */
export interface Series {
  name: string
  values: number[]
}

const props = withDefaults(defineProps<{
  type?: 'bar' | 'line' | 'area'
  series: Series[]
  categories: string[]
  height?: number
  /** Axis and tooltip formatting. */
  format?: (n: number) => string
  unit?: string
  /** Above this, the chart facets into one panel per series. */
  maxSeries?: number
}>(), {
  type: 'bar',
  height: 220,
  maxSeries: 3,
  format: (n: number) => n.toLocaleString()
})

const uid = useId()
const faceted = computed(() => props.series.length > props.maxSeries)
const showTable = ref(false)

/* ---------- scale ---------- */

const PAD = { top: 12, right: 12, bottom: 28, left: 44 }
const W = 640

const max = computed(() => {
  /* Filtered, because ONE bad number takes the whole chart down rather
     than one point: a non-finite value here makes max NaN, and every
     coordinate derived from it is then NaN — axis, gridlines and labels
     included. A chart is often the first place bad data reaches a
     screen, and it should draw an empty axis rather than nothing at all.
     Found by building a consumer project against the packed layer and
     passing it the wrong prop shape. */
  const all = props.series.flatMap(s => s.values ?? []).filter(Number.isFinite)
  const m = Math.max(0, ...all)
  if (m === 0) return 1
  // Round up to a clean step so the axis reads in whole numbers.
  const mag = 10 ** Math.floor(Math.log10(m))
  return Math.ceil(m / mag * 2) / 2 * mag
})

const ticks = computed(() => {
  const n = 4
  return Array.from({ length: n + 1 }, (_, i) => (max.value / n) * i)
})

function plot(h: number) {
  return { w: W - PAD.left - PAD.right, h: h - PAD.top - PAD.bottom }
}
function xOf(i: number, h: number) {
  const { w } = plot(h)
  const step = w / props.categories.length
  return PAD.left + step * i + step / 2
}
function yOf(v: number, h: number) {
  const { h: ph } = plot(h)
  return PAD.top + ph - (v / max.value) * ph
}

/** Bars: a 2px surface gap between neighbours, per the mark spec. */
function barGeom(seriesIndex: number, i: number, count: number, h: number) {
  const { w } = plot(h)
  const step = w / props.categories.length
  const groupW = step * 0.62
  const gap = 2
  const barW = Math.max(2, (groupW - gap * (count - 1)) / count)
  const x = PAD.left + step * i + (step - groupW) / 2 + seriesIndex * (barW + gap)
  const y = yOf(props.series[seriesIndex]!.values[i] ?? 0, h)
  return { x, y, w: barW, h: Math.max(0, PAD.top + plot(h).h - y) }
}

function linePath(values: number[], h: number) {
  return values.map((v, i) => `${i ? 'L' : 'M'}${xOf(i, h).toFixed(1)} ${yOf(v, h).toFixed(1)}`).join(' ')
}
function areaPath(values: number[], h: number) {
  const base = PAD.top + plot(h).h
  return `${linePath(values, h)} L${xOf(values.length - 1, h).toFixed(1)} ${base} L${xOf(0, h).toFixed(1)} ${base} Z`
}

/* ---------- hover ---------- */

const hover = ref<number | null>(null)
const hostEl = useTemplateRef<HTMLElement>('host')

function onMove(e: MouseEvent, h: number) {
  const svg = (e.currentTarget as SVGElement).getBoundingClientRect()
  const x = ((e.clientX - svg.left) / svg.width) * W
  const { w } = plot(h)
  const step = w / props.categories.length
  const i = Math.floor((x - PAD.left) / step)
  hover.value = i >= 0 && i < props.categories.length ? i : null
}
</script>

<template>
  <figure ref="host" class="u-ch">
    <figcaption v-if="$slots.title" class="u-ch-title"><slot name="title" /></figcaption>

    <!-- Legend is present for two or more series, always. Colour alone is
         never the only carrier of identity. -->
    <div v-if="series.length > 1 && !faceted" class="u-ch-legend">
      <span v-for="(s, si) in series" :key="s.name" class="u-ch-key">
        <span class="u-ch-swatch" :style="{ background: `var(--chart-${si + 1})` }" />
        {{ s.name }}
      </span>
    </div>

    <p v-if="faceted" class="u-ch-note">
      {{ series.length }} series — shown as small multiples. Three is the most this
      palette can separate for a colourblind reader; a fourth colour would be a
      colour nobody can tell from another.
    </p>

    <div :class="faceted ? 'u-ch-facets' : undefined">
      <div v-for="(panel, pi) in (faceted ? series : [null])" :key="pi" class="u-ch-panel">
        <p v-if="faceted" class="u-ch-panel-title">
          <span class="u-ch-swatch" :style="{ background: `var(--chart-1)` }" />
          {{ panel!.name }}
        </p>

        <svg
          class="u-ch-svg"
          :viewBox="`0 0 ${W} ${faceted ? 140 : height}`"
          :style="{ height: `${faceted ? 140 : height}px` }"
          role="img"
          :aria-label="`${type} chart`"
          @mousemove="onMove($event, faceted ? 140 : height)"
          @mouseleave="hover = null"
        >
          <!-- grid: recessive, behind everything -->
          <g class="u-ch-grid">
            <line
              v-for="t in ticks"
              :key="t"
              :x1="PAD.left" :x2="W - PAD.right"
              :y1="yOf(t, faceted ? 140 : height)" :y2="yOf(t, faceted ? 140 : height)"
            />
          </g>

          <g class="u-ch-axis">
            <text
              v-for="t in ticks"
              :key="t"
              :x="PAD.left - 8"
              :y="yOf(t, faceted ? 140 : height)"
              text-anchor="end"
              dominant-baseline="middle"
            >{{ format(t) }}</text>
            <text
              v-for="(c, i) in categories"
              :key="c"
              :x="xOf(i, faceted ? 140 : height)"
              :y="(faceted ? 140 : height) - 8"
              text-anchor="middle"
            >{{ c }}</text>
          </g>

          <rect
            v-if="hover !== null"
            class="u-ch-hoverband"
            :x="PAD.left + (plot(faceted ? 140 : height).w / categories.length) * hover"
            :y="PAD.top"
            :width="plot(faceted ? 140 : height).w / categories.length"
            :height="plot(faceted ? 140 : height).h"
          />

          <!-- marks -->
          <template v-for="(s, si) in (faceted ? [panel!] : series)" :key="s.name">
            <template v-if="type === 'bar'">
              <rect
                v-for="(v, i) in s.values"
                :key="i"
                class="u-ch-bar"
                :x="barGeom(faceted ? 0 : si, i, faceted ? 1 : series.length, faceted ? 140 : height).x"
                :y="barGeom(faceted ? 0 : si, i, faceted ? 1 : series.length, faceted ? 140 : height).y"
                :width="barGeom(faceted ? 0 : si, i, faceted ? 1 : series.length, faceted ? 140 : height).w"
                :height="barGeom(faceted ? 0 : si, i, faceted ? 1 : series.length, faceted ? 140 : height).h"
                :fill="`var(--chart-${(faceted ? 0 : si) + 1})`"
                rx="3"
              />
            </template>

            <template v-else>
              <path
                v-if="type === 'area'"
                class="u-ch-area"
                :d="areaPath(s.values, faceted ? 140 : height)"
                :fill="`var(--chart-${(faceted ? 0 : si) + 1})`"
              />
              <path
                class="u-ch-line"
                :d="linePath(s.values, faceted ? 140 : height)"
                :stroke="`var(--chart-${(faceted ? 0 : si) + 1})`"
              />
              <circle
                v-for="(v, i) in s.values"
                v-show="hover === i"
                :key="i"
                class="u-ch-dot"
                :cx="xOf(i, faceted ? 140 : height)"
                :cy="yOf(v, faceted ? 140 : height)"
                r="4.5"
                :fill="`var(--chart-${(faceted ? 0 : si) + 1})`"
              />
            </template>
          </template>
        </svg>
      </div>
    </div>

    <div v-if="hover !== null && !faceted" class="u-ch-tip">
      <strong>{{ categories[hover] }}</strong>
      <span v-for="(s, si) in series" :key="s.name" class="u-ch-tiprow">
        <span class="u-ch-swatch" :style="{ background: `var(--chart-${si + 1})` }" />
        {{ s.name }}
        <b class="nums-tabular">{{ format(s.values[hover] ?? 0) }}{{ unit ? ` ${unit}` : '' }}</b>
      </span>
    </div>

    <button class="u-ch-toggle" :aria-expanded="showTable" @click="showTable = !showTable">
      {{ showTable ? 'Hide' : 'Show' }} data table
    </button>

    <!-- The same numbers without any colour at all — the relief the skill
         requires whenever colour carries meaning. -->
    <div v-if="showTable" class="u-ch-table">
      <table>
        <thead>
          <tr>
            <th scope="col">Series</th>
            <th v-for="c in categories" :key="c" scope="col">{{ c }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in series" :key="s.name">
            <th scope="row">{{ s.name }}</th>
            <td v-for="(v, i) in s.values" :key="i" class="nums-tabular">{{ format(v) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </figure>
</template>

<style scoped>
.u-ch { margin: 0; display: flex; flex-direction: column; gap: var(--s-5); position: relative; }
.u-ch-title {
  font: var(--w-semibold) var(--fs-body)/1.3 var(--font-sans);
  letter-spacing: var(--tr-body);
}

.u-ch-legend { display: flex; flex-wrap: wrap; gap: var(--s-6); }
.u-ch-key, .u-ch-tiprow {
  display: inline-flex; align-items: center; gap: var(--s-3);
  /* Text wears ink tokens, never the series colour. */
  color: var(--fg-muted);
  font: var(--w-regular) var(--fs-caption)/1 var(--font-sans);
}
.u-ch-swatch { width: 9px; height: 9px; border-radius: 2px; flex: none; }

.u-ch-note {
  margin: 0; max-width: 68ch;
  font: var(--w-regular) var(--fs-caption)/1.5 var(--font-sans);
  color: var(--fg-muted);
}

.u-ch-svg { width: 100%; display: block; overflow: visible; }

.u-ch-grid line { stroke: var(--rule-faint); stroke-width: 1; }
.u-ch-axis text {
  fill: var(--fg-subtle);
  font: var(--w-regular) 10px var(--font-sans);
  font-variant-numeric: tabular-nums;
}

.u-ch-hoverband { fill: var(--fill-quiet); }
.u-ch-bar { transition: opacity var(--dur-fast) var(--ease-out); }
.u-ch-line { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.u-ch-area { opacity: .12; }
.u-ch-dot { stroke: var(--bg); stroke-width: 2; }

.u-ch-facets { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--s-7); }
.u-ch-panel-title {
  display: flex; align-items: center; gap: var(--s-3); margin: 0 0 var(--s-2);
  font: var(--w-medium) var(--fs-caption)/1 var(--font-sans);
  color: var(--fg-muted);
}

.u-ch-tip {
  position: absolute; top: 0; inset-inline-end: 0;
  display: flex; flex-direction: column; gap: var(--s-2);
  padding: var(--s-4) var(--s-5);
  border: var(--border-width) solid var(--border);
  border-radius: var(--r-md);
  background: var(--bg-raised);
  box-shadow: var(--shadow-2);
  pointer-events: none;
  font: var(--w-regular) var(--fs-caption)/1.3 var(--font-sans);
}
.u-ch-tip strong { color: var(--fg); font-weight: var(--w-semibold); }
.u-ch-tiprow b { margin-inline-start: auto; color: var(--fg); font-weight: var(--w-medium); }

.u-ch-toggle {
  align-self: flex-start;
  border: 0; background: transparent; padding: 0; cursor: pointer;
  font: var(--w-medium) var(--fs-caption)/1 var(--font-sans);
  color: var(--accent-text); text-decoration: underline;
  text-underline-offset: .15em;
}
.u-ch-toggle:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 2px; border-radius: var(--r-xs);
}

.u-ch-table table { width: 100%; border-collapse: collapse; font-size: var(--fs-small); }
.u-ch-table th, .u-ch-table td {
  padding: var(--s-3) var(--s-5);
  border-bottom: var(--border-width) solid var(--border);
  text-align: end;
}
.u-ch-table thead th:first-child, .u-ch-table tbody th { text-align: start; font-weight: var(--w-medium); }
.u-ch-table thead th { color: var(--fg-muted); font-weight: var(--w-medium); }
</style>
