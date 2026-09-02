<script setup lang="ts">
useHead({ title: 'Select — Design Framework' })
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
      <p class="t-lead lede">The real <code>&lt;select&gt;</code>, and a molecule because of it.</p>
      <p class="t-body body">
        It uses <NuxtLink to="/atoms/icon">Icon</NuxtLink> for the chevron, and an atom
        may not use another component — so Select sits one tier up. That felt wrong at
        first and is exactly the rule <code>check-layers</code> exists to enforce
        mechanically rather than by feel.
      </p>
    </div>

    <section>
      <div class="sec-label">Sizes and states</div>
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
  </div>
</template>

<style scoped>
.row { align-items: flex-start; margin-bottom: var(--s-6); }
</style>
