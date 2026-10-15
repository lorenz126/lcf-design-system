/// <reference types="vite/client" />
import { Card, CardGrid } from './Cards'

/** The part of a stories file's default export the catalogue reads. */
interface StoriesMeta {
  title?: string
  id?: string
  tags?: string[]
  parameters?: { componentSubtitle?: string; docs?: { subtitle?: string } }
}

export interface CatalogueEntry {
  name: string
  /** What `docsHref` takes: the meta's id when it sets one, else its title. */
  to: string
  description: string | undefined
}

/**
 * Every component with stories, read from the stories files themselves —
 * so the list cannot go stale: a component appears the moment its
 * stories exist, under the name and sentence its page shows.
 *
 * Vite resolves the glob at build time and imports the same modules
 * Storybook does, so nothing is loaded twice.
 */
const modules = import.meta.glob<StoriesMeta>('../../components/*/*.stories.tsx', { eager: true, import: 'default' })

export const catalogue: CatalogueEntry[] = Object.values(modules)
  // A file without a title fails the browser sweep before it gets here
  // (e2e/stories.spec.ts); one that opts out of autodocs has no page to
  // link to.
  .filter((m): m is StoriesMeta & { title: string } => !!m.title && !m.tags?.includes('!autodocs'))
  .map(m => ({
    name: m.title.split('/').pop()!.trim(),
    to: m.id ?? m.title,
    // Where Storybook's own Subtitle block looks, in its order.
    description: m.parameters?.docs?.subtitle ?? m.parameters?.componentSubtitle
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'en'))

export function ComponentCatalogue() {
  return (
    <CardGrid>
      {catalogue.map(c => (
        <Card key={c.to} title={c.name} description={c.description} to={c.to} />
      ))}
    </CardGrid>
  )
}
