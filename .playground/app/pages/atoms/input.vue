<script setup lang="ts">
useHead({ title: 'Input — Design Framework' })
const a = ref(''); const b = ref('lorenz@dewa-id.com'); const c = ref('nope')
const sizes = ['sm', 'md', 'lg'] as const
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">A labelled form field, and the label comes with it.</p>
      <p class="t-body body">
        Input is the box; <NuxtLink to="/atoms/field">Field</NuxtLink> is the label,
        the help text, the error and the id that ties them together. They ship as one
        thing because letting the caller wire up the label is where accessibility
        quietly breaks.
      </p>
    </div>

    <section>
      <div class="sec-label">Sizes</div>
      <div class="row">
        <UiInput v-for="s in sizes" :key="s" :size="s" :label="s" placeholder="Placeholder" />
      </div>
      <p class="t-caption hint">
        These use the same height scale as buttons. A button holds a centred label; a
        field holds a caret and has to be a comfortable I-beam target — watch whether
        sm and md hold up here.
      </p>
    </section>

    <section>
      <div class="sec-label">States</div>
      <div class="row">
        <UiInput v-model="a" label="Default" placeholder="Type here" />
        <UiInput v-model="b" label="With help" help="We only use this to sign you in." />
        <UiInput v-model="c" label="Invalid" error="That address is not valid." />
      </div>
      <div class="row">
        <UiInput label="Disabled" model-value="Locked" disabled />
        <UiInput label="Read only" model-value="Cannot change" readonly />
        <UiInput label="Required" placeholder="Needed" required />
      </div>
      <p class="t-caption hint">
        Tab through them. Focus is the same ring every other control uses, plus an
        accent border — the ring alone can vanish against some backgrounds.
      </p>
    </section>

    <section>
      <div class="sec-label">In a form</div>
      <form class="form" @submit.prevent>
        <UiInput block label="Full name" placeholder="Jane Appleseed" required />
        <UiInput block label="Email" type="email" placeholder="jane@example.com" required
                 help="We’ll send a confirmation here." />
        <UiInput block label="Password" type="password" placeholder="At least 12 characters" required />
        <div class="actions">
          <UiButton>Create account</UiButton>
          <UiButton variant="plain" tone="neutral">Cancel</UiButton>
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.row { align-items: flex-start; margin-bottom: var(--s-6); }
.form { display: flex; flex-direction: column; gap: var(--s-6); max-width: 360px; }
.actions { display: flex; gap: var(--s-4); margin-top: var(--s-3); }
</style>
