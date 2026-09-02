<script setup lang="ts">
useHead({ title: 'Divider — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">A rule, and the argument about whether it should be there.</p>
      <p class="t-body body">
        Most dividers are a substitute for spacing. This one exists for the cases
        where the gap alone does not say “different kind of thing”.
      </p>
    </div>

    <section>
      <div class="sec-label">Both axes</div>
      <div class="dv">
        <p class="t-small">A block of content.</p>
        <UiDivider />
        <p class="t-small">Another, separated by a rule that belongs to neither.</p>
        <UiDivider>or</UiDivider>
        <p class="t-small">A labelled divider is a div, not an hr — a horizontal rule
          cannot have content.</p>
        <UiDivider spacing="lg" />
        <div class="dvrow">
          <span class="t-small">Toolbar</span>
          <UiDivider orientation="vertical" spacing="sm" />
          <span class="t-small">groups</span>
          <UiDivider orientation="vertical" spacing="sm" />
          <span class="t-small">divided</span>
        </div>
      </div>
      <p class="t-caption hint">
        A separator is not a border. A border belongs to a box and says where the box
        ends; a divider is a thing in the flow saying the blocks either side of it are
        not the same block. That is why it carries <code>role="separator"</code> and
        its own spacing — and why Menu and Sidebar both stopped drawing their own.
      </p>
    </section>
  </div>
</template>

<style scoped>
.dv { max-width: 460px; }
.dvrow { display: flex; align-items: center; gap: var(--s-5); }
</style>
