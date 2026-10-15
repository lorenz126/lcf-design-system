import { ArgTypes, Description, Heading, Primary, Source, Stories, Subtitle, Title, useOf } from '@storybook/addon-docs/blocks'

/**
 * Every component's page, in the order a reader needs it:
 *
 *   title · one sentence · the base example
 *   Usage      the import line, to copy
 *   Reference  the props, read from the types
 *   Examples   one section per story, each with its own sentence
 *   Design notes  the component's doc comment — what was decided, what
 *              it cost, what it refuses to be
 *
 * The design notes used to open the page, as a wall of text before the
 * first example. They are the most valuable thing in the source and the
 * last thing a first-time reader wants; at the end, after the props,
 * they answer the question a reader has by then: why is it like this.
 */
export function DocsPage() {
  const { preparedMeta } = useOf('meta')
  const name = preparedMeta.title.split('/').pop()!
  const isComponent = preparedMeta.title.startsWith('Components/')
  return (
    <>
      <Title />
      <Subtitle />
      <Primary />
      {isComponent && (
        <>
          <Heading>Usage</Heading>
          <Source language="tsx" dark={false} code={`import { ${name} } from '@lcf/design/components/${name}'`} />
          <Heading>Reference</Heading>
          <ArgTypes />
        </>
      )}
      <Stories title="Examples" includePrimary={false} />
      <Heading>Design notes</Heading>
      <div className="lcf-design-notes">
        <Description />
      </div>
    </>
  )
}
