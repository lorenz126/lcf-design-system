<script setup lang="ts">
useHead({ title: 'Avatar — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">The colour comes from the name, not from configuration.</p>
      <p class="t-body body">
        So the same workspace is the same colour on every screen it appears on, and
        nobody maintains a map of thing-to-colour.
      </p>
    </div>

    <section>
      <div class="sec-label">People and things</div>
      <div class="row">
        <UiAvatar name="Anna Weber" size="lg" label="Anna Weber" />
        <UiAvatar name="Tom Krause" size="lg" label="Tom Krause" />
        <UiAvatar name="Lorenz Flechtenmacher" size="lg" label="Lorenz Flechtenmacher" />
        <span class="gap" />
        <UiAvatar name="dewa commercial" shape="square" size="lg" label="dewa commercial" />
        <UiAvatar name="Development" shape="square" size="lg" label="Development" />
        <UiAvatar text="🛰" shape="square" size="lg" tone="orange" label="Satellites" />
        <span class="gap" />
        <UiAvatar name="Anna Weber" size="sm" />
        <UiAvatar name="Anna Weber" size="md" />
        <UiAvatar name="Anna Weber" size="lg" />
      </div>
      <p class="t-caption hint">
        Circles are people, squares are things. Both need a mark, and if they look
        alike the sidebar stops saying which is which.
      </p>
      <p class="t-caption hint">
        The colour is <strong>derived from the name</strong>, not configured — so the
        same workspace is the same colour on every screen it appears on and nobody
        maintains a map of thing-to-colour. Pass a tone only when the colour itself
        means something.
      </p>
    </section>
  </div>
</template>

<style scoped>
.row { gap: var(--s-5); }
</style>
