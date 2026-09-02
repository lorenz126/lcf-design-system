<script setup lang="ts">
useHead({ title: 'Switch — Design Framework' })
const notify = ref(true)
const digest = ref(false)
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">A checkbox that takes effect immediately.</p>
      <p class="t-body body">
        That sentence is the whole difference, and it is a semantic one rather than a
        visual one. If the change only lands on Save, it is a
        <NuxtLink to="/atoms/checkbox">Checkbox</NuxtLink> and should look like one.
      </p>
    </div>

    <section>
      <div class="sec-label">States</div>
      <div class="stack">
        <UiSwitch v-model="notify" label="Push notifications"
                  help="Applies immediately." />
        <UiSwitch v-model="digest" label="Weekly digest" />
        <UiSwitch label="Unavailable" disabled />
      </div>
      <p class="t-caption hint">
        Toggle one and watch the knob — this is the only place the spring easing is
        used. A switch is a physical metaphor, so it overshoots slightly and settles.
        Everything else in the system uses <code>--ease-out</code>, because everything
        else is a state change rather than an object moving.
      </p>
      <p class="t-caption hint">
        Underneath it is still <code>&lt;input type="checkbox"&gt;</code>. The space
        bar, the label association and the form value all arrive without a line of
        keyboard code.
      </p>
    </section>
  </div>
</template>
