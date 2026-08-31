<script setup lang="ts">
import { ChevronUp, ChevronDown } from 'lucide-vue-next'

/**
 * Table — a real <table>, driven by column definitions.
 *
 * Semantic markup, not a grid of divs: row and column relationships,
 * header association and "row 4 of 60" announcements come from the
 * element. A div grid has to rebuild all of it with ARIA and usually
 * rebuilds it wrong.
 *
 * Numeric columns get tabular figures automatically. Proportional digits
 * shift width per glyph, so a column of them will not line up and a
 * changing value jitters — which is exactly what .nums-tabular exists to
 * prevent.
 *
 * Two variants, and the choice is about what the reader is doing:
 *
 *   rows — horizontal rules only, roomy. For reading DOWN one column:
 *          a status list, a few records, anything scanned vertically.
 *   grid — cell borders both ways, dense. For reading ACROSS a row and
 *          comparing many columns, spreadsheet-style. The vertical rules
 *          are what let the eye track sideways without losing the line.
 *
 * Grid keeps its rules far fainter than the row variant's. At that
 * density a border every few pixels at normal strength turns the table
 * into a cage; the lines only need to be enough to follow, not to see.
 */
export interface Column<Row = any> {
  key: string
  label: string
  /** Right-aligned and set in tabular figures. */
  numeric?: boolean
  align?: 'start' | 'center' | 'end'
  width?: string
  sortable?: boolean
}

const props = withDefaults(defineProps<{
  columns: Column[]
  rows: Record<string, any>[]
  /** Property to key rows by. Index is a last resort — it breaks
   *  selection as soon as the data is sorted or filtered. */
  rowKey?: string
  variant?: 'rows' | 'grid'
  selectable?: boolean
  stickyHeader?: boolean
  loading?: boolean
  emptyText?: string
}>(), { rowKey: 'id', emptyText: 'No rows.', variant: 'rows' })

const selected = defineModel<(string | number)[]>('selected', { default: () => [] })

const sortKey = ref<string | null>(null)
const sortDir = ref<'asc' | 'desc'>('asc')

const sorted = computed(() => {
  if (!sortKey.value) return props.rows
  const k = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  // Copy first: sorting props.rows in place would mutate the caller's array.
  return [...props.rows].sort((a, b) => {
    const x = a[k], y = b[k]
    if (x == null) return 1
    if (y == null) return -1
    return (typeof x === 'number' && typeof y === 'number'
      ? x - y
      : String(x).localeCompare(String(y))) * dir
  })
})

function sortBy(col: Column) {
  if (!col.sortable) return
  if (sortKey.value === col.key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = col.key; sortDir.value = 'asc' }
}

const keyOf = (row: Record<string, any>, i: number) => row[props.rowKey] ?? i
const allOn = computed(() =>
  sorted.value.length > 0 && sorted.value.every((r, i) => selected.value.includes(keyOf(r, i))))
const someOn = computed(() => selected.value.length > 0 && !allOn.value)

function toggleAll() {
  selected.value = allOn.value ? [] : sorted.value.map(keyOf)
}
function toggleRow(k: string | number) {
  selected.value = selected.value.includes(k)
    ? selected.value.filter(x => x !== k)
    : [...selected.value, k]
}

function alignOf(col: Column) {
  return col.align ?? (col.numeric ? 'end' : 'start')
}
</script>

<template>
  <div class="u-tbl-scroll">
    <table class="u-tbl" :class="`u-tbl-${variant}`">
      <thead :class="{ 'u-tbl-sticky': stickyHeader }">
        <tr>
          <th v-if="selectable" class="u-tbl-pick" scope="col">
            <UiCheckbox
              :model-value="allOn"
              :indeterminate="someOn"
              @update:model-value="toggleAll"
            />
            <span class="u-tbl-sr">Select all rows</span>
          </th>
          <th
            v-for="col in columns"
            :key="col.key"
            scope="col"
            :style="{ width: col.width, textAlign: alignOf(col) }"
            :aria-sort="sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined"
          >
            <button v-if="col.sortable" class="u-tbl-sort" @click="sortBy(col)">
              {{ col.label }}
              <UiIcon
                v-if="sortKey === col.key"
                :is="sortDir === 'asc' ? ChevronUp : ChevronDown"
                size="sm"
              />
            </button>
            <template v-else>{{ col.label }}</template>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length + (selectable ? 1 : 0)" class="u-tbl-state">Loading…</td>
        </tr>
        <tr v-else-if="!sorted.length">
          <td :colspan="columns.length + (selectable ? 1 : 0)" class="u-tbl-state">{{ emptyText }}</td>
        </tr>
        <tr
          v-for="(row, i) in sorted"
          v-else
          :key="keyOf(row, i)"
          :class="{ 'u-tbl-on': selected.includes(keyOf(row, i)) }"
        >
          <td v-if="selectable" class="u-tbl-pick">
            <UiCheckbox
              :model-value="selected.includes(keyOf(row, i))"
              @update:model-value="toggleRow(keyOf(row, i))"
            />
          </td>
          <td
            v-for="col in columns"
            :key="col.key"
            :class="{ 'nums-tabular': col.numeric }"
            :style="{ textAlign: alignOf(col) }"
          >
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* The scroller lives outside the table so a wide table scrolls sideways
   without the page doing so. */
.u-tbl-scroll { width: 100%; overflow-x: auto; }

.u-tbl {
  width: 100%;
  border-collapse: collapse;
  font: var(--w-regular) var(--fs-body)/1.4 var(--font-sans);
  letter-spacing: var(--tr-body);
}

th, td {
  padding: var(--s-4) var(--s-6);
  border-bottom: var(--border-width) solid var(--border);
  vertical-align: middle;
}
th {
  font-weight: var(--w-medium);
  font-size: var(--fs-small);
  color: var(--fg-muted);
  white-space: nowrap;
}
tbody tr:last-child td { border-bottom: 0; }

/* ---- grid: dense, ruled both ways ---- */
.u-tbl-grid { font-size: var(--fs-small); }
.u-tbl-grid th,
.u-tbl-grid td {
  padding: 0 var(--s-5);
  height: 36px;
  border-bottom-color: var(--rule-faint);
  /* The vertical rules are the point of this variant — they are what let
     the eye track sideways across many columns. */
  border-inline-end: var(--border-width) solid var(--rule-faint);
}
.u-tbl-grid th:last-child,
.u-tbl-grid td:last-child { border-inline-end: 0; }
.u-tbl-grid th { height: 40px; }

/* Truncate rather than wrap: a dense grid loses its rhythm the moment one
   row is two lines tall. Text columns share the leftover width and clip;
   numeric ones never do — a truncated number is not a shorter number,
   it is a wrong one. */
.u-tbl-grid td {
  white-space: nowrap;
}
.u-tbl-grid td:not(.nums-tabular) {
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.u-tbl-grid td.nums-tabular,
.u-tbl-grid th:has(+ td) { width: 1%; }
.u-tbl-grid tbody tr:hover { background: var(--fill-quiet); }
.u-tbl-grid tbody tr:last-child td { border-bottom: 0; }

.u-tbl-sticky th {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  /* Opaque, or rows scroll through the header. */
  background: var(--bg);
}

.u-tbl-on { background: var(--accent-subtle); }
/* Selection has to stay readable over the hover tint. */
.u-tbl-grid tbody tr.u-tbl-on:hover { background: var(--accent-subtle); }

.u-tbl-sort {
  display: inline-flex; align-items: center; gap: var(--s-2);
  border: 0; background: transparent; padding: 0; margin: 0;
  font: inherit; color: inherit; cursor: pointer;
}
.u-tbl-sort:hover { color: var(--fg); }
.u-tbl-sort:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 2px; border-radius: var(--r-xs);
}

.u-tbl-pick { width: 1%; white-space: nowrap; }
.u-tbl-state { padding: var(--s-10) var(--s-6); text-align: center; color: var(--fg-muted); }

/* Visually hidden but still announced. */
.u-tbl-sr {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip-path: inset(50%); white-space: nowrap;
}
</style>
