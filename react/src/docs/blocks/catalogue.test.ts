import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { catalogue } from './ComponentCatalogue'
import { docsHref } from './links'

const components = join(import.meta.dirname, '../../components')

describe('the component catalogue on the Introduction', () => {
  // The glob is a path relative to this folder. Move the folder and it
  // matches nothing — and an empty grid renders without an error.
  it('lists every component that has stories, read from the tree', () => {
    const onDisk = readdirSync(components, { withFileTypes: true })
      .filter(d => d.isDirectory() && existsSync(join(components, d.name, `${d.name}.stories.tsx`)))
      .map(d => d.name)
      .sort()
    expect(onDisk.length).toBeGreaterThan(0)
    expect(catalogue.map(c => c.name).sort()).toEqual(onDisk)
  })

  it('gives each one the sentence its page opens with', () => {
    const silent = catalogue.filter(c => !c.description?.trim()).map(c => c.name)
    expect(silent, 'set parameters.docs.subtitle (or componentSubtitle) in the stories meta').toEqual([])
  })

  it('links to Storybook\'s own docs id, relative to iframe.html', () => {
    expect(docsHref('Overview/Locale and format')).toBe('./?path=/docs/overview-locale-and-format--docs')
    expect(docsHref('Components/Button')).toBe('./?path=/docs/components-button--docs')
  })
})
