<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronRight, ExternalLink } from 'lucide-vue-next'

/**
 * Sidebar — application navigation.
 *
 * AN ORGANISM, because it owns a data shape and an interaction model:
 * a tree of items, which of them is current, and which groups are open.
 * TopBar next door is a molecule for exactly the opposite reason — it
 * arranges slots and knows nothing. AppShell is the template that holds
 * them both and contains no data at all.
 *
 * ONE LEVEL OF CHILDREN, on purpose. Anything deeper is a tree view, and
 * a tree view is a different component: it needs roving tabindex, arrow
 * keys that expand and collapse, and level announcements. Rows here are
 * ordinary links and buttons in the ordinary tab order, which is right
 * for a dozen destinations and wrong for a hundred nested ones.
 *
 * The group holding the current page opens itself. A navigation that
 * hides where you are is worse than one that shows too much.
 *
 * COLLAPSED IS A RAIL, NOT A DISAPPEARANCE. The icons stay, and every
 * one of them gets a tooltip — an icon on its own is a guess, and a rail
 * whose rows cannot be identified saves space by making the navigation
 * useless. A group has nowhere to put its children in a strip that
 * narrow, so its row asks for the width back instead of opening
 * something nobody can see: one interaction model, rather than a second
 * one that exists only while the sidebar is small.
 *
 * Headings and rules are PROPERTIES OF A ROW rather than entries in the
 * list, the same as in Menu: a consumer should never have to filter
 * separators out of their own data.
 */
type Tone = 'neutral' | 'yellow' | 'green' | 'blue' | 'purple' | 'red' | 'orange'

export interface SidebarItem {
  /** Falls back to the label and `to` together. */
  id?: string | number
  label: string
  /** Makes the row a link. Without it the row is a button that emits. */
  to?: string
  icon?: Component
  /** A coloured mark instead of a glyph — a workspace, a project. An
   *  empty object takes its letters and its hue from the label. */
  avatar?: { text?: string; src?: string; tone?: Tone }
  badge?: string
  badgeTone?: Tone
  /** Leaves the app: plain anchor, new tab, and it says so with a glyph. */
  external?: boolean
  disabled?: boolean
  /** Makes the row expandable. One level only — see above. */
  children?: SidebarItem[]
  /** Small heading rendered above this row, starting a block. */
  heading?: string
  /** Rule above this row. */
  divider?: boolean
}

const props = withDefaults(defineProps<{
  items: SidebarItem[]
  /** What is open. Matched against a row's `to`, and against its `id` —
   *  so a shell with no router can drive the highlight from `select`. */
  current?: string | number
  /**
   * What internal links render as. A plain <a> reloads the document,
   * which throws away the application it is navigating, so pass NuxtLink
   * or RouterLink to keep it client-side — the component stays framework
   * agnostic and the app says which router it has.
   *
   * THE COMPONENT, NOT ITS NAME. A string is only resolved against the
   * runtime component registry, and Nuxt's auto-import is a build-time
   * transform: `link="NuxtLink"` renders a literal <nuxtlink> element
   * with a `to` attribute, which looks right, highlights right, and
   * cannot be clicked. There is no runtime warning for it either, so the
   * type is what has to catch it. Import from `#components`.
   */
  link?: Component | 'a'
  /** Accessible name, for when a page has more than one nav landmark. */
  label?: string
  /** Icons only. AppShell hands this to the sidebar slot. */
  collapsed?: boolean
  /**
   * Opens every group regardless of what is current. For a filtered
   * list: a search result buried in a shut group has not been found.
   */
  expandAll?: boolean
  /** Shown when `items` is empty — which a filtered nav can be. */
  emptyText?: string
}>(), { link: 'a', label: 'Main', emptyText: 'No match.' })

const emit = defineEmits<{
  select: [SidebarItem]
  /** A collapsed group was opened and needs the sidebar's width back. */
  expand: []
}>()

/* Not `to` alone: several rows can point at the same page — this
   workshop has two atoms documented on one — and a v-for key has to stay
   unique when they do. */
const key = (i: SidebarItem) => i.id ?? `${i.label}|${i.to ?? ''}`
const isCurrent = (i: SidebarItem) =>
  props.current !== undefined && (i.to === props.current || i.id === props.current)

/* ---------- one row, three shapes ---------- */

/** A group, and a row with no destination, are buttons; the rest links. */
const rowTag = (i: SidebarItem) =>
  i.children || !i.to ? 'button' : i.external ? 'a' : props.link

function rowAttrs(i: SidebarItem) {
  if (i.children || !i.to) {
    return { type: 'button' as const, disabled: i.disabled || undefined }
  }
  return {
    // `to` or `href`, depending on what the link component wants.
    ...(props.link === 'a' || i.external ? { href: i.to } : { to: i.to }),
    target: i.external ? '_blank' : undefined,
    rel: i.external ? 'noreferrer noopener' : undefined,
    'aria-disabled': i.disabled || undefined
  }
}

/**
 * In a rail a group stands in for its children, so it inherits their
 * state: on a page documented under Atoms, the Atoms icon is where you
 * are. Without this the rail highlights nothing at all on most pages,
 * since the row that matches is one the rail does not render.
 */
const railCurrent = (i: SidebarItem) =>
  isCurrent(i) || !!i.children?.some(c => isCurrent(c))

/** "page" belongs to a link. A button that is merely current says so. */
const currentAttr = (i: SidebarItem) =>
  isCurrent(i) ? (i.to && !i.children ? 'page' : true) : undefined

/* ---------- open groups ---------- */

const opened = ref(new Set<string | number>())

function toggle(i: SidebarItem) {
  const k = key(i)
  const next = new Set(opened.value)
  next.has(k) ? next.delete(k) : next.add(k)
  opened.value = next
}
const isOpen = (i: SidebarItem) => props.expandAll || opened.value.has(key(i))

/** Reveal the current page wherever it is. Immediate, so a group is
 *  never briefly shut on the row you are standing on. */
watch(
  () => [props.current, props.items] as const,
  () => {
    const next = new Set(opened.value)
    for (const i of props.items ?? []) {
      if (i.children?.some(c => isCurrent(c))) next.add(key(i))
    }
    opened.value = next
  },
  { immediate: true, deep: true }
)

function activate(i: SidebarItem) {
  if (i.disabled) return
  if (i.children) {
    if (props.collapsed) {
      // Open it and ask for room, rather than opening something that has
      // nowhere to appear.
      opened.value = new Set(opened.value).add(key(i))
      emit('expand')
      return
    }
    return toggle(i)
  }
  if (!i.to) emit('select', i)
}
</script>

<template>
  <nav class="u-sb" :class="{ 'u-sb-rail': collapsed }" :aria-label="label">
    <div v-if="$slots.header && !collapsed" class="u-sb-head"><slot name="header" /></div>

    <div class="u-sb-scroll">
      <p v-if="!items.length && !collapsed" class="u-sb-empty">{{ emptyText }}</p>

      <!-- A rail: icons, rules, and a tooltip on every row. Nothing else
           fits, and nothing else would be legible if it did. -->
      <template v-if="collapsed">
        <template v-for="item in items" :key="key(item)">
          <UiDivider v-if="item.divider" class="u-sb-rule" inset />
          <UiTooltip :text="item.label" placement="right">
            <component
              :is="rowTag(item)"
              class="u-sb-row"
              :class="{ 'u-sb-on': railCurrent(item), 'u-sb-off': item.disabled }"
              v-bind="rowAttrs(item)"
              :aria-current="railCurrent(item) ? (item.to && !item.children ? 'page' : true) : undefined"
              @click="activate(item)"
            >
              <span class="u-sb-lead">
                <UiAvatar
                  v-if="item.avatar"
                  shape="square"
                  size="sm"
                  :name="item.label"
                  v-bind="item.avatar"
                />
                <UiIcon v-else-if="item.icon" :is="item.icon" size="md" />
              </span>
            </component>
          </UiTooltip>
        </template>
      </template>

      <template v-else>
        <template v-for="item in items" :key="key(item)">
          <UiDivider v-if="item.divider" class="u-sb-rule" inset />
          <p v-if="item.heading" class="u-sb-heading">{{ item.heading }}</p>

          <component
            :is="rowTag(item)"
            class="u-sb-row"
            :class="{ 'u-sb-on': isCurrent(item), 'u-sb-off': item.disabled }"
            v-bind="rowAttrs(item)"
            :aria-current="currentAttr(item)"
            :aria-expanded="item.children ? isOpen(item) : undefined"
            @click="activate(item)"
          >
            <span class="u-sb-lead">
              <UiAvatar
                v-if="item.avatar"
                shape="square"
                size="sm"
                :name="item.label"
                v-bind="item.avatar"
              />
              <UiIcon v-else-if="item.icon" :is="item.icon" size="md" />
            </span>
            <span class="u-sb-label">{{ item.label }}</span>

            <span v-if="item.children && item.badge" class="u-sb-note">{{ item.badge }}</span>
            <UiBadge v-else-if="item.badge" :tone="item.badgeTone ?? 'purple'" size="sm">
              {{ item.badge }}
            </UiBadge>

            <UiIcon v-if="item.external" :is="ExternalLink" size="sm" class="u-sb-ext" />
            <UiIcon
              v-if="item.children"
              :is="ChevronRight"
              size="sm"
              class="u-sb-chev"
              :class="{ 'u-sb-chev-on': isOpen(item) }"
            />
            <slot v-if="!item.children" name="trailing" :item="item" />
          </component>

          <div v-if="item.children && isOpen(item)" class="u-sb-kids">
            <component
              :is="rowTag(kid)"
              v-for="kid in item.children"
              :key="key(kid)"
              class="u-sb-row u-sb-kid"
              :class="{ 'u-sb-on': isCurrent(kid), 'u-sb-off': kid.disabled }"
              v-bind="rowAttrs(kid)"
              :aria-current="currentAttr(kid)"
              @click="activate(kid)"
            >
              <span class="u-sb-lead">
                <UiAvatar
                  v-if="kid.avatar"
                  shape="square"
                  size="sm"
                  :name="kid.label"
                  v-bind="kid.avatar"
                />
                <UiIcon v-else-if="kid.icon" :is="kid.icon" size="sm" />
              </span>
              <span class="u-sb-label">{{ kid.label }}</span>
              <span v-if="kid.badge" class="u-sb-note">{{ kid.badge }}</span>
            </component>
          </div>
        </template>
      </template>
    </div>

    <div v-if="$slots.footer && !collapsed" class="u-sb-foot"><slot name="footer" /></div>
  </nav>
</template>

<style scoped>
.u-sb {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: var(--s-4) var(--s-4) 0;
  gap: var(--s-3);
}
.u-sb-head { padding: var(--s-2) var(--s-3) var(--s-3); }
/* The list scrolls; the header and footer do not. A promo pinned to the
   bottom that scrolls away is not pinned to anything. */
.u-sb-scroll { flex: 1; min-height: 0; overflow-y: auto; }
.u-sb-foot { flex: none; padding: var(--s-4) 0; }

.u-sb-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--s-4);
  width: 100%;
  padding: var(--s-3) var(--s-4);
  margin-block-end: 1px;
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--fg-muted);
  text-align: start;
  text-decoration: none;
  cursor: pointer;
  font: var(--w-medium) var(--fs-small)/1.3 var(--font-sans);
  letter-spacing: var(--tr-small);
}
.u-sb-row:hover:not(.u-sb-off) { background: var(--fill-quiet); color: var(--fg); }
.u-sb-row:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: -2px;
}
.u-sb-off { color: var(--fg-subtle); cursor: not-allowed; }

/* Current: a soft neutral ground and heavier text. Nothing coloured.
   An accent tint with an edge bar was tried and it shouts — a page that
   documents four components lights four rows, and four blue slabs in a
   column read as an error rather than as an answer. Weight carries it
   instead: the same shape as every other row, filled a step further and
   set a step heavier, which stays legible when several rows match at
   once. Accent-on-accent-tint also measured 4.04:1 in dark mode on a
   raised panel, under AA — the tint recipe is calibrated against the
   page, and a sidebar is not the page.
   Two classes, not one: .u-sb-kid sets a lighter weight further down the
   file, and at equal specificity the later rule wins. */
.u-sb-row.u-sb-on {
  background: var(--fill);
  color: var(--fg);
  font-weight: var(--w-semibold);
}

/* Wide enough for the LARGEST thing that can sit in it, which is an
   avatar rather than a glyph. At --icon-md a 22px avatar overflowed its
   own slot by 6px and ate the gap to the label down to 2 — and because
   the slot is a fixed width, rows with a glyph and rows with an avatar
   still line their labels up. */
.u-sb-lead {
  flex: none;
  display: grid;
  place-items: center;
  width: var(--control-sm);
  color: var(--fg-subtle);
}
.u-sb-row.u-sb-on .u-sb-lead { color: var(--fg); }
.u-sb-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.u-sb-ext { flex: none; color: var(--fg-subtle); }

.u-sb-chev {
  flex: none;
  color: var(--fg-subtle);
  transition: rotate var(--dur-fast) var(--ease-out);
}
.u-sb-chev-on { rotate: 90deg; }

/* Children line up under the parent's LABEL, not its icon — the indent
   has to read as "belongs to that", and matching the icon column makes
   it read as another icon instead. Which is why it is the lead slot plus
   the gap, not a number: change either and the alignment follows. */
.u-sb-kids { margin-inline-start: calc(var(--control-sm) + var(--s-4)); }
.u-sb-kid { font-weight: var(--w-regular); }

/* Sentence case. Uppercasing a heading is a typographic shout that
   costs the word shapes readers navigate by, and small caps at 11px are
   the worst of both. Size and colour separate a heading from a row
   perfectly well. */
.u-sb-heading {
  /* Asymmetric on purpose: a heading belongs to the block below it, so
     the space above is larger than the space below. Below was 4px, which
     is less than the row's own padding — the heading was touching the
     first item it introduced. */
  margin: var(--s-7) 0 var(--s-4);
  padding-inline: var(--s-4);
  color: var(--fg-subtle);
  font: var(--w-semibold) var(--fs-caption)/1 var(--font-sans);
  letter-spacing: var(--tr-caption);
}

.u-sb-empty {
  margin: var(--s-6) 0;
  padding-inline: var(--s-4);
  color: var(--fg-subtle);
  font: var(--w-regular) var(--fs-caption)/1.4 var(--font-sans);
}
.u-sb-note {
  flex: none;
  color: var(--fg-subtle);
  font: var(--w-regular) var(--fs-micro)/1 var(--font-sans);
  font-variant-numeric: tabular-nums;
}

/* ---- the rail ---- */

/* Wide screens only. Below --bp-md AppShell has already swapped the
   column for a full-width overlay, and a rail there would be a 260px
   panel of centred icons. The number is written a third time because a
   custom property cannot appear in a media query: --bp-md records it,
   nothing can share it. */
@media (min-width: 861px) {
  .u-sb-rail { padding-inline: var(--s-3); }
  .u-sb-rail .u-sb-row {
    justify-content: center;
    padding: var(--s-4) 0;
    margin-block-end: var(--s-1);
  }
  .u-sb-rail .u-sb-rule { margin-inline: var(--s-2); }
  /* Tooltip wraps its trigger and its anchor is inline-flex, so without
     this the row shrinks to its icon and the hit area goes with it. */
  .u-sb-rail :deep(.u-tt-anchor) { display: flex; }
}
</style>
