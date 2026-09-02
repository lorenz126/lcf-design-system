<script setup lang="ts">
import type { Component } from 'vue'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-vue-next'

/**
 * Banner — what the page says about itself.
 *
 * The distinction from Toast is the whole reason both exist. A toast is
 * what HAPPENED: it arrives, it is read, it leaves. A banner is what IS:
 * this project is archived, this account is over its limit, this form is
 * read-only. It has no timer because the condition it describes has no
 * timer, and it sits in the layout rather than over it.
 *
 * WHICH MEANS IT IS USUALLY NOT A LIVE REGION. A banner that is on the
 * page when the page loads has nothing to announce — it is read in
 * order, like the rest of the page, and marking it live would only add
 * noise on every re-render. `announce` is for the other case, where one
 * appears in response to something the reader just did, and it picks the
 * urgency the same way Toaster does: red interrupts, everything else
 * waits.
 *
 * TINT GROUND, FULL-STRENGTH TEXT, COLOURED MARK. The ground already
 * says the tone; colouring the words as well is a second saying of the
 * same thing, bought with legibility — and accent-on-accent-tint fell
 * under AA in dark mode on a raised surface twice before. The icon keeps
 * the colour because it is a graphic, held to 3:1 rather than 4.5.
 */
type Tone = 'neutral' | 'blue' | 'green' | 'orange' | 'red'

const props = withDefaults(defineProps<{
  tone?: Tone
  title?: string
  /** Replaced by the default slot when there is more to say. */
  description?: string
  icon?: Component
  /** A close button. The banner does not remember; the page does. */
  dismissible?: boolean
  /**
   * Makes it a live region. Only for a banner that APPEARS — see above.
   */
  announce?: boolean
}>(), { tone: 'neutral', dismissible: false })

const emit = defineEmits<{ dismiss: [] }>()

const ICON: Record<Tone, Component> = {
  neutral: Info,
  blue: Info,
  green: CheckCircle2,
  orange: AlertTriangle,
  red: XCircle
}

const role = computed(() =>
  props.announce ? (props.tone === 'red' ? 'alert' : 'status') : undefined
)
</script>

<template>
  <div class="u-bn" :data-tone="tone" :role="role">
    <UiIcon :is="icon ?? ICON[tone]" size="sm" class="u-bn-mark" />

    <div class="u-bn-text">
      <p v-if="title" class="u-bn-title">{{ title }}</p>
      <div v-if="description || $slots.default" class="u-bn-body">
        <slot>{{ description }}</slot>
      </div>
    </div>

    <div v-if="$slots.action" class="u-bn-act"><slot name="action" /></div>

    <button
      v-if="dismissible"
      type="button"
      class="u-bn-x"
      :aria-label="title ? `Dismiss: ${title}` : 'Dismiss'"
      @click="emit('dismiss')"
    ><UiIcon :is="X" size="sm" /></button>
  </div>
</template>

<style scoped>
.u-bn {
  display: flex;
  align-items: flex-start;
  gap: var(--s-4);
  padding: var(--s-5) var(--s-6);
  border-radius: var(--r-md);
  /* Border, not shadow: this sits IN the layout rather than on it. */
  border: var(--border-width) solid var(--bn-edge, var(--border));
  background: var(--bn-bg, var(--fill-quiet));
  color: var(--fg);
}

.u-bn[data-tone="blue"]   { --bn-bg: var(--blue-fill);   --bn-edge: var(--blue-fill);   --bn-mark: var(--blue-text); }
.u-bn[data-tone="green"]  { --bn-bg: var(--green-fill);  --bn-edge: var(--green-fill);  --bn-mark: var(--green-text); }
.u-bn[data-tone="orange"] { --bn-bg: var(--orange-fill); --bn-edge: var(--orange-fill); --bn-mark: var(--orange-text); }
.u-bn[data-tone="red"]    { --bn-bg: var(--red-fill);    --bn-edge: var(--red-fill);    --bn-mark: var(--red-text); }

.u-bn-mark { flex: none; margin-block-start: 2px; color: var(--bn-mark, var(--fg-subtle)); }

.u-bn-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.u-bn-title {
  margin: 0;
  font: var(--w-semibold) var(--fs-small)/1.4 var(--font-sans);
  letter-spacing: var(--tr-small);
}
.u-bn-body {
  color: var(--fg-muted);
  font: var(--w-regular) var(--fs-small)/1.5 var(--font-sans);
  letter-spacing: var(--tr-small);
}
.u-bn-body :deep(p) { margin: 0; }
.u-bn-body :deep(a) { color: var(--accent-text); }

.u-bn-act { flex: none; align-self: center; display: flex; gap: var(--s-4); }

.u-bn-x {
  flex: none;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  margin: 1px -4px 0 0;
  padding: 0;
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--fg-subtle);
  cursor: pointer;
}
.u-bn-x:hover { background: var(--fill-quiet); color: var(--fg); }
.u-bn-x:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 1px;
}
</style>
