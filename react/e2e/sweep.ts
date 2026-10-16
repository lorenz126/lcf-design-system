import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { Page } from '@playwright/test'
import { storyNameFromExport, toId } from 'storybook/internal/csf'

/**
 * What the two sweeps — every story (stories.spec.ts) and every docs page
 * (docs.spec.ts) — have to agree on, written once: how an id is derived
 * from the source, and what counts as the browser complaining. A copy of
 * either in each spec is two copies that disagree by next month.
 */

export const SRC = join(import.meta.dirname, '..', 'src')

/* Ids are Storybook's own rule, imported — as src/docs/blocks/links.ts
   does — not a kebab-case written here. The hand-written copy this
   replaces agreed on every title so far and was wrong for the next
   ones: "Components/IconButton" gave components-icon-button where
   Storybook says components-iconbutton, and an export "Size2x" gave
   size2x where Storybook says size-2-x. Storybook builds a story's id as
   toId(meta.id || meta.title, storyNameFromExport(export)), and a docs
   page's from the same first half and "docs". */

/** A story's id, from its meta's id or title and its export name. */
export const storyId = (metaIdOrTitle: string, exportName: string) => toId(metaIdOrTitle, storyNameFromExport(exportName))

/** An autodocs or MDX page's id, from its meta's id or title. */
export const docsId = (metaIdOrTitle: string) => toId(metaIdOrTitle, 'docs')

/** Every file under `dir` whose name ends in `suffix`, recursively. */
export function sourceFiles(dir: string, suffix: string): string[] {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? sourceFiles(p, suffix) : f.endsWith(suffix) ? [p] : []
  })
}

/**
 * What a stories file's ids start from: the meta's `id` when it sets
 * one, else its `title`. Read from the meta object — the text before
 * `export default` — so an `id:` in a story below cannot be mistaken
 * for the meta's.
 */
export function storiesMetaId(file: string) {
  const src = readFileSync(file, 'utf8')
  const end = src.search(/^export default\b/m)
  const meta = end < 0 ? src : src.slice(0, end)
  const id = meta.match(/^\s*id:\s*'([^']+)'/m)?.[1]
  const title = meta.match(/^\s*title:\s*'([^']+)'/m)?.[1]
  if (!title && !id) throw new Error(`${file}: no title in meta`)
  return (id ?? title)!
}

/** Every warning, error and uncaught exception the page reports. */
export function listen(page: Page) {
  const said: string[] = []
  page.on('console', m => {
    if (m.type() === 'warning' || m.type() === 'error') said.push(`${m.type()}: ${m.text()}`)
  })
  page.on('pageerror', e => said.push(`pageerror: ${e.message}`))
  return said
}

/* Storybook's own chatter, not the component's. Each entry says what it
   is, so a new one is added knowingly rather than by widening a regex. */
const NOISE = [
  /\[vite\]/, // HMR housekeeping
  /Download the React DevTools/ // React's own, in development
]
export const signal = (lines: string[]) => lines.filter(l => !NOISE.some(n => n.test(l)))
