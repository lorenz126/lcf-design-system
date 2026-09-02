<script setup lang="ts">
useHead({ title: 'Progress — Design Framework' })
const pct = ref(38)
const busy = ref(true)
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">A real <code>&lt;progress&gt;</code>, and the absence of a value.</p>
      <p class="t-body body">
        It was already written inside
        <NuxtLink to="/organisms/attachments">Attachments</NuxtLink>. Lifting it out
        added the one state a file row does not need and everything else does.
      </p>
    </div>

    <section>
      <div class="sec-label">Known, and unknown</div>
      <div class="col">
        <UiProgress :value="pct" label="Restoring" show-value />
        <UiProgress :value="pct" size="lg" tone="green" label="Restoring" show-value />
        <UiProgress v-if="busy" label="Working" />
        <div class="row">
          <UiButton size="sm" variant="outline" tone="neutral" @click="pct = Math.max(0, pct - 15)">−15</UiButton>
          <UiButton size="sm" variant="outline" tone="neutral" @click="pct = Math.min(100, pct + 15)">+15</UiButton>
          <UiButton size="sm" variant="plain" tone="neutral" @click="busy = !busy">
            {{ busy ? 'Stop the indeterminate one' : 'Start it' }}
          </UiButton>
        </div>
      </div>
      <p class="t-caption hint">
        Attachments had this inside it and now uses it. A real
        <code>&lt;progress&gt;</code>: the value is announced without any aria of ours,
        and the platform draws something sensible if the styling never arrives.
      </p>
      <p class="t-caption hint">
        <strong>Indeterminate is the absence of a value</strong>, not a flag — omit
        <code>value</code> and the element is natively indeterminate, so there is no
        second state to keep in step. What it costs is the paint: an indeterminate
        <code>&lt;progress&gt;</code> cannot be styled in WebKit, so the rail
        underneath carries the sweep and the element on top shows nothing.
      </p>
      <p class="t-caption hint">
        And reduced motion <em>slows</em> the sweep rather than stopping it, for the
        same reason as the spinner: a stopped indeterminate bar is not a finished one,
        it is a frozen one.
      </p>
    </section>
  </div>
</template>

<style scoped>
.col { max-width: 520px; gap: var(--s-7); }
</style>
