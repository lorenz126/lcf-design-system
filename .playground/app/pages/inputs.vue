<script setup lang="ts">
import { Sun, SunDim, Volume1, Volume2 } from 'lucide-vue-next'
useHead({ title: 'Inputs — Design Framework' })
const a = ref(''); const b = ref('lorenz@dewa-id.com'); const c = ref('nope')
const find = ref('')
const notes = ref('')
const bio = ref('Two lines already, so the box has something to grow from.\nPress Enter a few times.')
const volume = ref(40)
const bass = ref(-2)
const fruit = [
  { id: 1, label: 'Apricot', note: 'Stone' },
  { id: 2, label: 'Apple', note: 'Pome' },
  { id: 3, label: 'Blackberry', note: 'Aggregate' },
  { id: 4, label: 'Blueberry', note: 'Berry' },
  { id: 5, label: 'Cherry', note: 'Stone' }
]
const found = computed(() => {
  const n = find.value.trim().toLowerCase()
  return n ? fruit.filter(f => f.label.toLowerCase().includes(n)) : []
})
const sizes = ['sm', 'md', 'lg'] as const
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Label, field and message are one component.</p>
      <p class="t-body body">
        Shipping the input bare and letting the caller wire up the label and error is
        where accessibility quietly breaks — the label ends up unassociated and the
        error is announced by nothing. Here the id is generated once and
        <code>for</code> / <code>aria-describedby</code> follow from it.
      </p>
    </div>

    <section>
      <div class="sec-label">Sizes</div>
      <div class="row">
        <UiInput v-for="s in sizes" :key="s" :size="s" :label="s" placeholder="Placeholder" />
      </div>
      <p class="t-caption hint">
        These use the same height scale as buttons. A button holds a centred label; a
        field holds a caret and has to be a comfortable I-beam target — watch whether
        sm and md hold up here.
      </p>
    </section>

    <section>
      <div class="sec-label">States</div>
      <div class="row">
        <UiInput v-model="a" label="Default" placeholder="Type here" />
        <UiInput v-model="b" label="With help" help="We only use this to sign you in." />
        <UiInput v-model="c" label="Invalid" error="That address is not valid." />
      </div>
      <div class="row">
        <UiInput label="Disabled" model-value="Locked" disabled />
        <UiInput label="Read only" model-value="Cannot change" readonly />
        <UiInput label="Required" placeholder="Needed" required />
      </div>
      <p class="t-caption hint">
        Tab through them. Focus is the same ring every other control uses, plus an
        accent border — the ring alone can vanish against some backgrounds.
      </p>
    </section>

    <section>
      <div class="sec-label">In a form</div>
      <form class="form" @submit.prevent>
        <UiInput block label="Full name" placeholder="Jane Appleseed" required />
        <UiInput block label="Email" type="email" placeholder="jane@example.com" required
                 help="We’ll send a confirmation here." />
        <UiInput block label="Password" type="password" placeholder="At least 12 characters" required />
        <div class="actions">
          <UiButton>Create account</UiButton>
          <UiButton variant="plain" tone="neutral">Cancel</UiButton>
        </div>
      </form>
    </section>

    <section>
      <div class="sec-label">Textarea</div>
      <div class="col">
        <UiTextarea
          v-model="bio"
          label="Description"
          help="It grows as you type, and stops at eight lines."
          :max-rows="8"
          block
        />
        <UiTextarea
          v-model="notes"
          label="Notes"
          placeholder="Say what happened"
          :max-length="120"
          block
        />
      </div>
      <p class="t-caption hint">
        Growing with the content is the only interesting part.
        <code>field-sizing: content</code> does it in one declaration and is not
        everywhere yet, so this takes the good path where it exists and measures
        <code>scrollHeight</code> where it does not — the same shape as the anchor
        positioning decision, and the fallback is small enough to delete later.
      </p>
      <p class="t-caption hint">
        The counter <strong>reports, it does not block</strong>. There is no
        <code>maxlength</code> attribute: silently refusing keystrokes at a limit is
        the same lie as refusing a kanban card over a WIP limit — the text does not
        get shorter, it gets finished somewhere else and pasted in.
      </p>
    </section>

    <section>
      <div class="sec-label">Slider</div>
      <div class="row sliders">
        <UiSlider v-model="volume" label="Volume" :ticks="[12.5, 25, 50]" show-value block>
          <template #leading><UiIcon :is="Volume1" size="sm" /></template>
          <template #trailing><UiIcon :is="Volume2" size="lg" /></template>
        </UiSlider>

        <!-- The size difference IS the meaning here: a small sun and a
             large one say dim and bright without a word between them. -->
        <UiSlider v-model="volume" label="Brightness" size="lg" block>
          <template #leading><UiIcon :is="Sun" size="sm" /></template>
          <template #trailing><UiIcon :is="Sun" :size="26" /></template>
        </UiSlider>
        <UiSlider
          v-model="bass"
          label="Bass"
          :min="-12"
          :max="12"
          :step="1"
          :format="(n: number) => `${n > 0 ? '+' : ''}${n} dB`"
          show-value
          block
        />
        <UiSlider
          v-model="volume"
          label="Upright"
          orientation="vertical"
          size="sm"
          :ticks="[25, 50, 75]"
          show-value
        />
      </div>
      <p class="t-caption hint">
        A real <code>&lt;input type="range"&gt;</code>: arrows, Home and End, Page Up
        and Page Down, touch dragging and the announcement all arrive free and correct.
        Try it with the mouse left alone.
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
        reading “40” for a volume tells you nothing. The second slider says
        <strong>“+3 dB”</strong>, because that is what the number means.
      </p>
      <p class="t-caption hint">
        The dots are <strong>marks, not stops</strong>. An eighth, a quarter and a half
        are worth pointing at; making the thumb land on them is what <code>step</code>
        is for, and a slider that pulls toward marks it was never told to honour is one
        that cannot be set to 51.
      </p>
      <p class="t-caption hint">
        They also decided a geometry question. The thumb travels <em>inside</em> the
        track rather than across it, so a mark at one half belongs at half of
        (width − thumb) plus half a thumb — not at half the width. The fill had the
        same error: invisible on a thin rail, obvious on a thick one with dots under
        it.
      </p>
    </section>

    <section>
      <div class="sec-label">SearchField</div>
      <div class="col">
        <UiSearchField
          v-model="find"
          size="lg"
          placeholder="Type a letter"
          :suggestions="found"
          :recent="[fruit[2], fruit[4]]"
          empty-text="Nothing like that here."
        />
        <UiSearchField size="md" placeholder="No suggestions configured" />
        <UiSearchField size="sm" placeholder="Filter" />
        <UiSearchField size="md" placeholder="Unavailable" disabled />
      </div>
      <p class="t-caption hint">
        Not a flag on Input, because it is not the same thing. Input is a
        <em>labelled form field</em>: it sits in a form, carries a label, help text
        and an error, and its border says “this is an editable box” next to text that
        is not. A search field lives in chrome, needs no label because the glyph is
        one, and is marked out by its ground rather than by an outline.
      </p>
      <p class="t-caption hint">
        Give the first field focus. Empty, it offers what you looked at last; with a
        query it offers matches. The arrows move a <em>highlight</em>, never the focus
        — that is what <code>aria-activedescendant</code> is for, and moving real
        focus into the list would send every keystroke after it somewhere other than
        the box you are typing in. Enter takes the highlighted row, or the best match
        if there is none.
      </p>
      <p class="t-caption hint">
        The field in the top bar of this page takes <strong>⌘K</strong>, and says so
        until you use it. The shortcut is opt-in on purpose: the key is claimed on the
        window, so two fields that both claimed it would fight over the same press —
        and there are five fields on this page.
      </p>
      <p class="t-caption hint">
        It renders what it is given and does not search. Ranking, fuzziness and where
        results come from are the application's business — and the recents are a prop
        for the same reason, since a control that quietly wrote to
        <code>localStorage</code> would be a surprise.
      </p>
      <p class="t-caption hint">
        Type something and press <strong>Escape</strong>. The first press closes the
        list, the second clears the field — one key, two steps, most specific first.
        The clear button is a real button so it is reachable without a mouse, and both routes go through the same
        <code>clear()</code> — which also puts focus back in the field, since clearing
        and then losing the box is how you end up typing into the page.
      </p>
    </section>
  </div>
</template>

<style scoped>
.intro { border-left: 2px solid var(--rule); padding-left: 20px; margin-bottom: 64px; }
.lede { margin: 0 0 10px; }
.body { margin: 0; color: var(--ink-2); max-width: 68ch; }
code { font-family: var(--font-mono); font-size: 11px; }
section { margin-bottom: 64px; }
.row { display: flex; flex-wrap: wrap; gap: var(--s-6); align-items: flex-start; margin-bottom: var(--s-6); }
.hint { color: var(--ink-3); margin: 14px 0 0; max-width: 68ch; line-height: 1.6; }
.sliders { align-items: flex-end; gap: var(--s-9); }
.col { display: flex; flex-direction: column; gap: var(--s-5); align-items: flex-start; max-width: 380px; }
.form { display: flex; flex-direction: column; gap: var(--s-6); max-width: 360px; }
.actions { display: flex; gap: var(--s-4); margin-top: var(--s-3); }
</style>
