<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronRight } from 'lucide-vue-next'

/**
 * TreeView — arbitrary depth, driven from the keyboard.
 *
 * SIDEBAR REFUSED TO BECOME THIS, and the refusal was right. A navigation
 * column has one level of nesting because a person has to be able to see
 * where they are; growing it a level at a time is how it turns into a
 * file explorer nobody asked for. This is the component for the case
 * where the depth is genuinely the data's — a folder tree, an org chart,
 * a JSON document.
 *
 * IT IS AN ORGANISM because it owns a data shape: handed a tree, it
 * decides what becomes a row, what can open, and what a level means.
 *
 * ONE TAB STOP FOR THE WHOLE TREE, over the VISIBLE nodes only. Which is
 * the part a flat roving tabindex gets wrong: the list the arrows walk is
 * not the list of nodes, it is the list of nodes you can currently see,
 * and it changes every time something opens. So it is derived, never
 * stored — an index into a list that has since changed is how a cursor
 * ends up somewhere nobody pointed it.
 *
 * The keyboard is the ARIA tree pattern, and every key in it earns its
 * place:
 *
 *   Down / Up      the next and previous VISIBLE node, across levels
 *   Right          open a closed node; on an open one, its first child
 *   Left           close an open node; on a closed one, its PARENT
 *   Home / End     the first and last visible node
 *   Enter, Space   choose
 *   *              open every sibling at this level
 *   a letter       the next visible node starting with it
 *
 * Right and Left doing two things each is not cleverness — it is what
 * makes a tree navigable with two keys instead of four. Pressing Left
 * repeatedly walks you out of the structure, one level per press, which
 * is the gesture people already have from every file browser.
 *
 * EXPANSION IS A MODEL, not internal state. Which folders are open is
 * something an application usually wants to remember across a reload,
 * and a component holding it privately makes that impossible.
 *
 * THE LEVEL IS SPOKEN, not just indented. aria-level, aria-setsize and
 * aria-posinset are the only thing telling a screen reader that this row
 * is the second of five, three deep — indentation says it to an eye and
 * to nothing else.
 */
export interface TreeNode {
  id: string | number
  label: string
  icon?: Component
  /** A trailing note — a count, a size, a type. */
  note?: string
  children?: TreeNode[]
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  items: TreeNode[]
  /** Names the tree. Required when nothing visible does. */
  label?: string
  size?: 'sm' | 'md'
  /** Shown, focusable, and refused — the same argument as a disabled tab. */
  emptyText?: string
}>(), { size: 'md', emptyText: 'Nothing here.' })

const expanded = defineModel<(string | number)[]>('expanded', { default: () => [] })
const selected = defineModel<string | number | null>({ default: null })

const emit = defineEmits<{
  select: [TreeNode]
  /** A node that can open being opened. Somewhere to load children. */
  expand: [TreeNode]
}>()

const root = useTemplateRef<HTMLElement>('root')

const isOpen = (n: TreeNode) => expanded.value.includes(n.id)
const hasKids = (n: TreeNode) => !!n.children?.length

/**
 * The visible nodes, in the order they appear. DERIVED, for the reason
 * above: this list is different after every open and close, and anything
 * that stored an index into it would be pointing at a different row.
 */
interface Row { node: TreeNode; level: number; pos: number; size: number; parent?: TreeNode }
const rows = computed(() => {
  const out: Row[] = []
  const walk = (nodes: TreeNode[], level: number, parent?: TreeNode) => {
    nodes.forEach((node, i) => {
      out.push({ node, level, pos: i + 1, size: nodes.length, parent })
      if (hasKids(node) && isOpen(node)) walk(node.children!, level + 1, node)
    })
  }
  walk(props.items, 1)
  return out
})

/* ---------- the one tab stop ---------- */

/** Where focus last was. */
const seen = ref<string | number>()

const stop = computed(() => {
  const ids = rows.value.map(r => r.node.id)
  if (selected.value !== null && ids.includes(selected.value)) return selected.value
  if (seen.value !== undefined && ids.includes(seen.value)) return seen.value
  return ids[0]
})

const at = (id: string | number) => rows.value.findIndex(r => r.node.id === id)

function focusAt(i: number) {
  const row = rows.value[i]
  if (!row) return
  seen.value = row.node.id
  nextTick(() => {
    root.value?.querySelector<HTMLElement>(`[data-id="${CSS.escape(String(row.node.id))}"]`)?.focus()
  })
}

/* ---------- opening ---------- */

function setOpen(n: TreeNode, on: boolean) {
  if (!hasKids(n)) return
  if (on && !isOpen(n)) {
    expanded.value = [...expanded.value, n.id]
    emit('expand', n)
  } else if (!on && isOpen(n)) {
    expanded.value = expanded.value.filter(id => id !== n.id)
  }
}

function choose(n: TreeNode) {
  if (n.disabled) return
  selected.value = n.id
  emit('select', n)
}

/** Click on a row with children opens it AND chooses it. Two gestures on
 *  one row is a row where half the surface does something different. */
function activate(n: TreeNode) {
  if (n.disabled) return
  if (hasKids(n)) setOpen(n, !isOpen(n))
  choose(n)
}

/* ---------- the keyboard ---------- */

let typed = ''
let typedAt = 0

function onKey(e: KeyboardEvent, row: Row) {
  const i = at(row.node.id)
  const n = row.node
  const last = rows.value.length - 1

  switch (e.key) {
    case 'ArrowDown': e.preventDefault(); focusAt(Math.min(i + 1, last)); return
    case 'ArrowUp': e.preventDefault(); focusAt(Math.max(i - 1, 0)); return
    case 'Home': e.preventDefault(); focusAt(0); return
    case 'End': e.preventDefault(); focusAt(last); return

    case 'ArrowRight':
      e.preventDefault()
      /* Open it, or step into it. Two meanings, one key — which is what
         lets a tree be walked with two keys instead of four. */
      if (hasKids(n) && !isOpen(n)) setOpen(n, true)
      else if (hasKids(n) && isOpen(n)) nextTick(() => focusAt(i + 1))
      return

    case 'ArrowLeft':
      e.preventDefault()
      /* Close it, or step out of it. Pressing it repeatedly walks you
         out of the structure, one level per press. */
      if (hasKids(n) && isOpen(n)) setOpen(n, false)
      else if (row.parent) focusAt(at(row.parent.id))
      return

    case 'Enter':
    case ' ':
      e.preventDefault()
      activate(n)
      return

    case '*':
      /* Every sibling at this level. The one key in the pattern that
         does something a mouse would take a dozen clicks to do. */
      e.preventDefault()
      for (const r of rows.value.filter(r => r.level === row.level && r.parent === row.parent)) {
        setOpen(r.node, true)
      }
      return
  }

  /* Typeahead over the visible rows, wrapping past where you are. A tree
     deep enough to need this is one where arrowing to a known name is
     twenty presses. */
  if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const now = Date.now()
    typed = now - typedAt > 700 ? e.key : typed + e.key
    typedAt = now
    const list = rows.value
    for (let k = 1; k <= list.length; k++) {
      const r = list[(i + k) % list.length]!
      if (r.node.label.toLowerCase().startsWith(typed.toLowerCase())) {
        e.preventDefault()
        focusAt(at(r.node.id))
        return
      }
    }
  }
}
</script>

<template>
  <div
    ref="root"
    class="u-tv"
    :class="`u-s-${size}`"
    role="tree"
    :aria-label="label"
  >
    <p v-if="!rows.length" class="u-tv-empty">{{ emptyText }}</p>

    <div
      v-for="row in rows"
      :key="row.node.id"
      role="treeitem"
      class="u-tv-row"
      :class="{
        'u-tv-on': row.node.id === selected,
        'u-tv-off': row.node.disabled
      }"
      :data-id="row.node.id"
      :style="{ '--lvl': row.level }"
      :aria-level="row.level"
      :aria-posinset="row.pos"
      :aria-setsize="row.size"
      :aria-expanded="row.node.children?.length ? isOpen(row.node) : undefined"
      :aria-selected="row.node.id === selected"
      :aria-disabled="row.node.disabled || undefined"
      :tabindex="row.node.id === stop ? 0 : -1"
      @click="activate(row.node)"
      @focus="seen = row.node.id"
      @keydown="onKey($event, row)"
    >
      <!-- Decoration: aria-expanded on the row already says this, and a
           second control here would be a second tab stop per node. -->
      <span class="u-tv-twist" :class="{ 'u-tv-leaf': !row.node.children?.length }" aria-hidden="true">
        <UiIcon :is="ChevronRight" size="sm" />
      </span>
      <UiIcon v-if="row.node.icon" :is="row.node.icon" size="sm" class="u-tv-ico" />
      <span class="u-tv-label">{{ row.node.label }}</span>
      <span v-if="row.node.note" class="u-tv-note">{{ row.node.note }}</span>
    </div>
  </div>
</template>

<style scoped>
.u-tv { width: 100%; }
.u-s-sm { --tv-h: var(--control-sm); --tv-fs: var(--fs-caption); }
.u-s-md { --tv-h: var(--control-md); --tv-fs: var(--fs-small); }

.u-tv-row {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  height: var(--tv-h);
  /* The level is the indent, and it comes from the data rather than from
     nested boxes — one flat list is what lets the arrows walk it. */
  padding-inline: calc(var(--s-3) + (var(--lvl) - 1) * var(--s-7)) var(--s-4);
  border-radius: var(--r-sm);
  color: var(--fg-muted);
  cursor: pointer;
  user-select: none;
  font: var(--w-regular) var(--tv-fs)/1 var(--font-sans);
}
.u-tv-row:hover { background: var(--fill-quiet); color: var(--fg); }
.u-tv-row:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: -2px;
}
/* The same "here" as every other one in the system: a neutral ground and
   heavier text, never a colour. */
.u-tv-on { background: var(--fill); color: var(--fg); font-weight: var(--w-semibold); }
.u-tv-off { opacity: .45; cursor: not-allowed; }
.u-tv-off:hover { background: transparent; }

.u-tv-twist {
  flex: none;
  display: grid;
  place-items: center;
  color: var(--fg-subtle);
  transition: rotate var(--dur-fast) var(--ease-out);
}
.u-tv-row[aria-expanded="true"] .u-tv-twist { rotate: 90deg; }
/* Kept in the layout: a leaf without one would sit a chevron's width to
   the left of its own siblings. */
.u-tv-leaf { visibility: hidden; }

.u-tv-ico { flex: none; }
.u-tv-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.u-tv-note { flex: none; color: var(--fg-subtle); font-size: var(--fs-caption); }

.u-tv-empty {
  margin: 0;
  padding: var(--s-6) var(--s-4);
  color: var(--fg-muted);
  font: var(--w-regular) var(--fs-small)/1.4 var(--font-sans);
}
</style>
