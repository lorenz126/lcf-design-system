import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { audit, paintSource, type Paint } from './audit'
import { SRC, docsId, listen, localeOf, signal, sourceFiles, storiesMetaId } from './sweep'

/**
 * Every docs page, loaded the way a reader gets it, and the same six
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
 * file (its meta's id or title). Storybook answers an id it does not
 * know with its error display — body.sb-show-errordisplay and "Couldn't
 * find story matching '<id>'" — which fails the test, so the derivation
 * checks itself.
 *
 * Beyond the six questions, what the page around the stories owes a
 * reader, each found broken by hand once:
 *
 * - every example's code, opened, in the system's code style — the
 *   sweep never pressed "Show code", and the black slab Storybook paints
 *   there passes every contrast check;
 * - a visible ring on every control of the page's own (not the
 *   stories'), in both themes;
 * - headings named by their text alone;
 * - a link a story renders does not take the reader off the site;
 * - 320px as well as 390: the reflow width, where the props table had
 *   pushed every component page 34px sideways.
 */

const mdxPages = sourceFiles(SRC, '.mdx').map(file => {
  const title = readFileSync(file, 'utf8').match(/<Meta\s+title="([^"]+)"/)?.[1]
  // An MDX page attached to stories (<Meta of={…} />) takes its id from
  // them; nothing here derives that yet, so it stops rather than guesses.
  if (!title) throw new Error(`${file}: no <Meta title="…" /> — derive this page's id before adding it`)
  return title
})
const componentPages = sourceFiles(SRC, '.stories.tsx').map(storiesMetaId)
const pages = [...mdxPages, ...componentPages].map(docsId)

async function load(page: Page, id: string, globals: string) {
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
}

/**
 * The page's own controls — not the stories', which are the components
 * the page documents — each with a ring that can be seen: an outline at
 * least 2px wide, 3:1 against what it is drawn on. Storybook's rings
 * were its light theme's #171717 on the dark page, 1.10:1, and no check
 * could see it.
 *
 * Focused from script after one Tab, so the browser treats the focus as
 * keyboard focus and :focus-visible applies, as it does for a reader
 * tabbing through.
 */
async function focusRings(page: Page) {
  await page.keyboard.press('Tab')
  return page.evaluate(paintSource => {
    const { parse, ratio, ground } = new Function(`return (${paintSource})()`)() as Paint
    const faint: string[] = []
    const name = (e: Element) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} “${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 20)}”`
    const controls = [...document.querySelectorAll<HTMLElement>('.sbdocs a[href], .sbdocs button, .sbdocs summary, .sbdocs [tabindex]')]
      .filter(e => e.tabIndex >= 0 && !(e as HTMLButtonElement).disabled && !e.closest('.docs-story, .sb-story, .docs-hero'))
      .filter(e => e.getBoundingClientRect().width > 0)
    for (const e of controls) {
      e.focus({ preventScroll: true })
      // The ring it settles on. Storybook's code block has `transition:
      // all`, 0s — which base.css turns into 0.01ms under reduced motion,
      // so read at once the outline was still its start value (3px white).
      for (const a of e.getAnimations()) a.finish()
      if (!e.matches(':focus-visible')) {
        faint.push(`no keyboard focus: ${name(e)}`)
        continue
      }
      const cs = getComputedStyle(e)
      const ring = parse(cs.outlineColor)
      // An outline drawn inside sits on the control; outside, on its parent.
      const under = ground(parseFloat(cs.outlineOffset) < 0 ? e : e.parentElement ?? e)
      if (cs.outlineStyle === 'none' || parseFloat(cs.outlineWidth) < 2 || !ring) faint.push(`no ring: ${name(e)}`)
      else if (under && ratio(ring, under) < 3) faint.push(`ring ${ratio(ring, under).toFixed(2)}:1: ${name(e)}`)
    }
    ;(document.activeElement as HTMLElement | null)?.blur()
    return [...new Set(faint)].slice(0, 8)
  }, paintSource)
}

/** Every heading named by its text: Storybook's copy-link button inside it is out of the accessibility tree and the Tab order. */
function headingLinks(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('.sbdocs-content :is(h1, h2, h3, h4, h5, h6) a')]
      .filter(a => a.getAttribute('aria-hidden') !== 'true' || (a as HTMLElement).tabIndex >= 0)
      .map(a => `“${a.closest('h1, h2, h3, h4, h5, h6')!.textContent!.trim()}” names its link`)
  )
}

/**
 * Every block of code on the page, open, in the system's code style: the
 * ground --bg-raised and a tag or keyword in --discovery-text. Opening
 * one is what a reader does to copy an example; Storybook's own style
 * there (rgba(0,0,0,.85), its hex palette) passes the contrast check, so
 * only a check of the style itself can see it come back.
 */
async function codeStyle(page: Page) {
  const closed = page.locator('.sbdocs-preview-actions .docblock-code-toggle:not(.docblock-code-toggle--expanded)')
  // One at a time from the first: an opened toggle leaves the selection.
  for (let n = await closed.count(); n > 0; n--) await closed.first().click()
  await page.waitForTimeout(150)
  return page.evaluate(() => {
    const probe = (prop: 'color' | 'backgroundColor', token: string) => {
      const s = document.createElement('span')
      s.style[prop] = `var(${token})`
      document.body.appendChild(s)
      const v = getComputedStyle(s)[prop]
      s.remove()
      return v
    }
    const raised = probe('backgroundColor', '--bg-raised')
    const tag = probe('color', '--discovery-text')
    const wrong: string[] = []
    const blocks = [
      ...[...document.querySelectorAll<HTMLElement>('.sbdocs-preview > div[id] > div')].map(e => ({ e, what: 'an example’s code' })),
      ...[...document.querySelectorAll<HTMLElement>('.docblock-source')].map(e => ({ e, what: 'a code block' }))
    ]
    for (const { e, what } of blocks) {
      const bg = getComputedStyle(e).backgroundColor
      if (bg !== raised) wrong.push(`${what} on ${bg}, not --bg-raised (${raised})`)
      const token = e.querySelector('.token:is(.tag, .keyword):not(.punctuation, .class-name)')
      if (token && getComputedStyle(token).color !== tag) {
        wrong.push(`${what}: “${token.textContent!.trim().slice(0, 12)}” in ${getComputedStyle(token).color}, not --discovery-text (${tag})`)
      }
    }
    // Something must have been measured, or a renamed class passes this.
    if (!blocks.length && document.querySelector('.sbdocs-content pre')) wrong.push('code on the page, but no block this recognises')
    return [...new Set(wrong)].slice(0, 6)
  })
}

/**
 * A link a story renders stays on the page. The iframe has <base
 * target="_parent">, so a plain <a href="#offers"> in an example replaced
 * the whole site with iframe.html#offers. Clicked for real, as a reader
 * would: the address must not change, and the console check after this
 * catches anything the click threw.
 */
async function storyLinks(page: Page) {
  const left: string[] = []
  const before = page.url()
  for (const link of await page.locator('.docs-story a[href], .docs-hero a[href]').all()) {
    await link.click()
    await page.waitForTimeout(100)
    if (page.url() !== before) {
      left.push(`“${(await link.textContent())?.trim()}” went to ${page.url()}`)
      break
    }
  }
  return left
}

for (const id of pages) {
  test(id, async ({ page }, info) => {
    const said = listen(page)
    const globals = (info.project.metadata as { globals?: string }).globals ?? ''
    await load(page, id, globals)

    // The page follows the theme switch the way an app does: on <html>.
    const want = globals.includes('theme:dark') ? 'dark' : 'light'
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(want)

    expect(signal(said), 'the console while loading').toEqual([])
    const locale = localeOf(globals)
    expect(await audit(page, locale), 'at 1280').toEqual([])
    // Soft from here: each question is its own, and one failing should
    // not hide the next.
    expect.soft(await headingLinks(page), 'heading names').toEqual([])
    expect.soft(await focusRings(page), 'focus rings').toEqual([])
    expect.soft(await storyLinks(page), 'links in the stories').toEqual([])

    expect.soft(await codeStyle(page), 'the code, every example open').toEqual([])
    expect.soft(await audit(page, locale), 'at 1280, every example open').toEqual([])

    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 760 })
      await page.waitForTimeout(150)
      expect.soft(await audit(page, locale), `at ${width}`).toEqual([])
    }
    expect(signal(said), 'the console, after all of it').toEqual([])
  })
}
