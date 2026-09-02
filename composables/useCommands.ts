import type { Component, MaybeRefOrGetter } from 'vue'

/**
 * The registry behind CommandPalette.
 *
 * The palette is the easy half. SearchField already has the combobox
 * model, the shortcut and the suggestion list; a `<dialog>` already has
 * the top layer and the focus trap. What was missing is the answer to
 * three questions, and they are all about the commands rather than the
 * box they appear in.
 *
 * WHAT A COMMAND IS: a label, a way to find it, and a function. Not a
 * route, not a component, not a nested menu — see the refusal below.
 *
 * WHERE IT COMES FROM: whatever part of the app owns it. A module-level
 * store rather than provide/inject, for the reason Toaster's queue is
 * one — a route guard or a plugin has commands to contribute and is not
 * inside a component. The cost is a store shared between requests on a
 * server, which is why registering does nothing when there is no window.
 * A command is a thing a person invokes; there is no person during SSR.
 *
 * AND HOW IT DISAPPEARS WHEN ITS PAGE DOES, which is the part that goes
 * wrong. Registration is bound to the calling effect scope, so a page
 * that registers "Close this issue" takes it away by being unmounted,
 * with nothing to remember. Called outside a scope — a plugin, an app
 * that wants commands present always — there is nothing to dispose, so
 * it returns its own `off()` and says so rather than warning.
 *
 * The source is a getter or a ref rather than a plain array, so the set
 * can depend on state: a command that only exists while something is
 * selected is a filter inside the getter, not a register and unregister
 * on every change.
 *
 * ONE PALETTE, and `open` lives here rather than as a prop, because two
 * of them would fight over the same keystroke and there is never a
 * second one. Anything can open it; only the mounted component draws it.
 *
 * NOT BUILDING: commands that open a sub-list of more commands. That is
 * the feature that turns a palette into an application — it needs a
 * stack, a back gesture, a breadcrumb inside the box and a story about
 * what Escape means at each level. A command runs; if what it runs is a
 * chooser, the app already knows how to show one.
 */
export interface Command {
  id: string
  label: string
  icon?: Component
  /** Groups the palette shows a header for. Ungrouped comes first. */
  group?: string
  /** What someone would type to find this that the label does not say. */
  keywords?: string[]
  /** Shown beside the label. DISPLAY ONLY — binding it is the app's. */
  shortcut?: string
  /** Listed, findable, and refused. Same argument as a disabled tab. */
  disabled?: boolean
  run: () => unknown
}

type Source = () => Command[]

/* Shallow: the array is replaced rather than mutated, and the getters
   inside it are called from a computed, so each one's own reactive reads
   are what actually drive the list. */
const sources = shallowRef<Source[]>([])

const open = ref(false)

/** Ids, most recent first. In memory on purpose — a component that wrote
 *  to localStorage on its own would be a surprise, and this is the same
 *  argument SearchField makes about its recents being a prop. */
const recent = ref<string[]>([])
const RECENT_MAX = 5

/**
 * Contribute commands for as long as the caller lives.
 *
 * Returns `off()` for callers with no effect scope to hang on — a
 * plugin, or anything that means "always".
 */
export function useCommands(source: MaybeRefOrGetter<Command[]>) {
  const read: Source = () => toValue(source)
  const off = () => { sources.value = sources.value.filter(s => s !== read) }
  /* Nothing registers on the server, so nothing has to be taken away. */
  if (typeof window === 'undefined') return () => {}

  sources.value = [...sources.value, read]
  if (getCurrentScope()) onScopeDispose(off)
  return off
}

/* ---------- finding ---------- */

/** A word start, which is where an abbreviation's letters actually are. */
const EDGE = /[\s\-_/.:]/

/**
 * Subsequence match, scored. Returns -1 for no match.
 *
 * The three rules, in the order they matter:
 *
 *   1. Every character of the query appears, in order. "nis" finds
 *      "New Issue"; "sni" does not, and should not.
 *   2. A hit at the start of a word counts for more than one inside a
 *      word, because an abbreviation is made of word starts.
 *   3. Consecutive hits count for more than scattered ones, so "iss"
 *      prefers "Issues" over "Invite Someone Somewhere".
 *
 * A distance penalty breaks the remaining ties towards the earlier
 * match. It is capped, so a long label is not punished twice for the
 * same gap.
 */
export function score(query: string, text: string): number {
  const q = query.toLowerCase().trim()
  if (!q) return 0
  const t = text.toLowerCase()

  let from = 0
  let total = 0
  let run = 0

  for (const ch of q) {
    const i = t.indexOf(ch, from)
    if (i < 0) return -1
    const edge = i === 0 || EDGE.test(t[i - 1]!)
    run = i === from && from > 0 ? run + 1 : 0
    total += (edge ? 8 : 1) + run * 3 - Math.min(i - from, 6) * 0.5
    from = i + 1
  }
  return total
}

/**
 * A LABEL MATCH ALWAYS BEATS A KEYWORD MATCH, and it is two tiers rather
 * than a penalty because no single number is safely bigger than every
 * score a long keyword string can produce. Keywords are there to make
 * something findable, not to drag it past the thing that is actually
 * called that.
 */
export interface Hit { cmd: Command; tier: 0 | 1; score: number }

export function match(query: string, cmd: Command): Hit | undefined {
  const own = score(query, cmd.label)
  if (own >= 0) return { cmd, tier: 0, score: own }
  if (!cmd.keywords?.length) return undefined
  /* EACH KEYWORD ON ITS OWN, never joined. Joining them into one string
     lets a match run across two unrelated words: with "theme dark light
     appearance", the query "kan" found the k of dark, the a of
     appearance and the n of appearance, and a theme switch turned up
     under a search for Kanban. A keyword is a whole alternative name,
     and matching half of one against half of the next is not a match. */
  const alias = Math.max(...cmd.keywords.map(k => score(query, k)))
  return alias >= 0 ? { cmd, tier: 1, score: alias } : undefined
}

/* ---------- the palette's side ---------- */

export interface CommandSection {
  label?: string
  items: Command[]
}

export function useCommandPalette() {
  const all = computed(() => {
    /* Last registration wins on a duplicate id: a page overriding a
       global "Save" means the page's, and two identical rows in the
       list would be worse than either. */
    const byId = new Map<string, Command>()
    for (const read of sources.value) for (const c of read()) byId.set(c.id, c)
    return [...byId.values()]
  })

  /**
   * With a query, ranked. Without one, grouped as registered, with what
   * you last ran on top.
   *
   * The groups SURVIVE the query rather than collapsing into one flat
   * list, and they are ordered by their best member — so the top result
   * is still first, and the headers still say what kind of thing each
   * row is. Flattening loses that for no gain; ordering groups by
   * anything else buries the best match under a header.
   */
  function sections(query: string): CommandSection[] {
    const q = query.trim()

    if (!q) {
      const out: CommandSection[] = []
      const used = new Set<string>()
      const seen = recent.value
        .map(id => all.value.find(c => c.id === id))
        .filter((c): c is Command => !!c)
      if (seen.length) {
        out.push({ label: 'Recent', items: seen })
        for (const c of seen) used.add(c.id)
      }
      const groups = new Map<string, Command[]>()
      for (const c of all.value) {
        if (used.has(c.id)) continue
        const key = c.group ?? ''
        const list = groups.get(key)
        if (list) list.push(c)
        else groups.set(key, [c])
      }
      for (const [label, items] of groups) out.push({ label: label || undefined, items })
      return out
    }

    const hits = all.value
      .map(c => match(q, c))
      .filter((h): h is Hit => !!h)
      .sort((a, b) => a.tier - b.tier || b.score - a.score)

    const groups = new Map<string, Command[]>()
    for (const h of hits) {
      const key = h.cmd.group ?? ''
      const list = groups.get(key)
      if (list) list.push(h.cmd)
      else groups.set(key, [h.cmd])
    }
    /* Insertion order already IS best-member order: the hits are sorted,
       so a group appears the moment its best member does. */
    return [...groups].map(([label, items]) => ({ label: label || undefined, items }))
  }

  function ran(id: string) {
    recent.value = [id, ...recent.value.filter(x => x !== id)].slice(0, RECENT_MAX)
  }

  return {
    all,
    open,
    show: () => { open.value = true },
    hide: () => { open.value = false },
    sections,
    ran,
    recent
  }
}

/** For tests, and for anything that tears its own app down. */
export function _resetCommands() {
  sources.value = []
  recent.value = []
  open.value = false
}
