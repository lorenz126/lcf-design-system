<script setup lang="ts">
import { CornerDownLeft, Search } from 'lucide-vue-next'
import type { Command } from '../../composables/useCommands'

/**
 * CommandPalette — everything the app can do, by name.
 *
 * Mounted ONCE, in the shell, like Toaster. It draws what
 * `useCommands()` has collected; see that file for what a command is,
 * where it comes from, how it goes away, and what this deliberately does
 * not grow into.
 *
 * IT RANKS, AND SEARCHFIELD REFUSES TO — which looks like an
 * inconsistency and is the opposite. SearchField renders what it is
 * given because the results are the application's: it cannot know
 * whether a hit on a title beats a hit on a body. This owns its
 * corpus. The commands were handed to it, they are all short labels of
 * the same kind, and there is nobody better placed to order them. A
 * component should rank exactly when it knows what it is ranking.
 *
 * ITS OWN <dialog> RATHER THAN Dialog. A palette's chrome is the part
 * that differs: no header, no footer, no padding around the body, and a
 * panel near the top of the viewport instead of centred — because it
 * grows downwards as you type and a centred one would walk up the screen
 * while you read it. Composing Dialog would mean overriding all of that,
 * which is a longer way to write the same twenty lines.
 *
 * FOCUS NEVER LEAVES THE INPUT. The arrows move `aria-activedescendant`,
 * not focus, for the reason SearchField gives at length: every keystroke
 * after a real focus move would go somewhere other than the box being
 * typed in.
 *
 * A COMMAND RUNS AFTER THE PALETTE HAS CLOSED, not before. Half of them
 * open something — a dialog, a drawer, a menu — and a `<dialog>` closing
 * restores focus to whatever had it before, which would take the focus
 * straight back out of whatever the command just opened. So: close, let
 * that settle, then run.
 *
 * A DISABLED COMMAND IS LISTED AND REFUSED, the same argument as a
 * disabled tab. Hiding it means someone searches for the thing they
 * cannot do and concludes it does not exist.
 *
 * NOTHING INSIDE IT IS RENDERED ON THE SERVER, and that follows from a
 * decision `useCommands` already made: registering does nothing when
 * there is no window, because a command is a thing a person invokes and
 * there is no person during SSR. So the registry is knowably empty
 * there, the server rendered "No matching commands." into a dialog
 * nobody could see, and the client replaced it with the list on its
 * first breath — a hydration mismatch on every page of every app that
 * mounted this.
 *
 * The dialog element itself still ships, so nothing about the document
 * moves; only its contents wait for a client. `ready` flips in
 * onMounted, which is after hydration, so the first client render agrees
 * with the server by rendering nothing too.
 */
const props = withDefaults(defineProps<{
  placeholder?: string
  emptyText?: string
  /** The key, with the platform's command modifier. Opt out with ''. */
  shortcut?: string
  label?: string
}>(), {
  placeholder: 'Type a command or search',
  emptyText: 'No matching commands.',
  shortcut: 'k',
  label: 'Command palette'
})

const { open, show, hide, sections, ran } = useCommandPalette()
const announce = useAnnounce()

/** False until there is a client — see above. */
const ready = ref(false)
onMounted(() => { ready.value = true })

const uid = useId()
const listId = `cp-${uid}`
const optId = (i: number) => `${listId}-o${i}`

const el = useTemplateRef<HTMLDialogElement>('el')
const field = useTemplateRef<HTMLInputElement>('field')
const list = useTemplateRef<HTMLElement>('list')

const query = ref('')
const active = ref(0)

const groups = computed(() => sections(query.value))
/** Display order, flattened — what the arrows walk. */
const flat = computed(() => groups.value.flatMap(g => g.items))
const indexOf = (c: Command) => flat.value.indexOf(c)

/* ---------- the shortcut ---------- */

/* Rendered as Ctrl until proven otherwise: deciding on the server means
   guessing, and guessing wrong is a hydration mismatch. */
const mac = ref(false)

/** Empty opts out — an app that binds its own key still gets the box. */
const key = computed(() => props.shortcut?.toLowerCase() || undefined)

function onWindowKey(e: KeyboardEvent) {
  if (!key.value) return
  if (!(mac.value ? e.metaKey : e.ctrlKey) || e.altKey || e.shiftKey) return
  if (e.key.toLowerCase() !== key.value) return
  // Firefox gives Ctrl K to its own search bar; an app that claims the
  // key has to take it.
  e.preventDefault()
  /* The same press both ways round. A shortcut that only opens leaves
     you reaching for a different key to undo what one key did. */
  if (open.value) hide()
  else show()
}

onMounted(() => {
  mac.value = /Mac|iP(hone|ad|od)/.test(navigator.platform || navigator.userAgent)
  addEventListener('keydown', onWindowKey)
})
onBeforeUnmount(() => removeEventListener('keydown', onWindowKey))

/* ---------- opening ---------- */

watch(open, v => {
  const d = el.value
  if (!d) return
  if (v && !d.open) {
    /* Cleared on the way IN, not on the way out: a palette that still
       held the last query would open showing one row, and clearing on
       close would flash the full list as it disappears. */
    query.value = ''
    active.value = 0
    d.showModal()
    nextTick(() => field.value?.focus())
  } else if (!v && d.open) {
    d.close()
  }
})

/** <dialog> closes itself on Escape and on the backdrop, so mirror it. */
function onClose() { open.value = false }
function onBackdrop(e: MouseEvent) { if (e.target === el.value) hide() }

/* ---------- moving and running ---------- */

function move(step: 1 | -1) {
  const n = flat.value.length
  if (!n) return
  active.value = (active.value + step + n) % n
  nextTick(() => {
    list.value
      ?.querySelector<HTMLElement>(`#${CSS.escape(optId(active.value))}`)
      ?.scrollIntoView({ block: 'nearest' })
  })
}

async function run(cmd: Command | undefined) {
  if (!cmd || cmd.disabled) return
  ran(cmd.id)
  hide()
  /* See above: closing restores focus, so anything the command opens has
     to be opened after that has happened. */
  await nextTick()
  cmd.run()
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    move(e.key === 'ArrowDown' ? 1 : -1)
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    run(flat.value[active.value])
  }
  /* Escape is the dialog's. Home and End belong to the caret — a list is
     not worth losing them in a field people type sentences into. */
}

/* A new query is a new list, and an index into the old one means
   nothing. */
watch(query, () => { active.value = 0 })

watch(flat, l => {
  if (!open.value) return
  announce(l.length === 1 ? '1 command' : `${l.length} commands`)
})
</script>

<template>
  <dialog
    ref="el"
    class="u-cp"
    :aria-label="label"
    @close="onClose"
    @click="onBackdrop"
  >
    <div v-if="ready" class="u-cp-panel">
      <div class="u-cp-head">
        <UiIcon :is="Search" size="sm" class="u-cp-glyph" />
        <input
          ref="field"
          v-model="query"
          type="text"
          class="u-cp-field"
          :placeholder="placeholder"
          autocomplete="off"
          spellcheck="false"
          role="combobox"
          aria-expanded="true"
          :aria-controls="listId"
          :aria-activedescendant="flat.length ? optId(active) : undefined"
          :aria-label="label"
          @keydown="onKey"
        >
      </div>

      <div v-if="flat.length" :id="listId" ref="list" class="u-cp-list" role="listbox" :aria-label="label">
        <div v-for="(g, gi) in groups" :key="g.label ?? `g${gi}`" role="group" :aria-label="g.label">
          <p v-if="g.label" class="u-cp-group" aria-hidden="true">{{ g.label }}</p>
          <button
            v-for="c in g.items"
            :key="c.id"
            type="button"
            class="u-cp-row"
            :class="{ 'u-cp-at': indexOf(c) === active, 'u-cp-off': c.disabled }"
            :id="optId(indexOf(c))"
            role="option"
            :aria-selected="indexOf(c) === active"
            :aria-disabled="c.disabled || undefined"
            tabindex="-1"
            @click="run(c)"
            @mousemove="active = indexOf(c)"
            @mousedown.prevent
          >
            <UiIcon v-if="c.icon" :is="c.icon" size="sm" class="u-cp-ico" />
            <span class="u-cp-label">{{ c.label }}</span>
            <kbd v-if="c.shortcut" class="u-cp-kbd">{{ c.shortcut }}</kbd>
          </button>
        </div>
      </div>

      <p v-else class="u-cp-empty">{{ emptyText }}</p>

      <div class="u-cp-foot" aria-hidden="true">
        <span class="u-cp-hint"><UiIcon :is="CornerDownLeft" size="sm" /> to run</span>
        <span class="u-cp-hint">↑↓ to move</span>
        <span class="u-cp-hint">esc to close</span>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.u-cp {
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  margin: 0;
  padding: var(--s-7);
  border: 0;
  background: transparent;
  /* Near the top, not centred: it grows downwards as you type, and a
     centred one would walk up the screen while you read it. */
  padding-block-start: 12vh;
  overflow: clip;
}
/* DISPLAY ONLY WHEN OPEN, and this is not a tidiness rule.
 *
 * A closed <dialog> is hidden by the UA stylesheet, and an author's
 * `display` beats the UA stylesheet whatever the specificity says. So
 * setting it unconditionally un-hides the closed one: measured at
 * 982x1358 in the normal flow, a full-viewport blank block at the bottom
 * of every page that mounted one, adding its own height to the scroll.
 *
 * It survived because a dialog is looked at while it is open. Nobody
 * scrolls to the bottom of a page to check that nothing is there. */
.u-cp[open] {
  display: grid;
  align-content: start;
  justify-items: center;
}

.u-cp::backdrop {
  background: rgb(0 0 0 / .35);
  backdrop-filter: blur(2px);
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease-out), overlay var(--dur-base) allow-discrete,
              display var(--dur-base) allow-discrete;
}
.u-cp[open]::backdrop { opacity: 1; }
@starting-style { .u-cp[open]::backdrop { opacity: 0; } }

.u-cp-panel {
  display: flex;
  flex-direction: column;
  width: min(560px, 100%);
  max-height: min(60vh, 480px);
  background: var(--bg-raised);
  color: var(--fg);
  border: var(--border-width) solid var(--border);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-4);
  overflow: clip;
}

.u-cp-head {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  padding: var(--s-5) var(--s-6);
  border-block-end: var(--border-width) solid var(--border);
}
.u-cp-glyph { flex: none; color: var(--fg-subtle); }
.u-cp-field {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--fg);
  font: var(--w-regular) var(--fs-lead)/1.4 var(--font-sans);
}
.u-cp-field:focus { outline: none; }
.u-cp-field::placeholder { color: var(--fg-subtle); }

.u-cp-list { flex: 1; min-height: 0; overflow-y: auto; padding: var(--s-4); }

.u-cp-group {
  margin: var(--s-4) 0 var(--s-2);
  padding-inline: var(--s-4);
  color: var(--fg-subtle);
  font: var(--w-medium) var(--fs-micro)/1.4 var(--font-sans);
}
.u-cp-list > div:first-child .u-cp-group { margin-block-start: 0; }

.u-cp-row {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  width: 100%;
  padding: var(--s-4) var(--s-4);
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--fg);
  cursor: pointer;
  text-align: start;
  font: var(--w-regular) var(--fs-small)/1.4 var(--font-sans);
}
/* The highlight is the pointer's AND the keyboard's — there is only one
   cursor here, so hover and aria-activedescendant have to be the same
   thing or the list shows two answers to "which one is Enter". */
.u-cp-at { background: var(--fill); }
.u-cp-off { opacity: .45; cursor: not-allowed; }

.u-cp-ico { flex: none; color: var(--fg-muted); }
.u-cp-at .u-cp-ico { color: var(--fg); }
.u-cp-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.u-cp-kbd {
  flex: none;
  padding: 2px var(--s-3);
  border-radius: var(--r-xs);
  background: var(--fill-quiet);
  color: var(--fg-subtle);
  font: var(--w-medium) var(--fs-micro)/1.4 var(--font-sans);
}

.u-cp-empty {
  margin: 0;
  padding: var(--s-8) var(--s-6);
  text-align: center;
  color: var(--fg-muted);
  font: var(--w-regular) var(--fs-small)/1.4 var(--font-sans);
}

.u-cp-foot {
  display: flex;
  gap: var(--s-6);
  padding: var(--s-4) var(--s-6);
  border-block-start: var(--border-width) solid var(--border);
  background: var(--bg-sunken);
  color: var(--fg-subtle);
  font: var(--w-regular) var(--fs-micro)/1 var(--font-sans);
}
.u-cp-hint { display: inline-flex; align-items: center; gap: var(--s-2); }
</style>
