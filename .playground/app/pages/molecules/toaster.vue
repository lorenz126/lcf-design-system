<script setup lang="ts">
const toast = useToast()
let n = 0
useHead({ title: 'Toaster — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">What happened, said once and then gone.</p>
      <p class="t-body body">
        Mounted once near the root; everything else calls <code>useToast()</code>.
        A toast is what <em>happened</em> —
        <NuxtLink to="/molecules/banner">Banner</NuxtLink> is what <em>is</em>, and
        that is why both exist.
      </p>
    </div>

    <section>
      <div class="sec-label">Toast</div>
      <div class="row">
        <UiButton variant="outline" tone="neutral" @click="toast.show(`Saved (${++n})`)">
          Plain
        </UiButton>
        <UiButton variant="outline" tone="neutral" @click="toast.success({ title: 'Project created', description: 'It is in the sidebar under Recent.' })">
          Success
        </UiButton>
        <UiButton variant="outline" tone="neutral" @click="toast.error({ title: 'Could not reach the server', description: 'The change is still here; try again in a moment.' })">
          Error
        </UiButton>
        <UiButton
          variant="outline"
          tone="neutral"
          @click="toast.show({ title: 'Issue archived', tone: 'blue', action: { label: 'Undo', onClick: () => toast.success('Restored') } })"
        >With an action</UiButton>
        <UiButton variant="plain" tone="neutral" @click="toast.clear()">Clear all</UiButton>
      </div>

      <p class="t-caption hint">
        Raise a few and then <strong>hover the stack</strong>: every timer stops, not
        just the one under the pointer, because reading the second message is a reason
        to keep the first. Otherwise a toast is a message you can lose by reading it
        slowly. Focus does the same, so a keyboard reaches the dismiss button before it
        vanishes.
      </p>
      <p class="t-caption hint">
        <strong>Two regions, not one with a switch.</strong>
        <code>role="status"</code> waits for a pause before speaking;
        <code>role="alert"</code> interrupts. Which a message deserves is decided when
        it is written, and a single region cannot be both — so errors land in one and
        everything else in the other. Both are mounted empty and stay mounted, because
        a live region that arrives already holding text is usually not announced at
        all.
      </p>
      <p class="t-caption hint">
        The action is a shortcut, <em>never the only route</em>. A toast disappears, so
        anything that can only be done from here is a thing you can miss by looking
        away. Undo belongs in the menu as well.
      </p>
    </section>
  </div>
</template>
