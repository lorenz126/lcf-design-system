<script setup lang="ts">
useHead({ title: 'FormSection — Design Framework' })
const name = ref('')
const email = ref('')
const notify = ref(true)
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">A group of fields with a name.</p>
      <p class="t-body body">
        A real <code>&lt;fieldset&gt;</code> and <code>&lt;legend&gt;</code>, because
        that is what tells a screen reader these fields belong together — a heading
        and a border only tell an eye. It knows no data shape, so it stays a molecule;
        <NuxtLink to="/organisms/form">Form</NuxtLink> is the organism that
        orchestrates several of them.
      </p>
    </div>

    <section>
      <div class="sec-label">Two groups</div>
      <div class="sheet">
        <UiFormSection title="Your details" description="We use this to set up the account.">
          <UiInput v-model="name" block label="Full name" placeholder="Jane Appleseed" />
          <UiInput v-model="email" block label="Email" type="email" placeholder="jane@example.com" />
        </UiFormSection>

        <UiFormSection title="Preferences">
          <UiSwitch v-model="notify" label="Product updates" help="Applies immediately." />
        </UiFormSection>
      </div>
      <p class="t-caption hint">
        The description is wired to the fieldset with
        <code>aria-describedby</code> rather than left as a paragraph that happens to
        sit above it. A sentence explaining a group is only explaining it if the group
        points at it.
      </p>
      <p class="t-caption hint">
        The spacing between groups is larger than the spacing inside one, and that is
        the entire visual job: a form where both gaps are equal is a list of fields
        rather than a set of related decisions.
      </p>
    </section>
  </div>
</template>

<style scoped>
.sheet { max-width: 460px; display: flex; flex-direction: column; gap: var(--s-9); }
</style>
