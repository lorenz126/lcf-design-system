<script setup lang="ts">
/**
 * Dialog — a modal, on the native <dialog> element.
 *
 * showModal() gives the focus trap, Escape, the inert background, the top
 * layer and focus returning to the trigger — all of it, from the browser.
 * That is five things a hand-built modal has to reimplement and usually
 * gets one of wrong.
 *
 * `dismissible: false` is for a dialog that must be answered rather than
 * escaped. Use it sparingly: it takes away the exit users expect.
 */
const props = withDefaults(defineProps<{
  title?: string
  /** Escape and backdrop click close it. */
  dismissible?: boolean
  width?: string
}>(), { dismissible: true, width: '440px' })

const open = defineModel<boolean>('open', { default: false })

const el = useTemplateRef<HTMLDialogElement>('el')
const uid = useId()
const titleId = computed(() => `dlg-${uid}`)

watch(open, v => {
  const d = el.value
  if (!d) return
  if (v && !d.open) d.showModal()
  else if (!v && d.open) d.close()
})

/* Same reason as Popover: a template-expression assignment to a
   defineModel ref is not a reliable .value write. */
function close() { open.value = false }

/** <dialog> closes itself on Escape, so mirror that back into the model. */
function onClose() { open.value = false }

function onCancel(e: Event) {
  if (!props.dismissible) e.preventDefault()
}

/** The backdrop is part of the dialog's own box, so a click landing
 *  outside the inner panel is a backdrop click. */
function onClick(e: MouseEvent) {
  if (!props.dismissible || e.target !== el.value) return
  open.value = false
}
</script>

<template>
  <dialog
    ref="el"
    class="u-dlg"
    :style="{ '--w': width }"
    :aria-labelledby="title ? titleId : undefined"
    @close="onClose"
    @cancel="onCancel"
    @click="onClick"
  >
    <div class="u-dlg-panel">
      <header v-if="title || $slots.header" class="u-dlg-head">
        <slot name="header">
          <h2 :id="titleId" class="u-dlg-title">{{ title }}</h2>
        </slot>
      </header>

      <div class="u-dlg-body"><slot :close="close" /></div>

      <footer v-if="$slots.footer" class="u-dlg-foot">
        <slot name="footer" :close="close" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.u-dlg {
  /* The element fills the viewport so its box can catch backdrop clicks;
     the visible panel is the child. */
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  margin: 0;
  padding: var(--s-7);
  border: 0;
  background: transparent;
  overflow: auto;
  display: grid;
  place-items: center;
}
.u-dlg::backdrop {
  background: rgb(0 0 0 / .35);
  backdrop-filter: blur(2px);
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease-out), overlay var(--dur-base) allow-discrete,
              display var(--dur-base) allow-discrete;
}
.u-dlg[open]::backdrop { opacity: 1; }
@starting-style { .u-dlg[open]::backdrop { opacity: 0; } }

.u-dlg-panel {
  width: min(var(--w), 100%);
  background: var(--bg-raised);
  color: var(--fg);
  border: var(--border-width) solid var(--border);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-4);
  opacity: 0;
  scale: .96;
  transition: opacity var(--dur-base) var(--ease-out), scale var(--dur-base) var(--ease-out);
}
.u-dlg[open] .u-dlg-panel { opacity: 1; scale: 1; }
@starting-style { .u-dlg[open] .u-dlg-panel { opacity: 0; scale: .96; } }

.u-dlg-head { padding: var(--s-7) var(--s-7) 0; }
.u-dlg-title {
  margin: 0;
  font: var(--w-semibold) var(--fs-title-sm)/1.3 var(--font-sans);
  letter-spacing: var(--tr-lead);
}
.u-dlg-body {
  padding: var(--s-5) var(--s-7) var(--s-7);
  font: var(--w-regular) var(--fs-body)/var(--lh-body) var(--font-sans);
  color: var(--fg-muted);
}
.u-dlg-foot {
  display: flex; justify-content: flex-end; gap: var(--s-4);
  padding: 0 var(--s-7) var(--s-7);
}
</style>
