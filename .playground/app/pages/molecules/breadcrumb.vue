<script setup lang="ts">
import { Home } from 'lucide-vue-next'
const trail = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Projects', to: '/' },
  { label: 'Design Framework', to: '/' },
  { label: 'Components', to: '/' },
  { label: 'Organisms', to: '/' },
  { label: 'Sidebar' }
]
useHead({ title: 'Breadcrumb — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Six steps, folded to four.</p>
      <p class="t-body body">
        The middle collapses, not the end — the first crumb is the root and the last
        two are where you are and what you are inside. Everything between is the part
        you can afford to fold.
      </p>
    </div>

    <section>
      <div class="sec-label">Folded and whole</div>
      <div class="col">
        <UiBreadcrumb :items="trail" />
        <UiBreadcrumb :items="trail.slice(0, 3)" />
      </div>
      <p class="t-caption hint">
        Six steps, folded to four. <strong>The middle collapses, not the end</strong> —
        the first crumb is the root and the last two are where you are and what you are
        inside; everything between is the part you can afford to fold. Press the
        ellipsis: it is a real button that unfolds, because a fold you cannot open is a
        trail with a hole in it.
      </p>
      <p class="t-caption hint">
        The last crumb is <em>not</em> a link. It is where you already are, and a link
        to the current page is a control that does nothing. The chevrons are hidden
        from assistive technology: a screen reader announces “list, 4 items” and the
        nesting is carried by the order, so reading out three chevrons adds nothing but
        three chevrons.
      </p>
    </section>
  </div>
</template>

<style scoped>
.col { gap: var(--s-5); }
</style>
