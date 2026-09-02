<script setup lang="ts">
import { FileCode, FileText, Folder, Image } from 'lucide-vue-next'
useHead({ title: 'TreeView — Design Framework' })

const opened = ref<(string | number)[]>(['src', 'ui'])
const picked = ref<string | number | null>('atoms')

const files = [
  {
    id: 'src', label: 'src', icon: Folder, note: '4',
    children: [
      {
        id: 'ui', label: 'ui', icon: Folder, note: '4',
        children: [
          { id: 'atoms', label: 'atoms', icon: Folder, note: '14' },
          { id: 'molecules', label: 'molecules', icon: Folder, note: '21' },
          { id: 'organisms', label: 'organisms', icon: Folder, note: '12' },
          { id: 'templates', label: 'templates', icon: Folder, note: '3' }
        ]
      },
      {
        id: 'composables', label: 'composables', icon: Folder, note: '6',
        children: [
          { id: 'anchored', label: 'useAnchored.ts', icon: FileCode },
          { id: 'commands', label: 'useCommands.ts', icon: FileCode },
          { id: 'datetext', label: 'useDateText.ts', icon: FileCode }
        ]
      },
      { id: 'tokens', label: 'tokens', icon: Folder, note: '5' }
    ]
  },
  {
    id: 'assets', label: 'assets', icon: Folder,
    children: [
      { id: 'logo', label: 'logo.svg', icon: Image },
      { id: 'og', label: 'og-image.png', icon: Image }
    ]
  },
  { id: 'readme', label: 'README.md', icon: FileText },
  { id: 'roadmap', label: 'ROADMAP.md', icon: FileText },
  { id: 'lock', label: 'pnpm-lock.yaml', icon: FileText, disabled: true }
]
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Arbitrary depth, driven from the keyboard.</p>
      <p class="t-body body">
        <NuxtLink to="/organisms/sidebar">Sidebar</NuxtLink> refused to become this, and
        the refusal was right: a navigation column has one level of nesting because a
        person has to see where they are. This is the component for the case where the
        depth is genuinely the data’s.
      </p>
    </div>

    <section>
      <div class="sec-label">A file tree, and everything it had to get right</div>
      <div class="stage">
        <UiTreeView
          v-model="picked"
          v-model:expanded="opened"
          :items="files"
          label="Repository"
        />
        <div class="beside">
          <p class="t-caption dim">Selected: <strong>{{ picked ?? 'nothing' }}</strong></p>
          <p class="t-caption dim">Open: <code>{{ JSON.stringify(opened) }}</code></p>
        </div>
      </div>
      <p class="t-caption hint">
        <strong>Click a row and then use only the keyboard.</strong> Down and Up walk
        the <em>visible</em> rows across levels, so the last child of a group leads to
        the next group rather than to nothing. Home and End go to the first and last
        visible row. A letter jumps to the next row starting with it.
      </p>
      <p class="t-caption hint">
        <strong>Right and Left each do two things, and that is what makes it
        navigable.</strong> Right opens a closed node; on an already open one it steps
        into it. Left closes an open node; on a closed one it walks out to the parent.
        Hold Left and you leave the structure a level per press — the gesture everyone
        already has from every file browser. Four keys’ worth of work from two.
      </p>
      <p class="t-caption hint">
        Press <strong>*</strong> on any row: every sibling at that level opens. It is
        the one key in the pattern that does what a mouse would take a dozen clicks to
        do, and it leaves the other levels alone.
      </p>
      <p class="t-caption hint">
        <strong>One tab stop for the whole tree</strong>, over the visible rows only —
        which is the part a flat roving tabindex gets wrong. The list the arrows walk is
        not the list of nodes, it is the list of nodes you can currently <em>see</em>,
        and it changes every time something opens. So it is derived, never stored: an
        index into a list that has since changed is how a cursor ends up somewhere
        nobody pointed it.
      </p>
      <p class="t-caption hint">
        <strong>The level is spoken, not just indented.</strong>
        <code>aria-level</code>, <code>aria-posinset</code> and
        <code>aria-setsize</code> are the only thing telling a screen reader that a row
        is the second of four, three deep. Indentation says it to an eye and to nothing
        else.
      </p>
      <p class="t-caption hint">
        <strong>Expansion is a model, not internal state.</strong> Which folders are
        open is something an application usually wants to remember across a reload, and
        a component holding it privately makes that impossible. The list above is the
        page’s.
      </p>
      <p class="t-caption hint">
        The chevron is <strong>decoration</strong>. <code>aria-expanded</code> on the
        row already says whether it is open, and a real button there would be a second
        tab stop on every node — a hundred-node tree with two hundred stops in it.
      </p>
      <p class="t-caption hint">
        A row with children <strong>opens and chooses in one gesture</strong>. Half a
        row doing something different from the other half is a row nobody can predict.
        And <code>pnpm-lock.yaml</code> is disabled: focus lands on it, nothing opens —
        the same argument as a disabled tab.
      </p>
    </section>
  </div>
</template>

<style scoped>
.stage {
  display: flex;
  gap: var(--s-8);
  align-items: flex-start;
  border: 1px solid var(--rule);
  border-radius: var(--r-lg);
  padding: var(--s-5);
}
.stage > :first-child { flex: none; width: 280px; }
.beside { display: flex; flex-direction: column; gap: var(--s-4); padding-top: var(--s-3); }
</style>
