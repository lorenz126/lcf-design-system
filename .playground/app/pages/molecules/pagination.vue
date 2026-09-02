<script setup lang="ts">
const page = ref(4)
useHead({ title: 'Pagination — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Page numbers, folded in the middle.</p>
      <p class="t-body body">
        The same rule <NuxtLink to="/molecules/breadcrumb">Breadcrumb</NuxtLink>
        uses: the ends are where you are and where you can get to, and the middle is
        the part you can afford to fold.
      </p>
    </div>

    <section>
      <div class="sec-label">Twelve pages</div>
      <div class="col">
        <UiPagination v-model="page" :total="24" />
        <UiPagination :model-value="1" :total="5" size="sm" />
        <UiPagination :model-value="12" :total="12" size="sm" />
      </div>
      <p class="t-caption hint">
        Page <strong>{{ page }}</strong> of 24. Walk it with the arrows: the row of
        numbers never changes width. If the run grew and shrank as you moved through
        it, the button under your pointer would change meaning between clicks — ends,
        ellipses and the current neighbourhood always take the same number of slots, so
        page 7 sits where page 6 was.
      </p>
      <p class="t-caption hint">
        An ellipsis is <em>not</em> a control. It is a gap in a sequence, so it is
        text: a button that jumps somewhere unstated is worse than no button. And these
        are buttons rather than links, which is a real limit — a pagination whose pages
        are URLs can be shared and reopened, but it needs the app to say what a page’s
        address is, and half the places this belongs have none to give.
      </p>
    </section>
  </div>
</template>
