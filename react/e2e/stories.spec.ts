import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { audit } from './audit'
import { SRC, listen, localeOf, signal, sourceFiles, storiesMetaId, storyId } from './sweep'

/**
 * Every story, loaded on its own, and the six questions asked of it.
 *
 * The story ids are DERIVED from the story files — the meta's id or
 * title and the export names, through Storybook's own id rule (sweep.ts)
 * — so a new story is swept the moment it is written. An id this gets
 * wrong loads Storybook's "story not found" page, which fails the test,
 * so the derivation checks itself.
 */

const stories = sourceFiles(SRC, '.stories.tsx').flatMap(file => {
  const meta = storiesMetaId(file)
  return [...readFileSync(file, 'utf8').matchAll(/^export const (\w+)/gm)].map(m => storyId(meta, m[1]!))
})

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
    const locale = localeOf(globals)
    expect(await audit(page, locale), 'at 1280').toEqual([])

    await page.setViewportSize({ width: 390, height: 760 })
    await page.waitForTimeout(150)
    expect(await audit(page, locale), 'at 390').toEqual([])
  })
}
