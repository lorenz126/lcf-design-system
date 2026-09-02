<script setup lang="ts">
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline } from 'lucide-vue-next'
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

const view = ref('week')
const align = ref('left')
const marks = ref<string[]>(['bold'])
const density = ref('comfortable')
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

    <section>
      <div class="sec-label">ToggleGroup</div>
      <div class="col">
        <UiToggleGroup
          v-model="view"
          :options="[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
            { value: 'year', label: 'Year', disabled: true }
          ]"
          field-label="Range"
          label="Calendar range"
        />

        <UiToggleGroup
          v-model="align"
          variant="toolbar"
          icon-only
          label="Text alignment"
          :options="[
            { value: 'left', label: 'Align left', icon: AlignLeft },
            { value: 'center', label: 'Centre', icon: AlignCenter },
            { value: 'right', label: 'Align right', icon: AlignRight }
          ]"
        />

        <UiToggleGroup
          v-model="marks"
          type="multiple"
          variant="toolbar"
          icon-only
          label="Text style"
          :options="[
            { value: 'bold', label: 'Bold', icon: Bold },
            { value: 'italic', label: 'Italic', icon: Italic },
            { value: 'underline', label: 'Underline', icon: Underline }
          ]"
        />

        <UiToggleGroup
          v-model="density"
          :options="[
            { value: 'compact', label: 'Compact' },
            { value: 'comfortable', label: 'Comfortable' }
          ]"
          size="sm"
          label="Density"
          block
        />
      </div>
      <p class="t-caption hint">
        <strong>“Toggles” is two components</strong>, and shipping one behaviour under
        both names is the usual way this control goes wrong. Choosing one of several is
        a <code>radiogroup</code>: <em>one</em> tab stop, and the arrows both move and
        choose, because a radiogroup has no such thing as focused-but-unchosen. Turning
        several on independently is a group of buttons with <code>aria-pressed</code>:
        Tab reaches the group, the arrows move focus only, and Space chooses — which is
        the browser’s, since every option is a real button.
      </p>
      <p class="t-caption hint">
        Tab into the first group and press the arrows: the selection follows. Do the
        same in the third and it does not, until you press Space. That difference is
        the <code>type</code> prop, which is a semantic choice rather than a styling
        flag — <code>variant</code> is the styling one, and the two are independent.
      </p>
      <p class="t-caption hint">
        Current: <strong>{{ view }}</strong> · <strong>{{ align }}</strong> ·
        <strong>{{ marks.join(', ') || 'none' }}</strong> · <strong>{{ density }}</strong>
      </p>
    </section>
  </div>
</template>

<style scoped>
.col { display: flex; flex-direction: column; gap: var(--s-7); align-items: flex-start; }
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
