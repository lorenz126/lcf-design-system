<script setup lang="ts">
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline } from 'lucide-vue-next'
useHead({ title: 'ToggleGroup — Design Framework' })
const view = ref('week')
const align = ref('left')
const marks = ref<string[]>(['bold'])
const density = ref('comfortable')
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">“Toggles” is two components under one name.</p>
      <p class="t-body body">
        Shipping one behaviour under both is the usual way this control goes wrong, so
        the difference is a prop with a semantic meaning rather than a styling flag.
      </p>
    </div>

    <section>
      <div class="sec-label">Four of them</div>
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
        Choosing one of several is a <code>radiogroup</code>: <em>one</em> tab stop, and
        the arrows both move and choose, because a radiogroup has no such thing as
        focused-but-unchosen. Turning several on independently is a group of buttons
        with <code>aria-pressed</code>: Tab reaches the group, the arrows move focus
        only, and Space chooses — which is the browser’s, since every option is a real
        button.
      </p>
      <p class="t-caption hint">
        Tab into the first group and press the arrows: the selection follows. Do the
        same in the third and it does not, until you press Space. That difference is
        the <code>type</code> prop, which is a semantic choice rather than a styling
        flag — <code>variant</code> is the styling one, and the two are independent.
      </p>
      <p class="t-caption hint">
        <strong>It is a control, not navigation</strong> — which is what separates it
        from <NuxtLink to="/molecules/tabs">Tabs</NuxtLink>, a component it can be made
        to look identical to. A tablist swaps what you are looking at; a radiogroup
        sets a value you will later submit. Choose by what it does, not by how it
        looks.
      </p>
      <p class="t-caption hint">
        Current: <strong>{{ view }}</strong> · <strong>{{ align }}</strong> ·
        <strong>{{ marks.join(', ') || 'none' }}</strong> · <strong>{{ density }}</strong>
      </p>
    </section>
  </div>
</template>

<style scoped>
.col { gap: var(--s-7); }
</style>
