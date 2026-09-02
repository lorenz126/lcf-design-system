<script setup lang="ts">
useHead({ title: 'DocLayout — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Prose with a table of contents beside it.</p>
      <p class="t-body body">
        Two slots and a width. The interesting part is
        <NuxtLink to="/organisms/toc">Toc</NuxtLink>, which has to know where you are
        in a document that is scrolling.
      </p>
    </div>

    <section>
      <div class="sec-label">A document</div>
      <p class="t-caption hint">
        Used for real on the <NuxtLink to="/docs">Docs</NuxtLink> page. The aside is
        declared <em>after</em> the article in the DOM and placed by grid, so a
        keyboard or screen reader reaches the content before the contents — a table
        of contents read out first is a list of links to nothing yet.
      </p>
    </section>
  </div>
</template>

<style scoped>
/* A stand-in for a browser window, so a full-page template can be seen
   in the middle of a documentation page. */
.frame {
  height: 420px;
  border: 1px solid var(--rule);
  border-radius: var(--r-lg);
  overflow: clip;
}
</style>
