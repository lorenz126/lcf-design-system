<script setup lang="ts">
useHead({ title: 'Prose — Design Framework' })
const article = useTemplateRef<HTMLElement>('article')
</script>

<template>
  <div>
    <div class="intro">
      <p class="t-lead lede">Where the display sizes finally do some work.</p>
      <p class="t-body body">
        Prose styles slotted markup rather than taking props — the content comes from
        markdown or a CMS, so it knows no data shape and stays a molecule. The column
        beside it is <NuxtLink to="/organisms/toc">Toc</NuxtLink>, which reads the
        headings back out of what Prose rendered.
      </p>
    </div>

    <UiDocLayout>
      <div ref="article">
        <UiProse>
          <h1 id="designing-with-constraints">Designing with constraints</h1>
          <p>
            A design system is mostly a record of decisions that have already been
            made, so that they do not have to be made again. The value is not the
            components — it is that nobody re-litigates the border radius.
          </p>

          <h2>Vertical rhythm</h2>
          <p>
            The spacing here is <strong>asymmetric on purpose</strong>. A heading
            belongs to the text below it, so its top margin is large and its bottom
            margin small. Give a heading equal margins and it floats between two
            blocks, belonging to neither.
          </p>
          <p>
            Notice what happens between two consecutive headings: they close up into a
            single unit rather than opening a gap, because a subtitle under a title is
            not a new section.
          </p>
          <p>
            The gaps are not arbitrary either. Each heading level opens a larger space
            above itself than the level below it, so the depth of a break is visible
            before a single word is read. Skimming a long page, you can tell where a
            major section starts without looking at type size at all.
          </p>
          <p>
            This is also why the first child of the container has no top margin and the
            last has no bottom margin. A block of prose should sit flush inside
            whatever contains it; the container decides its own padding, and prose that
            adds margins on top of that produces the doubled gaps that make nested
            layouts drift.
          </p>

          <h3>Measure</h3>
          <p>
            Only the text is constrained to about 68 characters. A code block or an
            image can still run the full width, because the reason for a measure —
            the eye losing its place on the return sweep — does not apply to them.
          </p>
          <blockquote>
            Anything beyond roughly 75 characters and the reader starts re-reading
            lines without noticing.
          </blockquote>
          <p>
            The constraint is applied to the children rather than to the container for
            exactly that reason. Setting a max width on the wrapper would drag every
            figure, table and code sample in with it, and those want the room.
          </p>
          <p>
            Three widths are offered instead of one. A sidebar note wants a tighter
            measure than an article, because it is read in glances rather than in
            sustained passes, and a reference table wants none at all.
          </p>

          <h2>Code</h2>
          <p>
            Inline <code>--r-control</code> sits at 0.9em, because a monospaced face
            reads optically larger than a proportional one at the same nominal size.
            Set them to the same number and the code looks swollen inside the sentence.
          </p>
          <p>
            Block code drops the inline background and takes a bordered surface
            instead. Inline code is a word inside a sentence and needs only enough
            tint to separate it; a block is its own object and needs an edge.
          </p>
          <pre><code>.u-btn {
  border-radius: min(var(--r-control), calc(var(--h) * 0.4));
}</code></pre>

          <p>
            Long lines inside a block scroll horizontally rather than wrapping. Wrapped
            code changes the meaning of indentation, which is the one thing a reader is
            using to follow structure.
          </p>

          <h3>Tables</h3>
          <table>
            <thead>
              <tr><th>Token</th><th>Light</th><th>Dark</th></tr>
            </thead>
            <tbody>
              <tr><td><code>--bg</code></td><td>#ffffff</td><td>#0a0a0a</td></tr>
              <tr><td><code>--fg</code></td><td>#171717</td><td>#fafafa</td></tr>
              <tr><td><code>--accent</code></td><td>#007aff</td><td>#0a84ff</td></tr>
            </tbody>
          </table>

          <p>
            Table type is a step smaller than the prose around it. A table is scanned
            rather than read, and at the same size as body text it starts competing
            with the argument it is supposed to support.
          </p>

          <h2>Lists</h2>
          <p>
            List items sit closer to each other than paragraphs do, because they are
            one thought split into parts rather than several thoughts in sequence.
          </p>
          <ul>
            <li>Markers are subdued, so they punctuate without competing.</li>
            <li>Items sit closer to each other than paragraphs do.</li>
            <li>
              Links like <a href="#designing-with-constraints">this one</a> underline
              clear of their descenders. It carries an explicit id, because Toc only
              assigns them to the levels it lists — the h1 is the page title, not an
              entry in its own contents.
            </li>
          </ul>
          <hr>
          <p>
            Every heading above was given an id automatically — the table of contents
            beside this text was built by reading them back out of the page.
          </p>
        </UiProse>
      </div>

      <template #aside><UiToc :target="article" /></template>
    </UiDocLayout>
  </div>
</template>
