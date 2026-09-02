<script setup lang="ts">
useHead({ title: 'DatePicker — Design Framework' })
const due = ref<string | null>(null)
const dueUS = ref<string | null>(null)
const bounded = ref<string | null>(null)
const y = new Date().getFullYear()
const m = String(new Date().getMonth() + 1).padStart(2, '0')
const day = (d: number) => `${y}-${m}-${String(d).padStart(2, '0')}`
const events = [
  { date: day(4), label: 'Design review', tone: 'blue' as const },
  { date: day(4), label: 'Retro', tone: 'purple' as const },
  { date: day(11), label: 'Release', tone: 'green' as const },
  { date: day(18), label: 'On call', tone: 'orange' as const },
  { date: day(18), label: 'Incident review', tone: 'red' as const },
  { date: day(18), label: 'Postmortem', tone: 'yellow' as const },
  { date: day(25), label: 'Offsite', tone: 'blue' as const }
]
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">A date you can type, and a month you can look at.</p>
      <p class="t-body body">
        It pairs a text field with
        <NuxtLink to="/organisms/calendar">Calendar</NuxtLink>, which is an organism, so
        this is one too. The hard part was never the pairing — it was the parsing.
      </p>
    </div>

    <section>
      <div class="sec-label">Three locales, one value</div>
      <div class="row pickers">
        <UiDatePicker v-model="due" label="Due date" locale="en-GB" :events="events" block />
        <UiDatePicker v-model="dueUS" label="Due date, en-US" locale="en-US" block />
        <UiDatePicker
          v-model="bounded"
          label="This month only"
          :min="day(1)"
          :max="day(28)"
          help="Type it, or open the grid."
          block
        />
      </div>
      <p class="t-caption hint">
        <strong>03/04/2025 is two different days.</strong> The third of April here, the
        fourth of March in the field beside it — and the value both of them report is the
        same ISO string. What a consumer stores never depends on where its user lives;
        the text in the box is the locale’s business, the value is not.
      </p>
      <p class="t-caption hint">
        <strong>Type “3/4” and click away.</strong> The field says 03/04/{{ y }}. That is
        the whole teaching mechanism — nobody has to be told the order, and the reformat
        is the confirmation of what was understood. It is announced as well, because a
        confirmation only sighted people get is not one.
      </p>
      <p class="t-caption hint">
        It also takes <code>2025-04-03</code> in any locale, <code>3 Apr</code>,
        <code>3. März</code> in a German one, <code>03042025</code>, and a bare
        <code>3</code> for this month. It <em>refuses</em> <code>31/02</code> —
        <code>new Date(2025, 1, 31)</code> is the third of March and says nothing about
        it, so every result is built and read back — and it refuses <code>3 ma</code>,
        because “ma” is March and May and guessing between them is worse than saying no.
      </p>
      <p class="t-caption hint">
        <strong>Text that does not parse does not clear the value.</strong> Type nonsense
        into a field that already holds a date: an error appears and the date stays. The
        alternative destroys data to punish a typo.
      </p>
      <p class="t-caption hint">
        Not <code>&lt;input type="date"&gt;</code>, and that is a cost rather than a win.
        The native one is good — free parsing, free locale, a real picker on a phone —
        and it is given up for two things it cannot do: its popup is unstyleable, so it
        cannot show the events and the range this grid does, and its segmented display
        cannot be pasted into. The price is that we own the parsing, and that debt is
        paid in one file rather than spread through the component.
      </p>
    </section>
  </div>
</template>

<style scoped>
.pickers { align-items: start; gap: var(--s-6); }
.pickers > * { max-width: 240px; }
</style>
