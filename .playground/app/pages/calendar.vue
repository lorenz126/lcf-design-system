<script setup lang="ts">
useHead({ title: 'Calendar — Design Framework' })

const picked = ref<string | null>(null)
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
      <p class="t-lead lede">The keyboard model is the component.</p>
      <p class="t-body body">
        A grid of clickable divs is unusable without a mouse, and a calendar is where
        that matters most — thirty-one cells is a lot of places to be stuck. Only
        <strong>one</strong> cell is tabbable at a time; the arrows take over from
        there. Thirty-one tab stops per month is not navigation, it is an obstacle
        course.
      </p>
      <p class="t-caption warn">
        No date library. <code>Intl</code> handles the parts that are genuinely hard —
        locale month and weekday names — and month arithmetic on a
        <code>Date</code> is a dozen lines. A dependency here would buy formatting we
        already have.
      </p>
    </div>

    <section>
      <div class="sec-label">Month</div>
      <div class="row">
        <UiCard>
          <UiCalendar v-model="picked" :events="events" />
        </UiCard>
        <div class="notes">
          <p class="t-body">Selected: <strong>{{ picked ?? 'nothing yet' }}</strong></p>
          <UiProse size="sm">
            <p>
              Click into the grid, then leave the mouse alone. Arrows move a day or a
              week, Home and End jump to the edges of the week, Page Up and Page Down
              change month, Enter selects.
            </p>
            <p>
              Moving is not choosing. The cursor and the selection are separate, so you
              can look around a month without committing to anything — which is how a
              date picker has to behave, since arriving somewhere is not the same as
              wanting it.
            </p>
            <p>
              The coloured dots are decoration. What a screen reader gets is the count
              and the event names, because three dots announce nothing.
            </p>
          </UiProse>
        </div>
      </div>
    </section>

    <section>
      <div class="sec-label">Bounded range</div>
      <UiCard>
        <UiCalendar :min="day(8)" :max="day(22)" />
      </UiCard>
      <p class="t-caption hint">
        Days outside the range are disabled rather than removed — taking them out
        would leave holes and break the week rows. Arrow keys still travel across
        them; you simply cannot select one.
      </p>
    </section>

    <section>
      <div class="sec-label">DatePicker</div>
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
.intro { border-left: 2px solid var(--rule); padding-left: 20px; margin-bottom: 64px; }
.lede { margin: 0 0 10px; }
.body { margin: 0 0 14px; color: var(--ink-2); max-width: 68ch; }
.warn { margin: 0; color: var(--ink-3); max-width: 68ch; line-height: 1.6; }
code { font-family: var(--font-mono); font-size: 11px; }
section { margin-bottom: 64px; }
.row { display: flex; gap: var(--s-9); align-items: flex-start; flex-wrap: wrap; }
.notes { flex: 1; min-width: 260px; max-width: 42ch; display: flex; flex-direction: column; gap: var(--s-5); }
.hint { color: var(--ink-3); margin: 14px 0 0; max-width: 68ch; line-height: 1.6; }
</style>
