<script setup lang="ts">
useHead({ title: 'Radio — Design Framework' })
const plan = ref('team')
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">One of several, and the browser moves between them.</p>
      <p class="t-body body">
        Every control here is the real <code>&lt;input&gt;</code> with
        <code>appearance: none</code>. That keeps the space bar, arrow-key navigation,
        form submission, label association and screen reader semantics for free. A
        rebuilt control has to earn all five back, and usually gets one of them wrong.
      </p>
    </div>

    <section>
      <div class="sec-label">A group</div>
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
      <p class="t-caption hint">
        A group of radios that all look like buttons is a
        <NuxtLink to="/molecules/toggle-group">ToggleGroup</NuxtLink>. Same semantics,
        different clothes — and there the roving tabindex has to be built, because the
        options are buttons rather than inputs sharing a name.
      </p>
    </section>
  </div>
</template>

<style scoped>
.group { border: 0; margin: 0; padding: 0; }
.legend { padding: 0 0 var(--s-5); color: var(--ink-2); font-weight: var(--w-medium); }
</style>
