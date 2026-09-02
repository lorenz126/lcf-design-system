<script setup lang="ts">
useHead({ title: 'Combobox — Design Framework' })

const country = ref<string | null>('de')
const tags = ref<(string | number)[]>(['bug'])
const owner = ref<string | null>(null)

const countries = [
  { value: 'de', label: 'Germany', note: 'DE', keywords: ['deutschland'] },
  { value: 'at', label: 'Austria', note: 'AT', keywords: ['österreich'] },
  { value: 'ch', label: 'Switzerland', note: 'CH', keywords: ['schweiz', 'suisse'] },
  { value: 'fr', label: 'France', note: 'FR' },
  { value: 'it', label: 'Italy', note: 'IT', keywords: ['italia'] },
  { value: 'li', label: 'Liechtenstein', note: 'LI', disabled: true }
]

/* The new option is made HERE, which is the whole point of `create`
   being an event: it has to exist where the others live, and only this
   page knows that is a ref. */
const labels = ref([
  { value: 'bug', label: 'bug' },
  { value: 'design', label: 'design' },
  { value: 'a11y', label: 'accessibility' },
  { value: 'docs', label: 'documentation' }
])
function addLabel(name: string) {
  const value = name.toLowerCase().replace(/\s+/g, '-')
  labels.value = [...labels.value, { value, label: name }]
  tags.value = [...tags.value, value]
}

const people = [
  { value: 1, label: 'Anna Weber', note: 'Design' },
  { value: 2, label: 'Tom Krause', note: 'Platform' },
  { value: 3, label: 'Lena Bauer', note: 'Payments' }
]
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">A form field that picks from a list you can type into.</p>
      <p class="t-body body">
        <NuxtLink to="/molecules/search-field">SearchField</NuxtLink> is a combobox for
        chrome. This is one for a form, and three things follow from that: the value is
        an id, it filters, and it will not write anything down for you.
      </p>
    </div>

    <section>
      <div class="sec-label">One of a list</div>
      <div class="col">
        <UiCombobox
          v-model="country"
          :options="countries"
          label="Country"
          placeholder="Start typing"
          help="Try “deutsch” — a keyword finds a name it is also known by."
          block
        />
        <p class="t-caption dim">Value: <code>{{ country ?? 'null' }}</code></p>
      </div>
      <p class="t-caption hint">
        <strong>The value is an id, not the text.</strong> SearchField’s model is the
        query someone typed, because a search box’s value <em>is</em> what was typed. A
        form submits a country, not the letters “Germ”. Which is also why the label can
        change — to “Deutschland”, say — without the stored value moving.
      </p>
      <p class="t-caption hint">
        <strong>It filters, and SearchField refuses to.</strong> Same rule as the
        <NuxtLink to="/molecules/command-palette">palette</NuxtLink>: a component should
        filter exactly when it knows what it is filtering, and these options were handed
        over whole.
      </p>
      <p class="t-caption hint">
        <strong>But it looks up rather than searching.</strong> Type <code>gmy</code>:
        nothing. A palette is a search, where fuzzy matching earns its keep because you
        half-remember a command. A form combobox is a lookup — you know the country is
        called Germany and you are typing it — and a fuzzy match here is a control that
        offers you Denmark when you made a typo.
      </p>
    </section>

    <section>
      <div class="sec-label">Several, and one you can add</div>
      <div class="col">
        <UiCombobox
          v-model="tags"
          :options="labels"
          multiple
          creatable
          label="Labels"
          placeholder="Add a label"
          :create-label="q => `Create label “${q}”`"
          block
          @create="addLabel"
        />
        <p class="t-caption dim">Value: <code>{{ JSON.stringify(tags) }}</code></p>
      </div>
      <p class="t-caption hint">
        Type something that is not there and take the last row.
        <strong>Creating is where the control stops choosing and starts writing</strong>,
        so it is opt-in and it does not do the writing: choosing that row emits
        <code>create</code> and nothing else. A component that pushed the new option
        into its own list would make one that exists until the page reloads — the option
        has to be made where the others live, and only the caller knows where that is.
        On this page that is a <code>ref</code>; in your app it is a request.
      </p>
      <p class="t-caption hint">
        It will not offer to add something already in the list — “Add design” under a
        list containing design is a row that makes a duplicate.
      </p>
      <p class="t-caption hint">
        Press <strong>Backspace</strong> in the empty box: it takes the last chip. A
        field whose only way to remove one is a small × is a field you cannot empty from
        the keyboard. With text in the box it deletes the text instead, because that is
        what you were pointing at.
      </p>
    </section>

    <section>
      <div class="sec-label">States</div>
      <div class="col">
        <UiCombobox v-model="owner" :options="people" label="Assignee" placeholder="Unassigned" block />
        <UiCombobox :options="people" label="Required" required placeholder="Pick someone" block />
        <UiCombobox :options="people" label="Invalid" error="Choose an assignee." placeholder="Pick someone" block />
        <UiCombobox :options="people" label="Unavailable" disabled placeholder="Pick someone" block />
      </div>
      <p class="t-caption hint">
        Focus never leaves the input — the arrows move
        <code>aria-activedescendant</code>, not the focus, for the reason SearchField
        gives at length. The ring is around the whole box rather than the caret, because
        the chips are part of the field and a ring around only the caret would say they
        are somewhere else.
      </p>
      <p class="t-caption hint">
        <strong>Not a remote picker.</strong> Loading options as you type is a different
        component: it needs a request per keystroke, a race between answers, a spinner,
        and a story about what a stale response does to a list you are already arrowing
        through. Hand this one the options.
      </p>
    </section>
  </div>
</template>

<style scoped>
.col { max-width: 380px; gap: var(--s-5); }
</style>
