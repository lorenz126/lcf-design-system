<script setup lang="ts">
useHead({ title: 'Form — Design Framework' })

const form = reactive({ name: '', email: '', plan: '', notify: true, terms: false })
const errors = ref<Record<string, string>>({})
const busy = ref(false)
const done = ref(false)

const plans = [
  { value: 'solo', label: 'Solo' },
  { value: 'team', label: 'Team' },
  { value: 'enterprise', label: 'Enterprise' }
]

function validate() {
  const e: Record<string, string> = {}
  if (!form.name.trim()) e['f-name'] = 'Full name is required.'
  if (!form.email.includes('@')) e['f-email'] = 'Enter a valid email address.'
  if (!form.plan) e['f-plan'] = 'Choose a plan.'
  if (!form.terms) e['f-terms'] = 'You must accept the terms.'
  return e
}

async function submit() {
  errors.value = validate()
  if (Object.keys(errors.value).length) return
  busy.value = true
  await new Promise(r => setTimeout(r, 900))
  busy.value = false
  done.value = true
}
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Form adds no input of its own.</p>
      <p class="t-body body">
        What it owns is the part every form gets wrong alone: where errors are
        announced, what happens on submit, and what the whole thing does while it is
        busy. <code>novalidate</code> is deliberate — native validation shows one
        browser tooltip at a time, vanishes on blur, cannot be styled, and is announced
        inconsistently.
      </p>
    </div>

    <section>
      <div class="sec-label">Submit it empty</div>
      <UiCard class="form-card">
        <UiForm :errors="errors" :busy="busy" @submit="submit">
          <UiFormSection title="Your details"
                         description="We use this to set up the account.">
            <UiInput id="f-name" v-model="form.name" block label="Full name" required
                     placeholder="Jane Appleseed" :error="errors['f-name']" />
            <UiInput id="f-email" v-model="form.email" block label="Email" type="email"
                     required placeholder="jane@example.com" :error="errors['f-email']" />
          </UiFormSection>

          <UiFormSection title="Plan">
            <UiSelect id="f-plan" v-model="form.plan" block label="Choose a plan"
                      placeholder="Select…" :options="plans" required
                      :error="errors['f-plan']" />
            <UiSwitch v-model="form.notify" label="Email me about billing"
                      help="Applies immediately." />
            <UiCheckbox id="f-terms" v-model="form.terms" label="I accept the terms"
                        :error="errors['f-terms']" />
          </UiFormSection>

          <template #actions="{ busy: b }">
            <UiButton type="submit" :loading="b" @click="submit">
              {{ b ? 'Creating…' : 'Create account' }}
            </UiButton>
            <UiButton variant="plain" tone="neutral" :disabled="b">Cancel</UiButton>
          </template>
        </UiForm>

        <p v-if="done" class="t-small ok">Submitted.</p>
      </UiCard>

      <p class="t-caption hint">
        Press <strong>Create account</strong> with the form empty. The summary appears
        and <em>takes focus</em> — without that, errors render above a keyboard user’s
        position, are never announced, and the form just seems not to submit. Each entry
        links to its field, which is why <code>Input</code> now accepts an
        <code>id</code>: it generates one otherwise, and nothing outside could reference it.
      </p>
      <p class="t-caption hint">
        While busy, the whole body is a <code>disabled</code> fieldset — every control
        goes inert at once, without touching a single field.
      </p>
    </section>
  </div>
</template>

<style scoped>
.form-card { max-width: 460px; }
.ok { color: var(--success-text); margin: var(--s-6) 0 0; }
</style>
