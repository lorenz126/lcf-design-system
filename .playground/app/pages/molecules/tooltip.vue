<script setup lang="ts">
import { Info } from 'lucide-vue-next'
useHead({ title: 'Tooltip — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Describes; never the only place something is said.</p>
      <p class="t-body body">
        The browser already built most of this. It renders in the
        <strong>top layer</strong> via the popover attribute, so nothing can clip it
        with an ancestor’s overflow and it needs no z-index at all.
      </p>
    </div>

    <section>
      <div class="sec-label">On a button, and on a glyph</div>
      <div class="row">
        <UiTooltip text="Deletes the project and everything in it.">
          <UiButton tone="red" variant="tinted">Delete</UiButton>
        </UiTooltip>
        <UiTooltip text="Below instead of above." placement="bottom">
          <UiButton variant="outline" tone="neutral">Placed below</UiButton>
        </UiTooltip>
        <UiTooltip text="Appears at once when focused by keyboard.">
          <UiButton variant="plain" icon-only aria-label="More information">
            <UiIcon :is="Info" />
          </UiButton>
        </UiTooltip>
      </div>
      <p class="t-caption hint">
        Hover waits 400ms; keyboard focus shows it at once, because you already
        committed by tabbing there. A tooltip is unreachable by touch and adds nothing
        for a screen reader beyond the trigger’s own name — so what it says must never
        be the only place that information exists.
      </p>
    </section>
  </div>
</template>
