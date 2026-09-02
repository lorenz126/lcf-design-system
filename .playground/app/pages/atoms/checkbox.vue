<script setup lang="ts">
useHead({ title: 'Checkbox — Design Framework' })
const agree = ref(true)
const partial = ref(false)
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">A real checkbox, restyled — not rebuilt.</p>
      <p class="t-body body">
        Every control here is the real <code>&lt;input&gt;</code> with
        <code>appearance: none</code>. That keeps the space bar, arrow-key navigation,
        form submission, label association and screen reader semantics for free. A
        rebuilt control has to earn all five back, and usually gets one of them wrong.
      </p>
    </div>

    <section>
      <div class="sec-label">States</div>
      <div class="stack">
        <UiCheckbox v-model="agree" label="Send me product updates" />
        <UiCheckbox v-model="partial" indeterminate label="Select all"
                    help="Some items in this group are selected." />
        <UiCheckbox label="Unavailable option" disabled />
        <UiCheckbox model-value label="Checked and disabled" disabled />
      </div>
      <p class="t-caption hint">
        Indeterminate is a <em>property</em>, not an attribute — it cannot be written
        in HTML at all, so it is set on the element. It is also not a third value: the
        box still reports checked or unchecked, and “some of the group” is a display
        state over the top of one of them.
      </p>
      <p class="t-caption hint">
        A checkbox takes effect on <strong>Save</strong>. If the change lands
        immediately it is a <NuxtLink to="/atoms/switch">Switch</NuxtLink>, and should
        look like one.
      </p>
    </section>
  </div>
</template>
