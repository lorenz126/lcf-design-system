<script setup lang="ts">
useHead({ title: 'Controls — Design Framework' })

const agree = ref(true)
const partial = ref(false)
const plan = ref('team')
const notify = ref(true)
const digest = ref(false)
const country = ref('')
const sizes = ['sm', 'md', 'lg'] as const

const countries = [
  { value: 'de', label: 'Germany' },
  { value: 'at', label: 'Austria' },
  { value: 'ch', label: 'Switzerland' },
  { value: 'li', label: 'Liechtenstein', disabled: true }
]
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Native elements, restyled — not rebuilt.</p>
      <p class="t-body body">
        Every control here is the real <code>&lt;input&gt;</code> or
        <code>&lt;select&gt;</code> with <code>appearance: none</code>. That keeps the
        space bar, arrow-key navigation between radios, form submission, label
        association and screen reader semantics for free. A rebuilt control has to
        earn all five back, and usually gets one of them wrong.
      </p>
    </div>

    <section>
      <div class="sec-label">Select</div>
      <div class="row">
        <UiSelect v-for="s in sizes" :key="s" v-model="country" :size="s" :label="s"
                  :options="countries" placeholder="Choose a country" />
      </div>
      <div class="row">
        <UiSelect v-model="country" label="With help" :options="countries"
                  placeholder="Choose" help="Used to set your tax region." />
        <UiSelect label="Invalid" :options="countries" placeholder="Choose"
                  error="Please choose a country." />
        <UiSelect label="Disabled" :options="countries" placeholder="Choose" disabled />
      </div>
      <p class="t-caption hint">
        Native on purpose. A custom listbox means rebuilding typeahead and the mobile
        platform picker, all to style a dropdown panel that no browser lets you style
        anyway. Options needing icons or descriptions are a Combobox — a different
        component, not a flag on this one.
      </p>
    </section>

    <section>
      <div class="sec-label">Checkbox</div>
      <div class="stack">
        <UiCheckbox v-model="agree" label="Send me product updates" />
        <UiCheckbox v-model="partial" indeterminate label="Select all"
                    help="Some items in this group are selected." />
        <UiCheckbox label="Unavailable option" disabled />
        <UiCheckbox model-value label="Checked and disabled" disabled />
      </div>
    </section>

    <section>
      <div class="sec-label">Radio</div>
      <fieldset class="stack group">
        <legend class="t-small legend">Plan</legend>
        <UiRadio v-model="plan" name="plan" value="solo" label="Solo"
                 help="One seat, personal projects." />
        <UiRadio v-model="plan" name="plan" value="team" label="Team"
                 help="Up to ten seats and shared billing." />
        <UiRadio v-model="plan" name="plan" value="enterprise" label="Enterprise"
                 help="Contact us." disabled />
      </fieldset>
      <p class="t-caption hint">
        Arrow keys move between the options because they share a <code>name</code> —
        that is native behaviour, not something wired up here. <code>name</code> is a
        required prop for exactly that reason.
      </p>
    </section>

    <section>
      <div class="sec-label">Switch</div>
      <div class="stack">
        <UiSwitch v-model="notify" label="Push notifications"
                  help="Applies immediately." />
        <UiSwitch v-model="digest" label="Weekly digest" />
        <UiSwitch label="Unavailable" disabled />
      </div>
      <p class="t-caption hint">
        Toggle one and watch the knob — this is the only place the spring easing is
        used. A switch is a physical metaphor, so it overshoots slightly and settles.
        A switch also takes effect <em>immediately</em>; if the change only lands on
        Save, it is a checkbox and should look like one.
      </p>
    </section>
  </div>
</template>

<style scoped>
.intro { border-left: 2px solid var(--rule); padding-left: 20px; margin-bottom: 64px; }
.lede { margin: 0 0 10px; }
.body { margin: 0; color: var(--ink-2); max-width: 68ch; }
code { font-family: var(--font-mono); font-size: 11px; }
section { margin-bottom: 64px; }
.row { display: flex; flex-wrap: wrap; gap: var(--s-6); align-items: flex-start; margin-bottom: var(--s-6); }
.stack { display: flex; flex-direction: column; gap: var(--s-6); max-width: 420px; }
.group { border: 0; margin: 0; padding: 0; }
.legend { padding: 0 0 var(--s-5); color: var(--ink-2); font-weight: var(--w-medium); }
.hint { color: var(--ink-3); margin: 14px 0 0; max-width: 68ch; line-height: 1.6; }
</style>
