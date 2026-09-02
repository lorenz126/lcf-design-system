<script setup lang="ts">
useHead({ title: 'Field — Design Framework' })
const a = ref('')
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
      <div class="sec-label">What it wraps</div>
      <div class="col">
        <UiInput v-model="a" label="Input" help="Help sits under the control." block />
        <UiTextarea label="Textarea" help="The same label, the same message slot." block />
        <UiSlider label="Slider" :model-value="40" show-value block />
        <UiToggleGroup
          field-label="ToggleGroup"
          help="Four callers, one wrapper."
          :options="[{ value: 'a', label: 'One' }, { value: 'b', label: 'Two' }]"
          model-value="a"
        />
      </div>
      <p class="t-caption hint">
        <strong>It is an atom, and that was decided in the building.</strong> Three of
        its four callers are atoms — Input, Textarea and Slider — and an atom may not
        use a molecule, so a Field one tier up would have meant each of them keeping
        its own copy of the label wiring. That is the rule
        <code>check-layers</code> enforces, arriving at an answer nobody had to
        arbitrate.
      </p>
    </section>

    <section>
      <div class="sec-label">The message slot is one slot</div>
      <div class="col">
        <UiInput label="Help" help="We only use this to sign you in." block />
        <UiInput label="Error" error="That address is not valid." block />
        <UiInput label="Both" help="This is hidden while the error stands." error="Required." block />
      </div>
      <p class="t-caption hint">
        Help and error share the line rather than stacking, and the error wins. Two
        messages under one field is two answers to “what do I do now”, and the one
        that matters is the one that stops you.
      </p>
    </section>

    <section>
      <div class="sec-label">Size sets three things</div>
      <div class="row">
        <UiInput size="sm" label="sm" placeholder="Placeholder" />
        <UiInput size="md" label="md" placeholder="Placeholder" />
        <UiInput size="lg" label="lg" placeholder="Placeholder" />
      </div>
      <p class="t-caption hint">
        Field publishes <code>--fld-h</code>, <code>--fld-fs</code> and
        <code>--fld-pad</code> for whatever sits in it, so a control never has to
        carry its own size table. A control used bare still works — the custom
        properties have fallbacks.
      </p>
    </section>
  </div>
</template>

<style scoped>
.col { max-width: 380px; gap: var(--s-6); }
</style>
