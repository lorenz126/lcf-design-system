<script setup lang="ts">
/**
 * Diagram — a flowchart of nodes and edges.
 *
 * THE DEPENDENCY DECISION: no graph-layout package, and no Mermaid.
 *
 * Mermaid brings a parser for a text syntax we do not need — the data is
 * already data — and its own visual language, which would override every
 * token in this framework. dagre and elk solve a much harder problem than
 * a flowchart poses: a layered ranking plus a couple of barycentre sweeps
 * is about eighty lines, and they are eighty lines we can read.
 *
 * THE NODES ARE HTML, THE EDGES ARE SVG.
 *
 * Text in SVG does not wrap, does not inherit the type scale properly and
 * measures differently from everything else on the page. So the browser
 * lays the nodes out as ordinary boxes, and the edges are MEASURED from
 * the result rather than predicted. That is why edges appear on the first
 * client frame and not during SSR: there is nothing to measure until the
 * boxes exist.
 *
 * THE ACCESSIBLE FORM IS NOT A LABEL, IT IS THE GRAPH WRITTEN OUT.
 *
 * A picture of a flow is unreadable to a screen reader, and "flowchart,
 * image" tells nobody anything. The flow itself, though, is a sentence:
 * Start leads to Review; Review leads to Approved or Rejected. So the
 * drawing is aria-hidden and the graph is also emitted as text.
 *
 * Which is also why nodes carry no links: focusable content inside an
 * aria-hidden subtree is a trap. This renders a diagram; a clickable node
 * graph is an editor, and an editor is a different component.
 */
export interface DiagramNode {
  id: string
  label: string
  /**
   * step     — the default box
   * terminal — start and end, fully rounded
   * decision — a branch point
   */
  shape?: 'step' | 'terminal' | 'decision'
  tone?: 'neutral' | 'yellow' | 'green' | 'blue' | 'purple' | 'red' | 'orange'
  /** Second line, smaller: an owner, a condition, a duration. */
  note?: string
}

export interface DiagramEdge {
  from: string
  to: string
  /** Branch labels — "yes", "no", "on failure". */
  label?: string
}

const props = withDefaults(defineProps<{
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  direction?: 'down' | 'right'
  /** Names the diagram for the accessible summary, and for the caption. */
  title?: string
  /** Gap between ranks, and between siblings within a rank. */
  rankGap?: number
  nodeGap?: number
}>(), { direction: 'down', rankGap: 44, nodeGap: 20 })

const root = useTemplateRef<HTMLElement>('root')
const scroller = useTemplateRef<HTMLElement>('scroller')
const uid = useId()
const arrow = `u-dg-arrow-${uid}`

/* ---------- layout: ranks and order ---------- */

const layout = computed(() => {
  const ids = props.nodes.map(n => n.id)
  const known = new Set(ids)
  const edges = props.edges.filter(e => known.has(e.from) && known.has(e.to) && e.from !== e.to)

  const out = new Map<string, string[]>(ids.map(i => [i, []]))
  for (const e of edges) out.get(e.from)!.push(e.to)

  /* A cycle has no layering, so the edge that closes it is set aside and
     drawn as a loop. Depth-first: an edge into a node still on the stack
     is the one going backwards. */
  const back = new Set<string>()
  const mark = new Map<string, 0 | 1 | 2>(ids.map(i => [i, 0]))
  const visit = (id: string) => {
    mark.set(id, 1)
    for (const t of out.get(id)!) {
      const m = mark.get(t)
      if (m === 1) back.add(`${id} ${t}`)
      else if (m === 0) visit(t)
    }
    mark.set(id, 2)
  }
  for (const id of ids) if (mark.get(id) === 0) visit(id)

  const forward = edges.filter(e => !back.has(`${e.from} ${e.to}`))

  /* Longest-path ranking: a node sits one below its deepest predecessor,
     so no forward edge ever spans upward and the arrows all read the same
     way down the page. */
  const rank = new Map<string, number>(ids.map(i => [i, 0]))
  const left = new Map<string, number>(ids.map(i => [i, 0]))
  const fout = new Map<string, string[]>(ids.map(i => [i, []]))
  for (const e of forward) {
    fout.get(e.from)!.push(e.to)
    left.set(e.to, left.get(e.to)! + 1)
  }
  const queue = ids.filter(i => left.get(i) === 0)
  while (queue.length) {
    const id = queue.shift()!
    for (const t of fout.get(id)!) {
      rank.set(t, Math.max(rank.get(t)!, rank.get(id)! + 1))
      left.set(t, left.get(t)! - 1)
      if (left.get(t) === 0) queue.push(t)
    }
  }

  const depth = Math.max(0, ...rank.values())
  const ranks: string[][] = Array.from({ length: depth + 1 }, () => [])
  for (const id of ids) ranks[rank.get(id)!]!.push(id)

  /* Two barycentre sweeps: put each node near the average position of
     what it connects to. This does not minimise crossings — that problem
     is NP-hard — it removes the obvious ones cheaply. */
  const preds = new Map<string, string[]>(ids.map(i => [i, []]))
  const succs = new Map<string, string[]>(ids.map(i => [i, []]))
  for (const e of forward) {
    preds.get(e.to)!.push(e.from)
    succs.get(e.from)!.push(e.to)
  }
  const at = new Map<string, number>()
  const reindex = () => ranks.forEach(r => r.forEach((id, i) => at.set(id, i)))
  reindex()
  const sweep = (row: string[], rel: Map<string, string[]>) => {
    // Keys are taken before sorting: a comparator must not read a value
    // the sort itself is changing.
    const key = new Map(row.map(id => {
      const ns = rel.get(id)!.filter(n => at.has(n))
      return [id, ns.length ? ns.reduce((s, n) => s + at.get(n)!, 0) / ns.length : at.get(id)!]
    }))
    row.sort((a, b) => key.get(a)! - key.get(b)!)
  }
  for (let pass = 0; pass < 2; pass++) {
    for (let r = 1; r < ranks.length; r++) { sweep(ranks[r]!, preds); reindex() }
    for (let r = ranks.length - 2; r >= 0; r--) { sweep(ranks[r]!, succs); reindex() }
  }

  return {
    ranks,
    edges: edges.map(e => ({ ...e, back: back.has(`${e.from} ${e.to}`) })),
    hasBack: back.size > 0
  }
})

const byId = computed(() => new Map(props.nodes.map(n => [n.id, n])))

/* ---------- measure ---------- */

const boxes = ref<Record<string, { x: number; y: number; w: number; h: number }>>({})
const size = ref({ w: 0, h: 0 })
/** A wide diagram scrolls rather than being cut off by whatever contains
 *  it — and a region that scrolls has to be reachable without a mouse. */
const overflows = ref(false)
/** Which ends are flush. Used to fade the edge the content runs past. */
const flush = ref({ start: true, end: true })

function onScroll() {
  const sc = scroller.value
  if (!sc) return
  flush.value = {
    start: sc.scrollLeft <= 1,
    end: sc.scrollLeft + sc.clientWidth >= sc.scrollWidth - 1
  }
}

function measure() {
  const el = root.value
  if (!el) return
  const base = el.getBoundingClientRect()
  size.value = { w: base.width, h: base.height }
  const sc = scroller.value
  if (sc) overflows.value = sc.scrollWidth > sc.clientWidth + 1
  onScroll()
  const next: typeof boxes.value = {}
  for (const n of el.querySelectorAll<HTMLElement>('[data-node]')) {
    const r = n.getBoundingClientRect()
    next[n.dataset.node!] = { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }
  }
  boxes.value = next
}

let ro: ResizeObserver | undefined
onMounted(() => {
  measure()
  ro = new ResizeObserver(measure)
  // Both: root is max-content, so it is the scroller that changes width
  // when the window does.
  ro.observe(root.value!)
  if (scroller.value) ro.observe(scroller.value)
  // A font swap resizes every box, and nothing else tells us it happened.
  document.fonts?.ready.then(measure)
})
onBeforeUnmount(() => ro?.disconnect())
watch(() => [props.nodes, props.edges, props.direction], () => nextTick(measure), { deep: true })

/* ---------- edges ---------- */

type Pt = [number, number]

const cubic = (p: Pt[], t: number): Pt => {
  const u = 1 - t
  const at = (i: 0 | 1) =>
    u ** 3 * p[0]![i] + 3 * u * u * t * p[1]![i] + 3 * u * t * t * p[2]![i] + t ** 3 * p[3]![i]
  return [at(0), at(1)]
}

/**
 * Where an edge's label goes: a short way along the curve FROM ITS
 * SOURCE, not at its midpoint.
 *
 * A branch label belongs beside the branch it leaves. Halfway along a
 * long edge it ends up adrift among other edges, where it reads as
 * labelling whichever one it happens to land next to. Clamped to the
 * midpoint so a short edge keeps its label between the two nodes.
 */
function labelPoint(p: Pt[]): Pt {
  const steps = 24
  const pts: Pt[] = [cubic(p, 0)]
  const run: number[] = [0]
  for (let i = 1; i <= steps; i++) {
    const q = cubic(p, i / steps)
    const prev = pts[i - 1]!
    run.push(run[i - 1]! + Math.hypot(q[0] - prev[0], q[1] - prev[1]))
    pts.push(q)
  }
  const want = Math.min(26, run[steps]! / 2)
  const k = run.findIndex(l => l >= want)
  return pts[k < 0 ? steps : k]!
}

const paths = computed(() => {
  const b = boxes.value
  const down = props.direction === 'down'
  const all = Object.values(b)
  /* A loop has to clear the WHOLE diagram, not just its own two ends. A
     cubic peaks at (P0 + 6·C + P3) / 8, well short of its control points,
     so the controls are solved for the peak we want rather than guessed. */
  const far = down
    ? Math.max(0, ...all.map(n => n.x + n.w)) + 22
    : Math.max(0, ...all.map(n => n.y + n.h)) + 22
  const list: { key: string; d: string; label?: string; lx: number; ly: number; back: boolean }[] = []

  for (const e of layout.value.edges) {
    const s = b[e.from]
    const t = b[e.to]
    if (!s || !t) continue
    let d: string
    let lx: number
    let ly: number

    if (!e.back) {
      /* An edge always ARRIVES on the facing side, so every arrowhead
         meets its node square on. It LEAVES sideways when its target is
         off to one side — which is what a branch looks like, and what
         keeps two branch labels from landing on the same spot as they
         both drop out of the bottom of a decision. */
      const [tx, ty] = down ? [t.x + t.w / 2, t.y] : [t.x, t.y + t.h / 2]
      const near = down ? t.x + t.w / 2 : t.y + t.h / 2
      const lo = down ? s.x : s.y
      const hi = down ? s.x + s.w : s.y + s.h
      const side = near < lo - 4 ? -1 : near > hi + 4 ? 1 : 0

      let sx: number
      let sy: number
      let c1: Pt
      if (side === 0) {
        ;[sx, sy] = down ? [s.x + s.w / 2, s.y + s.h] : [s.x + s.w, s.y + s.h / 2]
        const bend = Math.max(14, (down ? ty - sy : tx - sx) / 2)
        c1 = down ? [sx, sy + bend] : [sx + bend, sy]
      } else {
        ;[sx, sy] = down
          ? [side < 0 ? s.x : s.x + s.w, s.y + s.h / 2]
          : [s.x + s.w / 2, side < 0 ? s.y : s.y + s.h]
        const reach = Math.max(22, (down ? ty - sy : tx - sx) / 3)
        c1 = down ? [sx + side * reach, sy] : [sx, sy + side * reach]
      }
      const bend = Math.max(14, (down ? ty - sy : tx - sx) / 2)
      const c2: Pt = down ? [tx, ty - bend] : [tx - bend, ty]
      d = `M${sx},${sy} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${tx},${ty}`
      ;[lx, ly] = labelPoint([[sx, sy], c1, c2, [tx, ty]])
    } else {
      // The edge that closes a cycle, routed clear of every rank.
      if (down) {
        const sx = s.x + s.w
        const tx = t.x + t.w
        const sy = s.y + s.h / 2
        const ty = t.y + t.h / 2
        const bx = (8 * far - sx - tx) / 6
        d = `M${sx},${sy} C${bx},${sy} ${bx},${ty} ${tx},${ty}`
        ;[lx, ly] = labelPoint([[sx, sy], [bx, sy], [bx, ty], [tx, ty]])
      } else {
        const sy = s.y + s.h
        const ty = t.y + t.h
        const sx = s.x + s.w / 2
        const tx = t.x + t.w / 2
        const by = (8 * far - sy - ty) / 6
        d = `M${sx},${sy} C${sx},${by} ${tx},${by} ${tx},${ty}`
        ;[lx, ly] = labelPoint([[sx, sy], [sx, by], [tx, by], [tx, ty]])
      }
    }
    list.push({ key: `${e.from} ${e.to}`, d, label: e.label, lx, ly, back: e.back })
  }
  return list
})

const labelled = computed(() => paths.value.filter(p => p.label))

/* ---------- the graph, written out ---------- */

const spoken = computed(() => {
  const out = new Map<string, string[]>(props.nodes.map(n => [n.id, []]))
  for (const e of props.edges) {
    const target = byId.value.get(e.to)
    if (!target || !out.has(e.from)) continue
    out.get(e.from)!.push(e.label ? `${target.label} (${e.label})` : target.label)
  }
  return props.nodes.map(n => {
    const next = out.get(n.id)!
    return {
      id: n.id,
      text: next.length ? `${n.label} leads to ${next.join(', ')}.` : `${n.label} ends the flow.`
    }
  })
})

const pad = computed(() => {
  // A loop needs somewhere to go, and only claims room when one exists.
  if (!layout.value.hasBack) return {}
  return props.direction === 'down' ? { paddingInlineEnd: '38px' } : { paddingBlockEnd: '38px' }
})
</script>

<template>
  <figure class="u-dg-fig">
    <div
      ref="scroller"
      class="u-dg-scroll"
      :class="{ 'u-dg-cut-s': !flush.start, 'u-dg-cut-e': !flush.end }"
      :tabindex="overflows ? 0 : undefined"
      :role="overflows ? 'group' : undefined"
      :aria-label="overflows ? (title ?? 'Flowchart') : undefined"
      @scroll="onScroll"
    >
      <div
        ref="root"
        class="u-dg"
        :class="`u-dg-${direction}`"
        aria-hidden="true"
        :style="{
          '--dg-rank-gap': `${rankGap}px`,
          '--dg-node-gap': `${nodeGap}px`,
          ...pad
        }"
      >
        <svg
          class="u-dg-wires"
          :viewBox="`0 0 ${size.w || 1} ${size.h || 1}`"
          :width="size.w"
          :height="size.h"
          focusable="false"
        >
          <defs>
            <marker
              :id="arrow"
              markerWidth="7"
              markerHeight="7"
              refX="7"
              refY="3.5"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L7,3.5 L0,7 z" fill="var(--border-strong)" />
            </marker>
          </defs>
          <path
            v-for="p in paths"
            :key="p.key"
            :d="p.d"
            class="u-dg-wire"
            :class="{ 'u-dg-wire-back': p.back }"
            :marker-end="`url(#${arrow})`"
          />
        </svg>

        <div class="u-dg-labels">
          <span
            v-for="p in labelled"
            :key="p.key"
            class="u-dg-elabel"
            :style="{ left: `${p.lx}px`, top: `${p.ly}px` }"
          >{{ p.label }}</span>
        </div>

        <div v-for="(row, r) in layout.ranks" :key="r" class="u-dg-rank">
          <div
            v-for="id in row"
            :key="id"
            :data-node="id"
            class="u-dg-node"
            :class="`u-dg-${byId.get(id)!.shape ?? 'step'}`"
            :data-tone="byId.get(id)!.tone ?? 'neutral'"
          >
            <span class="u-dg-label">{{ byId.get(id)!.label }}</span>
            <span v-if="byId.get(id)!.note" class="u-dg-note">{{ byId.get(id)!.note }}</span>
          </div>
        </div>
      </div>

      <!-- Not a substitute for the picture. The picture is a substitute for this. -->
      <div class="u-dg-sr">
        <p>{{ title ?? 'Flowchart' }}, {{ nodes.length }} steps.</p>
        <ul><li v-for="s in spoken" :key="s.id">{{ s.text }}</li></ul>
      </div>
    </div>

    <figcaption v-if="title || $slots.caption" class="u-dg-caption">
      <slot name="caption">{{ title }}</slot>
    </figcaption>
  </figure>
</template>

<style scoped>
.u-dg-fig { margin: 0; }

/* A diagram wider than what holds it scrolls, and the edge it runs past
   is FADED rather than painted over. A gradient would have to know the
   surface colour behind it — which changes with the theme and with
   whatever the diagram is placed on. A mask knows nothing and is right
   everywhere. */
.u-dg-scroll { overflow-x: auto; }
.u-dg-cut-e { mask-image: linear-gradient(to right, #000 calc(100% - 34px), transparent); }
.u-dg-cut-s { mask-image: linear-gradient(to left, #000 calc(100% - 34px), transparent); }
.u-dg-cut-s.u-dg-cut-e {
  mask-image: linear-gradient(to right, transparent, #000 34px, #000 calc(100% - 34px), transparent);
}
.u-dg-scroll:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 2px;
  border-radius: var(--r-sm);
}

.u-dg {
  position: relative;
  display: flex;
  gap: var(--dg-rank-gap);
  align-items: center;
  width: max-content;
}
.u-dg-down { flex-direction: column; }
.u-dg-right { flex-direction: row; }

.u-dg-rank {
  display: flex;
  gap: var(--dg-node-gap);
  align-items: center;
  justify-content: center;
}
.u-dg-right .u-dg-rank { flex-direction: column; }

/* Both overlays sit over the nodes and take no input: this draws, it does
   not respond. */
.u-dg-wires,
.u-dg-labels {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  pointer-events: none;
  overflow: visible;
}
.u-dg-labels { width: 100%; height: 100%; }

.u-dg-wire {
  fill: none;
  stroke: var(--border-strong);
  stroke-width: 1.5;
  stroke-linecap: round;
}
/* The edge that closes a cycle is dashed: it is the one that reads
   against the direction of everything else. */
.u-dg-wire-back { stroke-dasharray: 4 4; }

.u-dg-elabel {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 1px var(--s-3);
  border-radius: var(--r-xs);
  /* The chip punches a hole in the wire behind it, so it has to match
     the surface. --bg-raised, not --bg: the label belongs to the
     diagram's own palette — the same one the nodes use — and a diagram
     almost always sits on a card rather than straight on the page. */
  background: var(--bg-raised);
  color: var(--fg-muted);
  font: var(--w-medium) var(--fs-micro)/1.3 var(--font-sans);
  letter-spacing: var(--tr-micro);
  white-space: nowrap;
}

.u-dg-node {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  max-width: 190px;
  min-width: 96px;
  padding: var(--s-4) var(--s-6);
  border-radius: var(--r-md);
  border: var(--border-width) solid var(--dg-line, var(--border-strong));
  background: var(--dg-fill, var(--bg-raised));
  color: var(--fg);
  text-align: center;
}
.u-dg-terminal { border-radius: var(--r-full); padding-inline: var(--s-7); }
/* A true diamond gives its label a quarter of its own area, so either the
   text shrinks or the shape balloons. A chamfer says "branch" for the
   price of two corners. */
.u-dg-decision {
  clip-path: polygon(14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0 50%);
  padding-inline: var(--s-8);
  border-radius: 0;
}

/* Tint ground, the hue's own TEXT colour as the outline — the same
   recipe as Badge. The pure hue was the obvious choice and the wrong
   one: --yellow on a card measures 1.45:1, which is an outline you cannot
   see, and the outline is the whole shape of the node. */
.u-dg-node[data-tone="blue"]   { --dg-fill: var(--blue-fill);   --dg-line: var(--blue-text); }
.u-dg-node[data-tone="green"]  { --dg-fill: var(--green-fill);  --dg-line: var(--green-text); }
.u-dg-node[data-tone="red"]    { --dg-fill: var(--red-fill);    --dg-line: var(--red-text); }
.u-dg-node[data-tone="orange"] { --dg-fill: var(--orange-fill); --dg-line: var(--orange-text); }
.u-dg-node[data-tone="purple"] { --dg-fill: var(--purple-fill); --dg-line: var(--purple-text); }
.u-dg-node[data-tone="yellow"] { --dg-fill: var(--yellow-fill); --dg-line: var(--yellow-text); }

.u-dg-label {
  font: var(--w-medium) var(--fs-small)/1.3 var(--font-sans);
  letter-spacing: var(--tr-small);
}
.u-dg-note {
  font: var(--w-regular) var(--fs-micro)/1.3 var(--font-sans);
  color: var(--fg-muted);
}

.u-dg-caption {
  margin-top: var(--s-6);
  color: var(--fg-subtle);
  font: var(--w-regular) var(--fs-caption)/1.4 var(--font-sans);
}

.u-dg-sr {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
