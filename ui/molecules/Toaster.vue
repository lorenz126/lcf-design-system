<script setup lang="ts">
import type { Component } from 'vue'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-vue-next'
import type { Toast, ToastTone } from '../../composables/useToast'

/**
 * Toaster — where messages about what just happened appear.
 *
 * Mounted once, near the root. Everything else calls `useToast()`.
 *
 * TWO REGIONS, NOT ONE WITH A SWITCH. `role="status"` waits for a pause
 * before speaking; `role="alert"` interrupts. Which a message deserves is
 * decided when it is written, not by the container it lands in, and a
 * single region cannot be both. Errors interrupt; everything else waits.
 *
 * BOTH ARE MOUNTED EMPTY AND STAY MOUNTED. A live region that appears
 * already holding text is usually not announced at all — what gets
 * announced is a change inside a region that was already being watched.
 * That is why these two elements are always in the DOM even when there
 * is nothing to say.
 *
 * THE STACK IS THE LIVE REGION, rather than a hidden copy of it beside
 * the visible one. A duplicate would announce twice, and hiding the
 * visible one from assistive technology would take its dismiss button
 * and its action with it. Removals are not announced: the default
 * `aria-relevant` is additions and text, so a toast leaving is silent.
 *
 * THE TIMERS PAUSE ON HOVER AND ON FOCUS — for the whole stack, not the
 * one under the pointer, because reading the second message is a reason
 * to keep the first. Otherwise a toast is a message you can lose by
 * reading it slowly.
 */
withDefaults(defineProps<{
  /**
   * Which corner. Bottom-end by default because the other three are
   * where this framework's own furniture already is: a sidebar takes the
   * inline start and a top bar takes the block start. A default that
   * lands on the layout the library recommends is not a default.
   */
  position?: 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start'
  label?: string
}>(), { position: 'bottom-end', label: 'Notifications' })

const { items, dismiss } = useToast()

const ICON: Record<ToastTone, Component> = {
  neutral: Info,
  blue: Info,
  green: CheckCircle2,
  orange: AlertTriangle,
  red: XCircle
}

/** Errors interrupt. Everything else waits for a gap. */
const urgent = (t: Toast) => t.tone === 'red'

/* Two regions, one template. Iterating them keeps the item markup in one
   place: the difference between them is a role, not a design. */
const regions = computed(() => [
  { key: 'polite', role: 'status', items: items.value.filter(t => !urgent(t)) },
  { key: 'loud', role: 'alert', items: items.value.filter(urgent) }
])

/* ---------- the clock ---------- */

const timers = new Map<number, ReturnType<typeof setTimeout>>()
const paused = ref(false)

function arm(t: Toast) {
  if (!t.duration || paused.value || timers.has(t.id)) return
  timers.set(t.id, setTimeout(() => dismiss(t.id), t.duration))
}
function disarm(id: number) {
  const h = timers.get(id)
  if (h) clearTimeout(h)
  timers.delete(id)
}

watch(items, list => {
  // Anything gone takes its timer with it; anything new gets one.
  for (const id of [...timers.keys()]) {
    if (!list.some(t => t.id === id)) disarm(id)
  }
  list.forEach(arm)
}, { immediate: true, deep: true })

watch(paused, p => {
  if (p) items.value.forEach(t => disarm(t.id))
  else items.value.forEach(arm)
})

onBeforeUnmount(() => { timers.forEach(clearTimeout); timers.clear() })
</script>

<template>
  <div
    class="u-tst"
    :class="`u-tst-${position}`"
    @pointerenter="paused = true"
    @pointerleave="paused = false"
    @focusin="paused = true"
    @focusout="paused = false"
  >
    <!-- Both always present, both usually empty. See the note above. -->
    <div
      v-for="r in regions"
      :key="r.key"
      class="u-tst-stack"
      :role="r.role"
      :aria-label="r.key === 'polite' ? label : undefined"
    >
      <div v-for="t in r.items" :key="t.id" class="u-tst-item" :data-tone="t.tone">
        <UiIcon :is="t.icon ?? ICON[t.tone]" size="sm" class="u-tst-mark" />
        <div class="u-tst-text">
          <p class="u-tst-title">{{ t.title }}</p>
          <p v-if="t.description" class="u-tst-desc">{{ t.description }}</p>
        </div>
        <UiButton
          v-if="t.action"
          variant="plain"
          tone="neutral"
          size="sm"
          class="u-tst-do"
          @click="t.action.onClick(); dismiss(t.id)"
        >{{ t.action.label }}</UiButton>
        <button
          type="button"
          class="u-tst-x"
          :aria-label="`Dismiss: ${t.title}`"
          @click="dismiss(t.id)"
        ><UiIcon :is="X" size="sm" /></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.u-tst {
  position: fixed;
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  /* The wrapper spans nothing it does not have to: a fixed box across a
     corner of the screen would swallow clicks meant for the page. */
  width: max-content;
  max-width: min(400px, calc(100vw - var(--s-8)));
  pointer-events: none;
}
.u-tst > * > * { pointer-events: auto; }

.u-tst-top-end      { inset-block-start: var(--s-6); inset-inline-end: var(--s-6); }
.u-tst-top-start    { inset-block-start: var(--s-6); inset-inline-start: var(--s-6); }
.u-tst-bottom-end   { inset-block-end: var(--s-6); inset-inline-end: var(--s-6); }
.u-tst-bottom-start { inset-block-end: var(--s-6); inset-inline-start: var(--s-6); }

.u-tst-stack { display: flex; flex-direction: column; gap: var(--s-4); }

.u-tst-item {
  display: flex;
  align-items: flex-start;
  gap: var(--s-4);
  padding: var(--s-5);
  border: var(--border-width) solid var(--border);
  border-radius: var(--r-lg);
  background: var(--bg-raised);
  color: var(--fg);
  /* Shadow, not border, because this really is above the page — the one
     case the surface rule is written for. */
  box-shadow: var(--shadow-3);
}

.u-tst-mark { flex: none; margin-block-start: 1px; color: var(--fg-subtle); }
.u-tst-item[data-tone="green"]  .u-tst-mark { color: var(--green-text); }
.u-tst-item[data-tone="blue"]   .u-tst-mark { color: var(--blue-text); }
.u-tst-item[data-tone="orange"] .u-tst-mark { color: var(--orange-text); }
.u-tst-item[data-tone="red"]    .u-tst-mark { color: var(--red-text); }

.u-tst-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.u-tst-title {
  margin: 0;
  font: var(--w-medium) var(--fs-small)/1.4 var(--font-sans);
  letter-spacing: var(--tr-small);
}
.u-tst-desc {
  margin: 0;
  color: var(--fg-muted);
  font: var(--w-regular) var(--fs-caption)/1.45 var(--font-sans);
}

.u-tst-do { flex: none; align-self: center; }

.u-tst-x {
  flex: none;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  margin: -2px -2px 0 0;
  padding: 0;
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--fg-subtle);
  cursor: pointer;
}
.u-tst-x:hover { background: var(--fill-quiet); color: var(--fg); }
.u-tst-x:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 1px;
}
</style>
