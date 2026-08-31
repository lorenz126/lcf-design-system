<script setup lang="ts">
/**
 * Tooltip — describes its trigger. Never contains anything.
 *
 * Rendered in the top layer via popover="manual", so it cannot be clipped
 * by an ancestor's overflow and needs no z-index. "manual" rather than
 * "auto" because auto's light-dismiss is built for click-opened things;
 * a tooltip closes when the pointer or focus leaves, not when you click
 * somewhere else.
 *
 * A tooltip is unreachable by touch and adds nothing for a screen reader
 * beyond the name it already gives the trigger. So whatever it says must
 * be a nicety, never the only place the information exists.
 */
const props = withDefaults(defineProps<{
  text: string
  placement?: Placement
  /** Hover delay. Instant tooltips fire constantly while crossing a toolbar. */
  delay?: number
}>(), { placement: 'top', delay: 400 })

const uid = useId()
const id = computed(() => `tt-${uid}`)

const trigger = useTemplateRef<HTMLElement>('trigger')
const panel = useTemplateRef<HTMLElement>('panel')
const open = ref(false)
const { track, untrack } = useAnchored(trigger, panel, toRef(() => props.placement))

let timer: ReturnType<typeof setTimeout> | undefined

function show(immediate = false) {
  clearTimeout(timer)
  const run = () => {
    panel.value?.showPopover?.()
    open.value = true
    nextTick(track)
  }
  immediate ? run() : (timer = setTimeout(run, props.delay))
}

function hide() {
  clearTimeout(timer)
  if (!open.value) return
  panel.value?.hidePopover?.()
  open.value = false
  untrack()
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <span
    ref="trigger"
    class="u-tt-anchor"
    :aria-describedby="open ? id : undefined"
    @mouseenter="show()"
    @mouseleave="hide"
    @focusin="show(true)"
    @focusout="hide"
    @keydown.escape="hide"
  >
    <slot />
    <div :id="id" ref="panel" popover="manual" role="tooltip" class="u-tt">
      {{ text }}
    </div>
  </span>
</template>

<style scoped>
.u-tt-anchor { display: inline-flex; }

.u-tt {
  /* Reset the popover UA defaults, which come with a border and padding. */
  margin: 0;
  border: 0;
  inset: auto;
  max-width: 28ch;
  padding: var(--s-3) var(--s-5);
  border-radius: var(--r-sm);
  background: var(--fg);
  color: var(--bg);
  font: var(--w-medium) var(--fs-caption)/1.4 var(--font-sans);
  letter-spacing: var(--tr-caption);
  box-shadow: var(--shadow-2);
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out), overlay var(--dur-fast) allow-discrete,
              display var(--dur-fast) allow-discrete;
}
.u-tt:popover-open { opacity: 1; }
@starting-style { .u-tt:popover-open { opacity: 0; } }
</style>
