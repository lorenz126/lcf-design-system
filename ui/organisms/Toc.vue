<script setup lang="ts">
/**
 * Toc — table of contents built from the headings already on the page.
 *
 * An organism: it owns a data shape (the heading tree) and a scroll-spy
 * interaction model. It reads the DOM rather than taking a list, because
 * the headings come from rendered prose — asking the caller to declare
 * them again guarantees the two drift apart.
 *
 * Ids are generated for headings that lack one, so a plain markdown
 * render needs no preparation to become linkable.
 */
const props = withDefaults(defineProps<{
  /** The element to read headings from. */
  target: HTMLElement | null | undefined
  levels?: number[]
  title?: string
}>(), { levels: () => [2, 3], title: 'On this page' })

interface Entry { id: string; text: string; level: number }

const entries = ref<Entry[]>([])
const active = ref<string | null>(null)
let headings: HTMLElement[] = []

/** Where a heading counts as "current" — a little below the top edge, so
 *  it becomes active as it reaches reading position. */
const LINE = 96

/* A click is an explicit statement of where the reader wants to be, so it
   wins over whatever the geometry would say — near the end of a document
   the travelling line below would otherwise hand the highlight straight
   to the last section. Released on the next genuine scroll INTENT rather
   than the next scroll event, since the click's own smooth scroll fires
   plenty of those. */
let pinned: string | null = null
const INTENT = ['wheel', 'touchmove', 'keydown'] as const

function unpin() { pinned = null; onScroll() }

function onPick(id: string) {
  pinned = id
  active.value = id
}

function onScroll() {
  if (!headings.length || pinned) return

  // The last viewport-height of a document can never scroll past a fixed
  // reading line, so any section starting in it would be permanently
  // unreachable. Rather than snapping to the last entry at the very
  // bottom — which skips whatever sits between — the line itself travels
  // down as the end approaches, until at the bottom it is the full
  // viewport and simply the last visible heading wins.
  const doc = document.documentElement
  const remaining = doc.scrollHeight - (window.scrollY + window.innerHeight)
  const tail = Math.min(1, Math.max(0, 1 - remaining / window.innerHeight))
  const line = LINE + tail * (window.innerHeight - LINE)

  let current = headings[0]!.id
  for (const h of headings) {
    if (h.getBoundingClientRect().top <= line) current = h.id
    else break
  }
  active.value = current
}

const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 60)

/* Guarded: build() runs during setup via the immediate watch, which
   happens on the server too, and addEventListener does not exist there. */
function listen(on: boolean) {
  if (!import.meta.client) return
  removeEventListener('scroll', onScroll)
  for (const e of INTENT) removeEventListener(e, unpin)
  if (!on) return
  addEventListener('scroll', onScroll, { passive: true })
  for (const e of INTENT) addEventListener(e, unpin, { passive: true })
}

function build() {
  listen(false)
  const root = props.target
  if (!root) { entries.value = []; headings = []; return }

  const sel = props.levels.map(l => `h${l}`).join(',')
  const found = [...root.querySelectorAll<HTMLElement>(sel)]

  const seen = new Map<string, number>()
  entries.value = found.map(el => {
    if (!el.id) {
      let base = slug(el.textContent ?? '')
      // Two sections called "Overview" would otherwise share an id and
      // every link would land on the first one.
      const n = (seen.get(base) ?? 0) + 1
      seen.set(base, n)
      el.id = n > 1 ? `${base}-${n}` : base
    }
    return { id: el.id, text: el.textContent?.trim() ?? '', level: Number(el.tagName[1]) }
  })

  // Scroll position, not IntersectionObserver. "Which heading am I under"
  // is the LAST one scrolled past, and an observer answers a different
  // question — which ones are currently visible. Deriving one from the
  // other needs stale-state bookkeeping that gets it wrong the moment two
  // headings share the viewport.
  headings = found
  if (import.meta.client) {
    onScroll()
    listen(true)
  }
}

watch(() => props.target, build, { immediate: true })
onMounted(() => nextTick(build))
onBeforeUnmount(() => listen(false))

const minLevel = computed(() => Math.min(...props.levels))
</script>

<template>
  <nav v-if="entries.length" class="u-toc" :aria-label="title">
    <p class="u-toc-title">{{ title }}</p>
    <ul class="u-toc-list">
      <li v-for="e in entries" :key="e.id" :style="{ '--depth': e.level - minLevel }">
        <a
          :href="`#${e.id}`"
          class="u-toc-link"
          :class="{ 'u-toc-on': active === e.id }"
          :aria-current="active === e.id ? 'location' : undefined"
          @click="onPick(e.id)"
        >{{ e.text }}</a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.u-toc { position: sticky; top: var(--s-8); align-self: start; }
.u-toc-title {
  margin: 0 0 var(--s-4);
  font: var(--w-semibold) var(--fs-caption)/1.4 var(--font-sans);
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--fg-subtle);
}
.u-toc-list { list-style: none; margin: 0; padding: 0; }

.u-toc-link {
  display: block;
  padding: var(--s-2) 0 var(--s-2) calc(var(--s-5) + var(--depth) * var(--s-5));
  border-inline-start: 2px solid var(--border);
  margin-inline-start: -2px;
  color: var(--fg-muted);
  text-decoration: none;
  font: var(--w-regular) var(--fs-small)/1.4 var(--font-sans);
  transition: color var(--dur-fast) var(--ease-out),
              border-color var(--dur-fast) var(--ease-out);
}
.u-toc-link:hover { color: var(--fg); }
.u-toc-on { color: var(--accent-text); border-inline-start-color: var(--accent); }
.u-toc-link:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 2px;
  border-radius: var(--r-xs);
}
</style>
