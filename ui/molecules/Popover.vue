<script setup lang="ts">
/**
 * Popover — interactive content anchored to a trigger.
 *
 * popover="auto" rather than "manual": auto gives light dismiss (click
 * outside) and Escape from the browser, and closes any other auto popover
 * when it opens. That last part is what stops two menus being open at
 * once, which is tedious to get right by hand.
 *
 * Unlike Tooltip, this may contain focusable things — it is opened by
 * click, so touch and keyboard reach it.
 *
 * Opening is driven by the trigger's `popovertarget` attribute, not by a
 * click handler. Calling showPopover() from a click listener races the
 * same click as it keeps bubbling: the popover opens, the click reaches
 * the document, and auto's light-dismiss closes it again in the same
 * tick. Handing the toggle to the browser removes the race rather than
 * papering over it with stopPropagation.
 */
const props = withDefaults(defineProps<{
  placement?: Placement
  /** Where along that side it sits. Centred by default; a menu wants an
   *  edge, so this is not hardcoded. */
  align?: Align
  /** Match the trigger's width — for select-like panels. */
  matchWidth?: boolean
  /** `none` is for panels whose content owns its own edges — a menu,
   *  whose rows have to run the full width to be clickable at the edge. */
  padding?: 'none' | 'md'
}>(), { placement: 'bottom', align: 'center', padding: 'md' })

const open = defineModel<boolean>('open', { default: false })

const uid = useId()
const id = computed(() => `pop-${uid}`)
const trigger = useTemplateRef<HTMLElement>('trigger')
const panel = useTemplateRef<HTMLElement>('panel')
const { track, untrack } = useAnchored(
  trigger,
  panel,
  toRef(() => props.placement),
  toRef(() => props.align)
)

/* Defined here rather than as inline arrows in the slot bindings. An
   assignment to a defineModel ref inside a template expression does not
   reliably compile to a .value write, and the failure is silent. */
function close() { open.value = false }

/** For opening it from code rather than from the trigger. */
function toggle() {
  const p = panel.value
  if (!p) return
  open.value ? p.hidePopover?.() : p.showPopover?.()
}

/** The browser owns the open/closed state — trigger, light dismiss and
 *  Escape all go through it. This is the single place the model catches
 *  up, so the two can never disagree. */
function onToggle(e: Event) {
  const opening = (e as ToggleEvent).newState === 'open'
  open.value = opening
  if (opening) {
    if (props.matchWidth && trigger.value) {
      panel.value!.style.minWidth = `${trigger.value.getBoundingClientRect().width}px`
    }
    nextTick(track)
  } else {
    untrack()
  }
}

/** Programmatic v-model:open still works — it just goes through the same
 *  browser call the trigger uses. */
watch(open, v => {
  const p = panel.value
  if (!p) return
  const shown = p.matches(':popover-open')
  if (v && !shown) p.showPopover?.()
  if (!v && shown) p.hidePopover?.()
})
</script>

<template>
  <div class="u-pop-anchor">
    <div ref="trigger" class="u-pop-trigger">
      <slot
        name="trigger"
        :open="open"
        :toggle="toggle"
        :props="{
          popovertarget: id,
          'aria-expanded': open,
          'aria-controls': id
        }"
      />
    </div>

    <div
      :id="id"
      ref="panel"
      popover="auto"
      class="u-pop"
      :class="`u-pop-p-${padding}`"
      @toggle="onToggle"
    >
      <slot :close="close" />
    </div>
  </div>
</template>

<style scoped>
.u-pop-anchor { display: contents; }
.u-pop-trigger { display: inline-flex; }

.u-pop {
  margin: 0;
  inset: auto;
  border: var(--border-width) solid var(--border);
  border-radius: var(--r-lg);
  background: var(--bg-raised);
  color: var(--fg);
  box-shadow: var(--shadow-3);
  opacity: 0;
  scale: .97;
  transition: opacity var(--dur-fast) var(--ease-out), scale var(--dur-fast) var(--ease-out),
              overlay var(--dur-fast) allow-discrete, display var(--dur-fast) allow-discrete;
}
.u-pop-p-md { padding: var(--s-5); }
.u-pop-p-none { padding: 0; }

.u-pop:popover-open { opacity: 1; scale: 1; }
@starting-style { .u-pop:popover-open { opacity: 0; scale: .97; } }
</style>
