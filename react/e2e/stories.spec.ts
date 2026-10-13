import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { audit } from './audit'

/**
 * Every story, loaded on its own, and the five questions asked of it.
 *
 * The story ids are DERIVED from the story files — title and export
 * names, kebab-cased the way Storybook does it — so a new story is swept
 * the moment it is written. An id this gets wrong loads Storybook's
 * "story not found" page, which fails the test, so the derivation checks
 * itself.
 */

const ROOT = join(import.meta.dirname, '..')
const kebab = (s: string) =>
  s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()

function storyFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? storyFiles(p) : f.endsWith('.stories.tsx') ? [p] : []
  })
}

const stories = storyFiles(join(ROOT, 'src')).flatMap(file => {
  const src = readFileSync(file, 'utf8')
  const title = src.match(/title:\s*'([^']+)'/)?.[1]
  if (!title) throw new Error(`${file}: no title in meta`)
  return [...src.matchAll(/^export const (\w+)/gm)].map(m => `${kebab(title)}--${kebab(m[1]!)}`)
})

function listen(page: Page) {
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
const signal = (lines: string[]) => lines.filter(l => !NOISE.some(n => n.test(l)))

for (const id of stories) {
  test(id, async ({ page }, info) => {
    const said = listen(page)
    const globals = (info.project.metadata as { globals?: string }).globals ?? ''
    await page.goto(`/iframe.html?id=${id}&viewMode=story${globals ? `&globals=${globals}` : ''}`, { waitUntil: 'networkidle' })
    await page.locator('#storybook-root > *').first().waitFor()
    await page.waitForTimeout(200)

    // The decorator set the theme on <html> exactly as an app would.
    const want = globals.includes('theme:dark') ? 'dark' : 'light'
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(want)

    expect(signal(said), 'the console while loading').toEqual([])
    expect(await audit(page), 'at 1280').toEqual([])

    await page.setViewportSize({ width: 390, height: 760 })
    await page.waitForTimeout(150)
    expect(await audit(page), 'at 390').toEqual([])
  })
}
