<script setup lang="ts">
import { Inbox, Plus } from 'lucide-vue-next'
useHead({ title: 'EmptyState — Design Framework' })
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Nothing here, and one thing to do about it.</p>
      <p class="t-body body">
        An empty list is a dead end unless it says what would fill it. The pattern
        exists so that every app does not invent its own centred paragraph.
      </p>
    </div>

    <section>
      <div class="sec-label">Nothing here yet</div>
      <div class="cards two">
        <UiCard padding="none">
          <UiEmptyState
            size="sm"
            :icon="Inbox"
            title="No requests yet"
            description="Anything that arrives today will show up here."
          />
        </UiCard>
        <UiCard padding="none">
          <UiEmptyState
            :icon="Inbox"
            title="Nothing in this project"
            description="A project starts empty. Add the first item and the list takes over from here."
          >
            <UiButton size="sm">
              <template #leading><UiIcon :is="Plus" /></template>
              New item
            </UiButton>
          </UiEmptyState>
        </UiCard>
      </div>
      <p class="t-caption hint">
        “No rows.” is not an empty state, it is a status line. The difference matters
        because empty is usually the <em>first</em> thing anyone sees — a new board, a
        fresh filter, an inbox just cleared. It is the one moment an interface can say
        what the thing is for, and a greyed-out sentence in the middle of a table
        spends it saying nothing.
      </p>
      <p class="t-caption hint">
        Which is why the action is a <strong>slot</strong>, not a prop: a useful empty
        state ends in a way out — create the first one, clear the filter, go back — and
        what that way out is belongs to the application. List and Table now render the
        small size by default and take an <code>empty</code> slot for the rest.
      </p>
    </section>
  </div>
</template>
