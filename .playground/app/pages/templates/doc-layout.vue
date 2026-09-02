<script setup lang="ts">
useHead({ title: 'DocLayout — Design Framework' })
const article = useTemplateRef<HTMLElement>('article')
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
      <div class="frame">
        <UiDocLayout>
          <div ref="article">
            <UiProse size="sm">
              <h2 id="dl-one">The aside comes second</h2>
              <p>
                Scroll this panel. The heading you are next to lights up in the
                column beside it, and the column itself does not move.
              </p>
              <h2 id="dl-two">Why the order matters</h2>
              <p>
                The aside is declared <em>after</em> the article in the DOM and
                placed by grid, so a keyboard or a screen reader reaches the content
                before the contents. A table of contents read out first is a list of
                links to nothing yet.
              </p>
              <h2 id="dl-three">One width, not two</h2>
              <p>
                The measure is the article’s, and the aside takes what is left. A
                layout that gave both a share would make the prose narrower every
                time a heading got longer.
              </p>
              <p>
                There is more here than fits, on purpose, so the scrolling is
                visible rather than described.
              </p>
              <h2 id="dl-four">And below the breakpoint</h2>
              <p>
                The aside goes away rather than stacking above the article. A table
                of contents you have to scroll past to reach the document is worse
                than no table of contents.
              </p>
            </UiProse>
          </div>
          <template #aside><UiToc :target="article" /></template>
        </UiDocLayout>
      </div>
      <p class="t-caption hint">
        The aside is declared <em>after</em> the article in the DOM and placed by
        grid, so a keyboard or screen reader reaches the content before the contents
        — a table of contents read out first is a list of links to nothing yet.
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
  padding: var(--s-7);
}
</style>
