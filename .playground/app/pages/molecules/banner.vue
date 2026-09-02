<script setup lang="ts">
const showBanner = ref(true)
useHead({ title: 'Banner — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">What the page says about itself.</p>
      <p class="t-body body">
        The distinction from <NuxtLink to="/molecules/toaster">Toast</NuxtLink> is
        the whole reason both exist. A toast is what <em>happened</em>: it arrives, it
        is read, it leaves. A banner is what <em>is</em> — this project is archived,
        this form is read-only — and it has no timer because the condition it describes
        has none.
      </p>
    </div>

    <section>
      <div class="sec-label">Tones</div>
      <div class="col">
        <UiBanner
          tone="orange"
          title="This project is archived"
          description="You can read everything in it. Nothing can be changed until it is restored."
        >
          <template #action>
            <UiButton size="sm" variant="outline" tone="neutral">Restore</UiButton>
          </template>
        </UiBanner>

        <UiBanner tone="blue" title="Two people are editing this page" />

        <UiBanner
          v-if="showBanner"
          tone="red"
          title="The last sync failed"
          description="Changes are still here and will be sent again when the connection returns."
          dismissible
          @dismiss="showBanner = false"
        />

        <UiBanner title="Read-only" description="You have view access to this space." />
      </div>
      <p class="t-caption hint">
        The difference from a toast is the whole reason both exist. A toast is what
        <em>happened</em>: it arrives, it is read, it leaves. A banner is what
        <em>is</em> — archived, over the limit, read-only. It has no timer because the
        condition it describes has none, and it sits <em>in</em> the layout rather than
        over it, which is why it carries a border and not a shadow.
      </p>
      <p class="t-caption hint">
        <strong>Which means it is usually not a live region.</strong> A banner that is
        on the page when the page loads has nothing to announce — it is read in order,
        like everything else — and marking it live would only add noise on every
        re-render. <code>announce</code> is for the other case, where one appears in
        response to something just done.
      </p>
      <p class="t-caption hint">
        Tint ground, <strong>full-strength text</strong>, coloured mark. The ground
        already says the tone; colouring the words as well is the same thing said
        twice, bought with legibility — accent-on-accent-tint fell under AA in dark
        mode twice before. The icon keeps the colour because it is a graphic, held to
        3:1 rather than 4.5.
      </p>
    </section>
  </div>
</template>
