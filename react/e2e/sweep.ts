import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { Page } from '@playwright/test'

/**
 * What the two sweeps — every story (stories.spec.ts) and every docs page
 * (docs.spec.ts) — have to agree on, written once: how an id is derived
 * from the source, and what counts as the browser complaining. A copy of
 * either in each spec is two copies that disagree by next month.
 */

export const SRC = join(import.meta.dirname, '..', 'src')

/** Storybook's id rule: a title or an export name, kebab-cased the way Storybook does it. */
export const kebab = (s: string) =>
  s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()

/** Every file under `dir` whose name ends in `suffix`, recursively. */
export function sourceFiles(dir: string, suffix: string): string[] {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? sourceFiles(p, suffix) : f.endsWith(suffix) ? [p] : []
  })
}

/** The meta title of a stories file — the first `title: '…'`, which is the meta's. */
export function storiesTitle(file: string) {
  const title = readFileSync(file, 'utf8').match(/title:\s*'([^']+)'/)?.[1]
  if (!title) throw new Error(`${file}: no title in meta`)
  return title
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
