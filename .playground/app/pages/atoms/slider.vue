<script setup lang="ts">
import { Sun, Volume1, Volume2 } from 'lucide-vue-next'
useHead({ title: 'Slider — Design Framework' })
const volume = ref(40)
const bass = ref(-2)
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">One value along a range, on a real range input.</p>
      <p class="t-body body">
        Arrows, Home and End, Page Up and Page Down, touch dragging and the
        announcement all arrive free and correct. What had to be built is the shape,
        the marks, and the difference between what the pointer gets and what the
        keyboard gets.
      </p>
    </div>

    <section>
      <div class="sec-label">Four of them</div>
      <div class="row sliders">
        <UiSlider
          v-model="volume"
          label="Volume"
          :precision="0.1"
          :ticks="[25, 50, 75]"
          show-value
          block
        >
          <template #leading><UiIcon :is="Volume1" size="sm" /></template>
          <template #trailing><UiIcon :is="Volume2" size="lg" /></template>
        </UiSlider>

        <!-- The size difference IS the meaning here: a small sun and a
             large one say dim and bright without a word between them. -->
        <UiSlider v-model="volume" label="Brightness" size="lg" :precision="0.1" block>
          <template #leading><UiIcon :is="Sun" size="sm" /></template>
          <template #trailing><UiIcon :is="Sun" size="lg" /></template>
        </UiSlider>
        <UiSlider
          v-model="bass"
          label="Bass"
          :min="-12"
          :max="12"
          :step="1"
          :ticks="[0]"
          :snap="1"
          :format="(n: number) => `${n > 0 ? '+' : ''}${n} dB`"
          show-value
          block
        />
        <UiSlider
          v-model="volume"
          label="Upright"
          orientation="vertical"
          :precision="0.1"
          size="sm"
          :ticks="[25, 50, 75]"
          show-value
        />
      </div>
      <p class="t-caption hint">
        Try it with the mouse left alone — the whole keyboard model is the browser’s.
      </p>
      <p class="t-caption hint">
        <strong>A range with two thumbs cannot be this component.</strong> No native
        control carries two values, so a second thumb means rebuilding the whole
        keyboard model by hand on pointer capture. That is a different component
        wearing the same clothes, and saying so is better than growing into it one
        prop at a time.
      </p>
      <p class="t-caption hint">
        <code>aria-valuetext</code> matters more here than anywhere: a screen reader
        reading “40” for a volume tells you nothing. Bass says <strong>“+3 dB”</strong>,
        because that is what the number means.
      </p>
    </section>

    <section>
      <div class="sec-label">Marks, and when they catch</div>
      <p class="t-caption hint">
        The dots are <strong>marks until you say otherwise</strong>. A slider that
        pulled toward marks it was never told to honour would be one that cannot be set
        to 51, so <code>snap</code> is a prop rather than a consequence of having marks
        at all. Bass has it, on a single mark at zero; drag its handle past 0 dB and
        feel it catch. Volume’s quarters do not catch, and should not — <strong>a mark
        is a detent or a gradation</strong>, and only the first is a place you want
        back.
      </p>
      <p class="t-caption hint">
        <strong>And it catches the pointer only.</strong> A drag is imprecise and a
        magnet helps it; an arrow key is exact and a magnet lies about it — pressing
        right at 24 and landing on 25 because a mark was nearby is a control reporting
        something you did not do. Tab to the handle and walk it through a mark with the
        arrows: it steps by one the whole way.
      </p>
      <p class="t-caption hint">
        The marks also decided a geometry question. The thumb travels <em>inside</em>
        the track rather than across it, so a mark at one half belongs at half of
        (width − thumb) plus half a thumb — not at half the width. The fill had the
        same error: invisible on a thin rail, obvious on a thick one with dots under it.
      </p>
    </section>

    <section>
      <div class="sec-label">Two grids, one control</div>
      <p class="t-caption hint">
        <code>step</code> was doing three jobs at once — what an arrow key moves by,
        what the number reads as, and where the thumb may land. Only the third wanted
        to be finer: a hundred positions over 352 pixels is a jump of three and a half,
        and you can see it. So <code>precision</code> gives the <strong>pointer</strong>
        a finer grid and leaves the keyboard on the coarse one, by swapping the
        element’s own step as the interaction changes hands.
      </p>
      <p class="t-caption hint">
        Which means the value really does hold 63.4 while the field reads “63 percent”,
        and a moving key puts it back on the coarse grid on the way in. Bass keeps
        <code>step: 1</code> and no precision at all — twenty-four whole decibels
        should move in twenty-four whole jumps, because there the steps <em>are</em> the
        meaning.
      </p>
    </section>
  </div>
</template>

<style scoped>
.sliders { align-items: flex-end; gap: var(--s-9); }
</style>
