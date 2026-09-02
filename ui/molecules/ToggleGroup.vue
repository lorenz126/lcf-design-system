<script setup lang="ts">
import type { Component } from 'vue'

/**
 * ToggleGroup — one of several, or several at once.
 *
 * "TOGGLES" IS TWO COMPONENTS, and shipping one behaviour under both
 * names is the usual way this control goes wrong.
 *
 *   single    choosing one of several. That is a radiogroup: ONE tab
 *             stop for the whole group, and the arrows both move and
 *             choose, because in a radiogroup there is no such thing as
 *             a focused-but-unchosen option.
 *
 *   multiple  turning several on independently. That is a group of
 *             buttons with aria-pressed: Tab reaches the group, the
 *             arrows move focus only, and Space chooses — which is the
 *             browser's, since every option is a real <button>.
 *
 * So it is one component with one `type` prop, and that prop is a
 * semantic choice rather than a styling flag. `variant` is the styling
 * one, and the two are independent: a segmented control and a toolbar of
 * icon buttons look nothing alike and behave identically.
 *
 * An icon-only option still needs a name. Icon refuses to be one and so
 * does this: `label` is required, and `iconOnly` hides it visually
 * without removing it.
 */
export interface ToggleOption {
  value: string
  label: string
  icon?: Component
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  options: ToggleOption[]
  /** The semantic choice. See above — not a styling flag. */
  type?: 'single' | 'multiple'
  variant?: 'segmented' | 'toolbar'
  size?: 'sm' | 'md' | 'lg'
  /** Shows only the icon. The label stays, for anything that reads. */
  iconOnly?: boolean
  disabled?: boolean
  /** Names the group for assistive technology. Required when there is
   *  no visible `fieldLabel`. */
  label?: string
  /** A visible label above the group, and the message under it. */
  fieldLabel?: string
  help?: string
  error?: string
  block?: boolean
}>(), { type: 'single', variant: 'segmented', size: 'md' })

const model = defineModel<string | string[]>({ default: '' })

const root = useTemplateRef<HTMLElement>('root')

const isOn = (v: string) =>
  props.type === 'single'
    ? model.value === v
    : Array.isArray(model.value) && model.value.includes(v)

function choose(o: ToggleOption) {
  if (o.disabled || props.disabled) return
  if (props.type === 'single') {
    model.value = o.value
    return
  }
  const list = Array.isArray(model.value) ? model.value : []
  model.value = list.includes(o.value)
    ? list.filter(v => v !== o.value)
    : [...list, o.value]
}

/* ---------- moving ---------- */

const enabled = computed(() => props.options.filter(o => !o.disabled))

/** Where focus last was, so Tab returns to it rather than to the start. */
const active = ref<string>()

/**
 * ONE tab stop, for both types.
 *
 * A radiogroup has one by definition. A toolbar of toggles has one
 * because the arrows are what move inside it — leaving every button
 * tabbable turns a three-button toolbar into three tab stops and a
 * twelve-button one into twelve, which is the obstacle course the
 * calendar grid exists to avoid.
 *
 * Which one: what is chosen, then where focus last was, then the first
 * thing that can take it.
 */
const tabbable = computed(() => {
  if (props.type === 'single') {
    const on = props.options.find(o => isOn(o.value) && !o.disabled)
    if (on) return on.value
  }
  return active.value && enabled.value.some(o => o.value === active.value)
    ? active.value
    : enabled.value[0]?.value
})

function focusAt(v: string) {
  root.value?.querySelector<HTMLElement>(`[data-v="${v}"]`)?.focus()
}

function onKey(e: KeyboardEvent, o: ToggleOption) {
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End']
  if (!keys.includes(e.key)) return
  e.preventDefault()

  const list = enabled.value
  if (!list.length) return
  const at = list.findIndex(x => x.value === o.value)
  const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1

  const next =
    e.key === 'Home' ? list[0]!
    : e.key === 'End' ? list[list.length - 1]!
    : list[(at + step + list.length) % list.length]!

  /* Recorded here rather than left to the focus handler: this already
     knows where it is going, and a focus event is one more thing that
     has to be delivered before the tab stop is right. */
  active.value = next.value
  focusAt(next.value)
  /* In a radiogroup, moving IS choosing. In a group of independent
     toggles it is not — Space does that, and the browser handles it. */
  if (props.type === 'single') choose(next)
}
</script>

<template>
  <UiField :label="fieldLabel" :help="help" :error="error" :size="size" :block="block">
    <div
      ref="root"
      class="u-tg"
      :class="[`u-tg-${variant}`, `u-s-${size}`, { 'u-tg-block': block, 'u-tg-off': disabled }]"
      :role="type === 'single' ? 'radiogroup' : 'group'"
      :aria-label="label"
      :aria-disabled="disabled || undefined"
    >
      <button
        v-for="o in options"
        :key="o.value"
        type="button"
        class="u-tg-opt"
        :class="{ 'u-tg-on': isOn(o.value) }"
        :data-v="o.value"
        :role="type === 'single' ? 'radio' : undefined"
        :aria-checked="type === 'single' ? isOn(o.value) : undefined"
        :aria-pressed="type === 'multiple' ? isOn(o.value) : undefined"
        :tabindex="o.value === tabbable ? 0 : -1"
        :disabled="o.disabled || disabled"
        @click="choose(o)"
        @focus="active = o.value"
        @keydown="onKey($event, o)"
      >
        <UiIcon v-if="o.icon" :is="o.icon" size="sm" />
        <span :class="{ 'u-tg-sr': iconOnly }">{{ o.label }}</span>
      </button>
    </div>
  </UiField>
</template>

<style scoped>
.u-tg {
  display: inline-flex;
  align-items: center;
  width: max-content;
}
.u-tg-block { width: 100%; }
.u-tg-off { opacity: .5; }

.u-tg-opt {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--s-3);
  height: var(--fld-h, var(--field-md));
  padding-inline: var(--fld-pad, var(--s-5));
  border: 0;
  background: transparent;
  color: var(--fg-muted);
  cursor: pointer;
  white-space: nowrap;
  font: var(--w-medium) var(--fs-small)/1 var(--font-sans);
  letter-spacing: var(--tr-small);
  transition: background-color var(--dur-fast) var(--ease-out),
              color var(--dur-fast) var(--ease-out);
}
.u-tg-block .u-tg-opt { flex: 1; }
.u-tg-opt:hover:not(:disabled) { color: var(--fg); }
.u-tg-opt:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: -2px;
  z-index: 1;
}
.u-tg-opt:disabled { opacity: .5; cursor: not-allowed; }

/* The chosen one, in the same recipe as every other "here" in the
   system: a neutral ground and heavier text, never a colour. */
.u-tg-on { color: var(--fg); font-weight: var(--w-semibold); }

/* Segmented: one sunken track with the selection raised out of it. */
.u-tg-segmented {
  gap: 2px;
  padding: 2px;
  border-radius: var(--r-control);
  background: var(--fill-quiet);
}
.u-tg-segmented .u-tg-opt { border-radius: calc(var(--r-control) - 2px); }
.u-tg-segmented .u-tg-on {
  background: var(--bg-raised);
  box-shadow: var(--shadow-1);
}

/* Toolbar: separate buttons, nothing under them. */
.u-tg-toolbar { gap: var(--s-2); }
.u-tg-toolbar .u-tg-opt { border-radius: var(--r-sm); }
.u-tg-toolbar .u-tg-opt:hover:not(:disabled) { background: var(--fill-quiet); }
.u-tg-toolbar .u-tg-on { background: var(--fill); }

.u-tg-sr {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
