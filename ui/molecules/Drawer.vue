<script setup lang="ts">
import { X } from 'lucide-vue-next'

/**
 * Drawer — a panel that comes in from an edge.
 *
 * MODAL OR NOT IS THE WHOLE DECISION, and it is not a styling choice.
 * A filter panel you keep open while reading the list behind it, and a
 * confirmation you must answer, are different components that happen to
 * look identical. So it is one prop, and it changes one call:
 *
 *   modal      dialog.showModal() — focus trap, Escape, inert
 *              background, backdrop, focus back to the trigger. Five
 *              things a hand-built panel reimplements and usually gets
 *              one of wrong.
 *
 *   non-modal  dialog.show() — the SAME element and the same top layer,
 *              so nothing can clip it and it needs no z-index, but the
 *              page behind stays live and focus stays free. Which means
 *              Escape and the backdrop are ours to supply, because the
 *              browser only provides them for the modal case.
 *
 * That symmetry is why this is one component rather than two: the same
 * element, the same paint, two calls.
 *
 * Focus moves in on open either way — a panel that appears and leaves
 * the keyboard behind it is a panel a keyboard cannot reach. Where it
 * lands is the first focusable thing inside, or the panel itself.
 *
 * A non-modal drawer does NOT take focus back to the trigger on close,
 * because the trigger may not be where the user has been working. The
 * modal one does, and that is the browser's doing.
 */
const props = withDefaults(defineProps<{
  title?: string
  /** See above. This is the decision, not a look. */
  modal?: boolean
  /** Which edge it belongs to. `block-end` is the sheet a phone wants. */
  side?: 'inline-start' | 'inline-end' | 'block-end'
  /** Along the axis it slides on. */
  size?: string
  /** Escape and a backdrop click close it. */
  dismissible?: boolean
  /** A close button in the header. Off only when the footer has one. */
  closable?: boolean
}>(), {
  modal: true,
  side: 'inline-end',
  size: '380px',
  dismissible: true,
  closable: true
})

const open = defineModel<boolean>('open', { default: false })

const el = useTemplateRef<HTMLDialogElement>('el')
const uid = useId()
const titleId = computed(() => `drw-${uid}`)

watch(open, v => {
  const d = el.value
  if (!d) return
  if (v && !d.open) {
    props.modal ? d.showModal() : d.show()
    nextTick(() => {
      const first = d.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      ;(first ?? d).focus()
    })
  } else if (!v && d.open) {
    d.close()
  }
})

/* Same reason as Popover and Dialog: an assignment to a defineModel ref
   inside a template expression is not a reliable .value write. */
function close() { open.value = false }

/** <dialog> closes itself on Escape when modal, so mirror it back. */
function onClose() { open.value = false }
function onCancel(e: Event) { if (!props.dismissible) e.preventDefault() }

/** Modal only: the backdrop belongs to the element's own box, so a click
 *  landing on the element rather than the panel is a backdrop click. */
function onClick(e: MouseEvent) {
  if (!props.modal || !props.dismissible || e.target !== el.value) return
  close()
}

/* Escape is the browser's for a modal dialog and nobody's for a
   non-modal one, so the non-modal case listens for it — on the panel,
   not on the window, so a drawer left open cannot swallow the Escape
   meant for something else the user is actually in. */
function onKey(e: KeyboardEvent) {
  if (props.modal || !props.dismissible || e.key !== 'Escape') return
  e.stopPropagation()
  close()
}
</script>

<template>
  <dialog
    ref="el"
    class="u-drw"
    :class="[`u-drw-${side}`, { 'u-drw-modal': modal }]"
    :style="{ '--drw-size': size }"
    :aria-labelledby="title ? titleId : undefined"
    @close="onClose"
    @cancel="onCancel"
    @click="onClick"
    @keydown="onKey"
  >
    <div class="u-drw-panel">
      <header v-if="title || closable || $slots.header" class="u-drw-head">
        <slot name="header">
          <h2 v-if="title" :id="titleId" class="u-drw-title">{{ title }}</h2>
        </slot>
        <UiButton
          v-if="closable"
          variant="plain"
          tone="neutral"
          size="sm"
          icon-only
          class="u-drw-x"
          aria-label="Close"
          @click="close"
        ><UiIcon :is="X" size="sm" /></UiButton>
      </header>

      <div class="u-drw-body"><slot :close="close" /></div>

      <footer v-if="$slots.footer" class="u-drw-foot">
        <slot name="footer" :close="close" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.u-drw {
  /* The UA gives a dialog a border, padding and auto margins; all three
     are wrong for something pinned to an edge. */
  margin: 0;
  padding: 0;
  border: 0;
  max-width: none;
  max-height: none;
  background: transparent;
  color: var(--fg);
  position: fixed;
  inset: auto;
}

.u-drw-inline-start { inset-block: 0; inset-inline-start: 0; }
.u-drw-inline-end   { inset-block: 0; inset-inline-end: 0; }
.u-drw-block-end    { inset-inline: 0; inset-block-end: 0; }

.u-drw-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-raised);
  box-shadow: var(--shadow-4);
}
.u-drw-inline-start .u-drw-panel,
.u-drw-inline-end .u-drw-panel {
  width: min(var(--drw-size), 92vw);
  height: 100dvh;
}
.u-drw-block-end .u-drw-panel {
  width: 100%;
  height: min(var(--drw-size), 88dvh);
  border-start-start-radius: var(--r-xl);
  border-start-end-radius: var(--r-xl);
}

/* A border on the side it is attached to, so it reads as part of the
   layout rather than floating over it — the same rule Card follows. */
.u-drw-inline-end .u-drw-panel { border-inline-start: var(--border-width) solid var(--border); }
.u-drw-inline-start .u-drw-panel { border-inline-end: var(--border-width) solid var(--border); }
.u-drw-block-end .u-drw-panel { border-block-start: var(--border-width) solid var(--border); }

.u-drw-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--s-5);
  padding: var(--s-6) var(--s-6) var(--s-5);
  border-block-end: var(--border-width) solid var(--border);
}
.u-drw-title {
  margin: 0;
  font: var(--w-semibold) var(--fs-lead)/1.3 var(--font-sans);
  letter-spacing: var(--tr-lead);
}
.u-drw-x { margin-inline-start: auto; }

.u-drw-body { flex: 1; min-height: 0; overflow-y: auto; padding: var(--s-6); }

.u-drw-foot {
  flex: none;
  display: flex;
  justify-content: flex-end;
  gap: var(--s-4);
  padding: var(--s-5) var(--s-6);
  border-block-start: var(--border-width) solid var(--border);
}

/* ---- coming and going ---- */

.u-drw {
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease-out),
              translate var(--dur-base) var(--ease-out),
              overlay var(--dur-base) allow-discrete,
              display var(--dur-base) allow-discrete;
}
.u-drw-inline-end { translate: 100% 0; }
.u-drw-inline-start { translate: -100% 0; }
.u-drw-block-end { translate: 0 100%; }

.u-drw[open] { opacity: 1; translate: 0 0; }
@starting-style {
  .u-drw-inline-end[open] { opacity: 0; translate: 100% 0; }
  .u-drw-inline-start[open] { opacity: 0; translate: -100% 0; }
  .u-drw-block-end[open] { opacity: 0; translate: 0 100%; }
}

/* Only a modal has one to paint. */
.u-drw-modal::backdrop {
  background: rgb(0 0 0 / .35);
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease-out),
              overlay var(--dur-base) allow-discrete,
              display var(--dur-base) allow-discrete;
}
.u-drw-modal[open]::backdrop { opacity: 1; }
@starting-style { .u-drw-modal[open]::backdrop { opacity: 0; } }
</style>
