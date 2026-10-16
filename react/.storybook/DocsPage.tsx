import { useContext, type ReactNode } from 'react'
import {
  Anchor,
  ArgTypes,
  Canvas,
  Description,
  DocsContext,
  Heading,
  Primary,
  Source,
  Stories,
  Story,
  Subtitle,
  Title,
  useOf
} from '@storybook/addon-docs/blocks'
import './docs-page.css'

/**
 * Every component's page, in the order a reader needs it:
 *
 *   title · one sentence
 *   the hero   the Showcase story: a row of the component at work, bare
 *   Usage      the import line, then the base example WITH its code
 *   Reference  the props, read from the types
 *   Examples   one section per story, each with its own sentence
 *   Design notes  the component's doc comment — what was decided, what
 *              it cost, what it refuses to be
 *
 * The design notes used to open the page, as a wall of text before the
 * first example. They are the most valuable thing in the source and the
 * last thing a first-time reader wants; at the end, after the props,
 * they answer the question a reader has by then: why is it like this.
 *
 * THE HERO IS A STORY, KEPT OFF THE AUTOMATIC BLOCKS BY A TAG. Each
 * stories file exports `Showcase` with `tags: ['!autodocs']`. Read in
 * Storybook 10.6.2's source, not assumed:
 *
 * - The tag does not remove the story from the index. The index
 *   generator (core-server `extractStories`) emits an entry for every
 *   export and only combines tags onto it; the docs entry is still made
 *   because the other stories keep `autodocs`. So the sweep, which loads
 *   every `export const` by id, still loads Showcase — and audits the
 *   hero for contrast, names and overflow like any other story.
 * - `<Primary>` (usePrimaryStory) picks the first story TAGGED autodocs,
 *   and `<Stories>` keeps only stories tagged autodocs. One tag takes the
 *   Showcase out of both, wherever it sits in the file — no ordering rule
 *   to remember, and no `docs.stories.filter` parameter, which only
 *   `<Stories>` reads.
 * - The page then asks for it by export name: `useOf('meta')` gives the
 *   attached CSF file, `csfFile.moduleExports.Showcase` is the story's
 *   module export, and `<Story of={…}>` resolves it through the docs
 *   context (its `exportToStory` map is filled from the index, which is
 *   why it must stay in the index). `<Story>` is the bare render — the
 *   `.sb-story` div — where `<Canvas>` would add the frame, toolbar and
 *   code toggle the hero is meant to be without.
 *
 * scripts/check-stories.mjs holds every component to it: a Showcase,
 * tagged `!autodocs`, or the hero is missing or the row shows up a
 * second time under Examples.
 *
 * THE PRIMARY EXAMPLE SHOWS ITS CODE. `<Primary>` renders a `<Canvas>`
 * whose `sourceState` comes only from the story's parameters, and a
 * project-wide `docs.canvas.sourceState` would open the code under every
 * example on the page too. So component pages render that same canvas
 * themselves — the story `<Primary>` would pick, the anchor and
 * `__primary` id it would give it — and pass `sourceState="shown"`. The
 * examples keep "Show code" closed: their point is the picture, and
 * twelve open code blocks bury it. No canvas has a toolbar
 * (preview.tsx, `docs.canvas.withToolbar`).
 *
 * A CENTRED EXAMPLE GETS A STAGE. A meta that centres its examples
 * (`docs.canvas.layout: 'centered'` — Button, Badge, Spinner) gives the
 * primary canvas the `docs-stage` class, and docs-page.css a minimum
 * height: one button in a 106px strip read as a line of the page, not
 * as the thing the page is about. Alert fills its line and stays
 * 'padded' — centred, it shrank to its content.
 */
export function DocsPage() {
  const { preparedMeta, csfFile } = useOf('meta')
  const docs = useContext(DocsContext)
  const name = preparedMeta.title.split('/').pop()!
  const isComponent = preparedMeta.title.startsWith('Components/')
  const showcase = csfFile.moduleExports.Showcase as object | undefined
  // The same choice usePrimaryStory makes on an autodocs page.
  const primary = docs.componentStories().find(s => s.tags.includes('autodocs'))
  // The same order CanvasImpl reads the layout in.
  const centred = (primary?.parameters.layout ?? primary?.parameters.docs?.canvas?.layout) === 'centered'
  return (
    <>
      <Title />
      <Subtitle />
      {isComponent ? (
        <>
          {showcase && (
            <div className="docs-hero">
              <Story of={showcase} />
            </div>
          )}
          <Heading>Usage</Heading>
          <Source language="tsx" dark={false} code={`import { ${name} } from '@lcf/design/components/${name}'`} />
          {primary && (
            <Anchor storyId={`primary--${primary.id}`}>
              <Canvas
                of={primary.moduleExport}
                sourceState="shown"
                className={centred ? 'docs-stage' : undefined}
                story={{ __primary: true }}
              />
            </Anchor>
          )}
          <Heading>Reference</Heading>
          <ArgTypes />
        </>
      ) : (
        <Primary />
      )}
      <Stories title="Examples" includePrimary={false} />
      <Heading>Design notes</Heading>
      <div className="lcf-design-notes">
        <Description />
      </div>
    </>
  )
}

/**
 * The one sentence under a page's title, as a paragraph.
 *
 * Storybook's Subtitle block renders an <h2>: on all eight pages the
 * heading outline went "On this page", the title, then a full sentence
 * as a level-2 section ("React 18 or 19. Tailwind is optional.") — the
 * "On this page" list skipped it only because it was told to. The HTML
 * standard keeps h1–h6 for headings, not for taglines. preview.tsx puts
 * this in Storybook's place through `docs.components`, so the MDX pages'
 * `<Subtitle>` and the component pages' `<Subtitle />` both get it.
 *
 * Read from the same places Storybook's block reads, minus the
 * deprecated `parameters.componentSubtitle`: the children, else the
 * meta's `docs.subtitle`. An MDX page with `<Meta title>` has no meta to
 * resolve — useOf throws — and passes its sentence as children.
 * `sb-unstyled` keeps Storybook's paragraph styles off; workshop.css
 * sets `.sbdocs-subtitle` by class, so it looks as the <h2> did.
 */
export function Lead({ children }: { children?: ReactNode }) {
  let subtitle: ReactNode
  try {
    subtitle = useOf('meta').preparedMeta.parameters.docs?.subtitle
  } catch {
    // No attached meta: an MDX page that passes its sentence.
  }
  const content = children ?? subtitle
  return content ? <p className="sbdocs-subtitle sb-unstyled">{content}</p> : null
}
