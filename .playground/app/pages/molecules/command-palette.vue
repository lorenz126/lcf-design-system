<script setup lang="ts">
import { Info, Sparkles } from 'lucide-vue-next'
const palette = useCommandPalette()
const toast = useToast()
const ran = ref('nothing yet')
let n = 0

/* Registered by THIS PAGE, so they exist only while it does. Open the
   palette here (⌘J), then go to another page and open it again: they
   are gone, and nothing had to remember to remove them. */
useCommands(() => [
  {
    id: 'cp-toast',
    label: 'Raise a toast',
    group: 'This page',
    icon: Info,
    keywords: ['notification', 'notify'],
    run: () => toast.success(`Raised from the palette (${++n})`)
  },
  {
    id: 'cp-mark',
    label: 'Leave a mark on this page',
    group: 'This page',
    icon: Sparkles,
    keywords: ['write', 'state'],
    /* Something visible, on purpose: a demonstration command that set a
       ref nothing rendered would be a control that does nothing, which
       is the one thing this framework will not ship. */
    run: () => { ran.value = new Date().toLocaleTimeString() }
  }
])
useHead({ title: 'CommandPalette — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Everything the app can do, by name.</p>
      <p class="t-body body">
        The palette was the easy half. What was missing is the
        <strong>registry</strong> — what a command is, where it comes from, and how it
        disappears when its page does.
      </p>
    </div>

    <section>
      <div class="sec-label">Try it</div>
      <div class="row">
        <UiButton variant="secondary" @click="palette.show()">Open the palette</UiButton>
        <span class="t-caption hint">…or press ⌘J.</span>
      </div>
      <p class="t-caption hint">
        Last mark left by a command from this page: <strong>{{ ran }}</strong>
      </p>
      <p class="t-caption hint">
        <strong>The palette was the easy half.</strong> SearchField already had the
        combobox model and the suggestion list; a <code>&lt;dialog&gt;</code> already had
        the top layer and the focus trap. What was missing is the registry — what a
        command <em>is</em>, where it comes from, and
        <strong>how it disappears when its page does.</strong>
      </p>
      <p class="t-caption hint">
        Two of the commands in there — <em>Raise a toast</em> and
        <em>Leave a mark on this page</em> — are registered by <em>this page</em>. Open the
        palette, then go to another page and open it again: they are gone, and nothing
        had to remember to remove them. Registration is bound to the calling effect
        scope, so unmounting is the removal.
      </p>
      <p class="t-caption hint">
        <strong>It ranks, and SearchField refuses to</strong> — which looks like an
        inconsistency and is the opposite. SearchField renders what it is given because
        the results are the application’s; it cannot know whether a hit on a title beats
        a hit on a body. This one owns its corpus. A component should rank exactly when
        it knows what it is ranking.
      </p>
      <p class="t-caption hint">
        It is on <strong>⌘J here and not ⌘K</strong>, because the sidebar search already
        owns ⌘K. Two things cannot have one key, and the framework refuses to arbitrate:
        whoever mounts them decides.
      </p>
    </section>
  </div>
</template>
