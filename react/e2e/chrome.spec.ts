import { expect, test, type Page } from '@playwright/test'
import { listen, signal } from './sweep'

/**
 * The site around the pages: the manager — sidebar, toolbar, tab title —
 * which .storybook/manager.ts and manager-head.html make out of
 * Storybook's workbench. The other two specs load iframe.html only, and
 * the manager never runs there; so until this existed, a Storybook
 * update that changed how it writes the title, or the shape of its
 * globals events, left the chrome on Storybook's defaults with every
 * test green. Checked by breaking it on purpose: with manager.ts's
 * bundle emptied, the tab read "Components / Button - Docs ⋅
 * Storybook", the sidebar was white beside a dark page, and the stories
 * were listed again.
 *
 * Once, not per project: the chrome is the same in every pass, and this
 * test switches the theme itself.
 */

/* The manager on the dev server keeps a connection open, so
   `networkidle` never comes: wait for the sidebar and the page in the
   frame instead. */
async function open(page: Page, path: string) {
  await page.goto(path)
  await page.locator('.sidebar-container').waitFor()
  const frame = page.frameLocator('#storybook-preview-iframe')
  await frame.locator('#storybook-docs .sbdocs-content').first().waitFor()
  // And every story in its slot, as docs.spec waits: a story that renders
  // after a scroll moves the headings below it.
  await expect(async () => {
    const pending = await frame.locator('#storybook-docs .sb-story').evaluateAll(s => s.filter(e => !e.querySelector('[id$="-inner"] > *')).length)
    expect(pending).toBe(0)
  }).toPass({ timeout: 30_000 })
  /* And until the page has stopped growing. Rendered stories are not the
     end of it: the base example's open source block arrives later, with
     the syntax highlighter Storybook loads on demand. Measured on the
     "On this page" test, 2 runs in 10 even with one worker: the click
     scrolled to where Reference stood (scrollY 505), the code block then
     pushed it 234px down, and it rested at 274px instead of 40. */
  let last = -1
  await expect(async () => {
    const height = await frame.locator('body').evaluate(() => document.documentElement.scrollHeight)
    const settled = height === last
    last = height
    expect(settled, 'the page height, unchanged across 400ms').toBe(true)
  }).toPass({ timeout: 30_000, intervals: [400] })
  return frame
}

/* The chrome follows the page's theme when the sidebar's ground is the
   docs page's. Retried as a whole: switching a global reloads the
   preview iframe (Storybook's own doing, measured on the build before
   this spec existed too), and a read during the reload is lost. */
const sameGround = (page: Page) =>
  expect(async () => {
    const sidebar = await page.locator('.sidebar-container').evaluate(e => getComputedStyle(e).backgroundColor)
    const docs = await page.frameLocator('#storybook-preview-iframe').locator('body').evaluate(e => getComputedStyle(e).backgroundColor)
    expect(sidebar).toBe(docs)
  }).toPass({ timeout: 10_000 })

test.describe('the site around the pages', () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'dark-de', 'the chrome is the same in every pass')
    /* Two applications per page, not one: the manager, then the preview
       inside it, each from the dev server. Measured under load: 9s to
       the manager's load event and 10s more for the preview's runtime,
       so the 30s every other test gets ran out before the page appeared,
       on both tries. Tripled; what is asserted is unchanged. */
    test.slow()
  })

  test('title, theme, sidebar, toolbar', async ({ page }) => {
    const said = listen(page)
    const frame = await open(page, '/?path=/docs/components-button--docs&globals=theme:dark;locale:de-CH')

    await expect(page).toHaveTitle('Button – LCF Design System')
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')
    await sameGround(page)

    // Pages, not stories; and no Storybook icon on them.
    expect(await page.locator('.sidebar-item[data-nodetype="story"]').count(), 'stories in the sidebar').toBe(0)
    expect(await page.locator('.sidebar-item').count()).toBeGreaterThan(0)
    expect(await page.locator('.sidebar-item svg[type]').evaluateAll(s => s.filter(e => e.getBoundingClientRect().width > 0).length)).toBe(0)

    // The theme switch reaches the chrome and the page.
    await page.locator('.sb-bar button[aria-label^="Theme"]').click()
    await page.getByRole('option', { name: 'Light' }).click()
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe('light')
    await expect(frame.locator('html')).toHaveAttribute('data-theme', 'light')
    await sameGround(page)

    expect(signal(said), 'the console').toEqual([])
  })

  test('an overview card keeps the reader\'s theme and locale', async ({ page }) => {
    const frame = await open(page, '/?path=/docs/overview-introduction--docs&globals=theme:dark;locale:de-CH')
    await page.evaluate(() => ((window as unknown as { kept: boolean }).kept = true))
    await frame.locator('.lcf-doc-card-link', { hasText: 'Spinner' }).click()
    await expect(page).toHaveURL(/path=\/docs\/components-spinner--docs/)
    expect(new URL(page.url()).searchParams.get('globals')).toBe('theme:dark;locale:de-CH')
    await expect(frame.locator('html')).toHaveAttribute('data-theme', 'dark')
    // In the app, not by reloading it: what was set on the window is still there.
    expect(await page.evaluate(() => (window as unknown as { kept?: boolean }).kept)).toBe(true)
  })

  test('the sidebar shows where the keyboard is', async ({ page }) => {
    await open(page, '/?path=/docs/components-button--docs&globals=theme:dark')
    // Tab from the top until the list itself has focus: its links are tabindex=-1.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      if (await page.evaluate(() => document.activeElement?.id === 'storybook-explorer-menu')) break
    }
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('storybook-explorer-menu')
    const ringed = () =>
      page.evaluate(() =>
        [document.getElementById('storybook-explorer-menu')!, ...document.querySelectorAll('.sidebar-item')]
          .filter(e => getComputedStyle(e).outlineStyle !== 'none' && parseFloat(getComputedStyle(e).outlineWidth) >= 2)
          .map(e => (e as HTMLElement).dataset.itemId ?? e.id)
      )
    expect(await ringed(), 'a ring on landing').toHaveLength(1)
    // The page after Button in the sidebar, read from it: this said
    // Spinner until Field sorted in between.
    const next = await page.evaluate(() => {
      const ids = [...document.querySelectorAll<HTMLElement>('.sidebar-item')].map(e => e.dataset.itemId)
      return ids[ids.indexOf('components-button--docs') + 1]
    })
    expect(next, 'a page after Button').toBeTruthy()
    await page.keyboard.press('ArrowDown')
    await expect.poll(ringed, { message: 'the ring follows the arrow keys' }).toEqual([next])
  })

  /* "On this page" scrolls with a loop of scrollTo() and then focuses
     the heading; under base.css's smooth scrolling the two fought. Only
     inside the site: measured on the build before the fix, Reference
     stayed 788px down and Examples stopped 413px down in the manager,
     while iframe.html on its own landed both at 40 — so this is here, not
     in the docs sweep. Looked up by their words, which also holds the
     entries to sentence case: "EXAMPLES" was what the list once said. */
  test('"On this page" lands on the heading it names', async ({ page }) => {
    const frame = await open(page, '/?path=/docs/components-button--docs&globals=theme:dark')
    for (const label of ['Reference', 'Examples']) {
      const link = frame.locator('.toc-wrapper').getByRole('link', { name: label, exact: true })
      await expect(link, `"${label}" in the list`).toBeVisible()
      const target = (await link.getAttribute('href'))!.split('#')[1]!
      await link.click()
      // tocbot puts the heading 40px below the top (its scrollSmoothOffset).
      const top = () => frame.locator(`[id="${target}"]`).evaluate(e => Math.round(e.getBoundingClientRect().top))
      await expect.poll(async () => Math.abs((await top()) - 40) <= 2, { message: `${label}'s heading at 40px`, timeout: 5000 }).toBe(true)
    }
  })
})
