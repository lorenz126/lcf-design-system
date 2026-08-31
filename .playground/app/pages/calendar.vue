<script setup lang="ts">
useHead({ title: 'Calendar — Design Framework' })

const picked = ref<string | null>(null)
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
  </div>
</template>

<style scoped>
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
