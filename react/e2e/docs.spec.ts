import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { audit } from './audit'
import { SRC, kebab, listen, signal, sourceFiles, storiesTitle } from './sweep'

/**
 * Every docs page, loaded the way a reader gets it, and the same five
 * questions the story sweep asks.
 *
 * The story sweep loads stories in viewMode=story, which never renders
 * the page around them: the headings, the props table, the code blocks,
 * the "on this page" list. Measured by hand before this existed: on the
 * dark docs page the section headings were #171717 on a near-black
 * ground and three Storybook elements still had white grounds, and
 * nothing automated could see any of it.
 *
 * The pages are DERIVED from the source, like the story ids: one per
 * MDX file (its <Meta title="…" />) and one autodocs page per stories
 * file (its meta title). Storybook answers an id it does not know with
 * its error display — body.sb-show-errordisplay and "Couldn't find story
 * matching '<id>'" — which fails the test, so the derivation checks
 * itself.
 */

const mdxPages = sourceFiles(SRC, '.mdx').map(file => {
  const title = readFileSync(file, 'utf8').match(/<Meta\s+title="([^"]+)"/)?.[1]
  // An MDX page attached to stories (<Meta of={…} />) takes its id from
  // them; nothing here derives that yet, so it stops rather than guesses.
  if (!title) throw new Error(`${file}: no <Meta title="…" /> — derive this page's id before adding it`)
  return title
})
const componentPages = sourceFiles(SRC, '.stories.tsx').map(storiesTitle)
const pages = [...mdxPages, ...componentPages].map(title => `${kebab(title)}--docs`)

for (const id of pages) {
  test(id, async ({ page }, info) => {
    const said = listen(page)
    const globals = (info.project.metadata as { globals?: string }).globals ?? ''
    await page.goto(`/iframe.html?id=${id}&viewMode=docs${globals ? `&globals=${globals}` : ''}`, { waitUntil: 'networkidle' })

    // The page, or Storybook's error display — whichever comes, say which.
    // `attached`, not visible: with the error display up, <body> itself
    // has no height, so waiting for it to be visible waited out the test.
    await page.locator('#storybook-docs .sbdocs-content, body.sb-show-errordisplay').first().waitFor({ state: 'attached' })
    const error = await page.evaluate(() =>
      document.body.classList.contains('sb-show-errordisplay') ? document.querySelector('#error-message')?.textContent ?? 'error display' : null
    )
    expect(error, 'Storybook rendered its error display, not the page').toBeNull()

    // Every story on the page has rendered into its slot.
    await page.waitForFunction(() =>
      [...document.querySelectorAll('#storybook-docs .sb-story')].every(s => s.querySelector('[id$="-inner"] > *'))
    )
    await page.waitForTimeout(200)

    // The page follows the theme switch the way an app does: on <html>.
    const want = globals.includes('theme:dark') ? 'dark' : 'light'
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(want)

    expect(signal(said), 'the console while loading').toEqual([])
    expect(await audit(page), 'at 1280').toEqual([])

    await page.setViewportSize({ width: 390, height: 760 })
    await page.waitForTimeout(150)
    expect(await audit(page), 'at 390').toEqual([])
  })
}
