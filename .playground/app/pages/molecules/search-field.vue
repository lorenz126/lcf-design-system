<script setup lang="ts">
useHead({ title: 'SearchField — Design Framework' })
const find = ref('')
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
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">A search field for chrome, with a list under it.</p>
      <p class="t-body body">
        Not a flag on <NuxtLink to="/atoms/input">Input</NuxtLink>, because it is not
        the same thing — and it renders what it is given rather than searching, which
        is the line that separates it from
        <NuxtLink to="/molecules/command-palette">CommandPalette</NuxtLink>.
      </p>
    </div>

    <section>
      <div class="sec-label">Four of them</div>
      <div class="col">
        <UiSearchField
          v-model="find"
          size="lg"
          placeholder="Type a letter"
          :suggestions="found"
          :recent="fruit.slice(2, 3).concat(fruit.slice(4, 5))"
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
        and there are four more fields on this page.
      </p>
      <p class="t-caption hint">
        It renders what it is given and does not search. Ranking, fuzziness and where
        results come from are the application's business — and the recents are a prop
        for the same reason, since a control that quietly wrote to
        <code>localStorage</code> would be a surprise. The
        <NuxtLink to="/molecules/command-palette">palette</NuxtLink> ranks because it
        owns its corpus; this one does not, because it does not.
      </p>
      <p class="t-caption hint">
        Type something and press <strong>Escape</strong>. The first press closes the
        list, the second clears the field — one key, two steps, most specific first.
        The clear button is a real button so it is reachable without a mouse, and both
        routes go through the same <code>clear()</code> — which also puts focus back in
        the field, since clearing and then losing the box is how you end up typing into
        the page.
      </p>
    </section>
  </div>
</template>

<style scoped>
.col { max-width: 380px; gap: var(--s-5); }
</style>
