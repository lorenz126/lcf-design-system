<script setup lang="ts">
useHead({ title: 'Inputs — Design Framework' })
const a = ref(''); const b = ref('lorenz@dewa-id.com'); const c = ref('nope')
const sizes = ['sm', 'md', 'lg'] as const
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Label, field and message are one component.</p>
      <p class="t-body body">
        Shipping the input bare and letting the caller wire up the label and error is
        where accessibility quietly breaks — the label ends up unassociated and the
        error is announced by nothing. Here the id is generated once and
        <code>for</code> / <code>aria-describedby</code> follow from it.
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
.intro { border-left: 2px solid var(--rule); padding-left: 20px; margin-bottom: 64px; }
.lede { margin: 0 0 10px; }
.body { margin: 0; color: var(--ink-2); max-width: 68ch; }
code { font-family: var(--font-mono); font-size: 11px; }
section { margin-bottom: 64px; }
.row { display: flex; flex-wrap: wrap; gap: var(--s-6); align-items: flex-start; margin-bottom: var(--s-6); }
.hint { color: var(--ink-3); margin: 14px 0 0; max-width: 68ch; line-height: 1.6; }
.form { display: flex; flex-direction: column; gap: var(--s-6); max-width: 360px; }
.actions { display: flex; gap: var(--s-4); margin-top: var(--s-3); }
</style>
