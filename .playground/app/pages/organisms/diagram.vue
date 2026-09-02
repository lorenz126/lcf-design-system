<script setup lang="ts">
import type { DiagramNode, DiagramEdge } from '../../../../ui/organisms/Diagram.vue'

useHead({ title: 'Diagrams — Design Framework' })

const nodes: DiagramNode[] = [
  { id: 'open', label: 'Pull request', shape: 'terminal', tone: 'blue' },
  { id: 'ci', label: 'CI', note: 'contrast, layers, build' },
  { id: 'pass', label: 'Green?', shape: 'decision', tone: 'yellow' },
  { id: 'review', label: 'Review' },
  { id: 'fix', label: 'Fix it', tone: 'red' },
  { id: 'changes', label: 'Changes requested', shape: 'decision', tone: 'yellow' },
  { id: 'merge', label: 'Merge', shape: 'terminal', tone: 'green' }
]

const edges: DiagramEdge[] = [
  { from: 'open', to: 'ci' },
  { from: 'ci', to: 'pass' },
  { from: 'pass', to: 'review', label: 'yes' },
  { from: 'pass', to: 'fix', label: 'no' },
  { from: 'review', to: 'changes' },
  { from: 'changes', to: 'fix', label: 'yes' },
  { from: 'changes', to: 'merge', label: 'no' },
  { from: 'fix', to: 'ci' }
]

const pipeline: DiagramNode[] = [
  { id: 'tok', label: 'Tokens', note: 'colour, type, geometry' },
  { id: 'base', label: 'base.css', note: 'the one file that applies them' },
  { id: 'atoms', label: 'Atoms', tone: 'blue' },
  { id: 'mol', label: 'Molecules', tone: 'purple' },
  { id: 'org', label: 'Organisms', tone: 'green' },
  { id: 'tpl', label: 'Templates', tone: 'orange' }
]
const pipeEdges: DiagramEdge[] = [
  { from: 'tok', to: 'base' },
  { from: 'base', to: 'atoms' },
  { from: 'atoms', to: 'mol' },
  { from: 'mol', to: 'org' },
  { from: 'org', to: 'tpl' }
]
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">The nodes are HTML. Only the edges are SVG.</p>
      <p class="t-body body">
        Text in SVG does not wrap, does not inherit the type scale properly and measures
        differently from everything else on the page. So the browser lays the nodes out
        as ordinary boxes, and the edges are <strong>measured</strong> from the result
        rather than predicted.
      </p>
      <p class="t-caption warn">
        No layout package and no Mermaid. Mermaid brings a parser for a syntax we do not
        need — the data is already data — and a visual language that would override every
        token here. A layered ranking plus two barycentre sweeps is eighty lines, and they
        are eighty lines we can read.
      </p>
    </div>

    <section>
      <div class="sec-label">A flow with a cycle</div>
      <UiCard padding="lg">
        <UiDiagram
          :nodes="nodes"
          :edges="edges"
          title="How a change reaches main"
        />
      </UiCard>
      <p class="t-caption hint">
        Nothing here specifies a position. Ranks come from longest-path layering, so a node
        sits one row below its deepest predecessor and no forward edge ever points back up
        the page. <strong>Fix it → CI</strong> closes a cycle, which has no layering at
        all: that one edge is set aside, drawn dashed and routed clear of the ranks.
      </p>
    </section>

    <section>
      <div class="sec-label">Left to right</div>
      <UiCard padding="lg">
        <UiDiagram
          :nodes="pipeline"
          :edges="pipeEdges"
          direction="right"
          :node-gap="16"
          title="What this framework is made of"
        />
      </UiCard>
      <p class="t-caption hint">
        The same layout, turned. Edges anchor on the facing sides and leave each box
        perpendicular to it, so an arrow always meets its node square on.
      </p>
    </section>

    <section>
      <div class="sec-label">What a screen reader gets</div>
      <div class="row">
        <UiProse size="sm" class="notes">
          <p>
            A picture of a flow is unreadable, and “flowchart, image” tells nobody
            anything. The flow itself, though, is a sentence. So the drawing is
            <code>aria-hidden</code> and the graph is emitted as text beside it:
          </p>
        </UiProse>
        <UiCard>
          <ul class="spoken">
            <li class="t-caption">Pull request leads to CI.</li>
            <li class="t-caption">CI leads to Green?.</li>
            <li class="t-caption">Green? leads to Review (yes), Fix it (no).</li>
            <li class="t-caption">Merge ends the flow.</li>
          </ul>
        </UiCard>
      </div>
      <p class="t-caption hint">
        This is also why a node carries no link: focusable content inside an
        <code>aria-hidden</code> subtree is a trap. This renders a diagram. A clickable
        node graph is an editor, and an editor is a different component.
      </p>
    </section>
  </div>
</template>

<style scoped>
.warn { margin: 0; color: var(--ink-2); max-width: 68ch; line-height: 1.6; }
.row { display: flex; gap: var(--s-9); align-items: flex-start; flex-wrap: wrap; }
.notes { flex: 1; min-width: 260px; max-width: 40ch; }
.spoken { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; min-width: 240px; color: var(--ink-2); }
</style>
