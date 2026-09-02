import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'

/**
 * Every page, loaded, and four questions asked of it.
 *
 * This used to be run by hand in a browser pane, three times, and it
 * found a hydration mismatch on all fifty pages, a full-viewport blank
 * block on all fifty pages, and eight workshop defects — none of which
 * the build, the unit tests or the typecheck could see. It is a script
 * now, because a check that lives in somebody's memory is a check that
 * runs only when they remember.
 *
 * The routes are DERIVED from the pages directory, the same way
 * check-pages derives them, so a new component's page is swept the
 * moment it exists and nobody has to add it to a list.
 */

const ROOT = join(import.meta.dirname, '..')
const TIERS = ['atoms', 'molecules', 'organisms', 'templates']

const routes = [
  '/',
  '/type',
  '/color',
  ...TIERS.flatMap(tier =>
    readdirSync(join(ROOT, '.playground/app/pages', tier))
      .filter(f => f.endsWith('.vue'))
      .map(f => `/${tier}/${f.replace(/\.vue$/, '')}`)
  )
]

/** What the browser said while the page loaded. Warnings count: a Vue
 *  warning is a defect that has not become an error yet. */
function listen(page: Page) {
  const said: string[] = []
  page.on('console', m => {
    if (m.type() === 'warning' || m.type() === 'error') said.push(`${m.type()}: ${m.text()}`)
  })
  page.on('pageerror', e => said.push(`pageerror: ${e.message}`))
  return said
}

/* Dev-server chatter that is not about the page. Each entry says what it
   is, so a new one is added knowingly rather than by widening a regex. */
const NOISE = [
  /Could not fetch the app manifest/, // a transient after the server restarts
  /\[vite\]/, // HMR housekeeping
  /Suspense> is an experimental feature/ // Nuxt's own, on every page
]
const signal = (lines: string[]) => lines.filter(l => !NOISE.some(n => n.test(l)))

/** The DOM questions, asked inside the page. */
function audit(page: Page) {
  return page.evaluate(() => {
    const findings: string[] = []
    const d = document
    const root = d.documentElement

    // The page must not scroll sideways.
    if (root.scrollWidth > root.clientWidth + 1) {
      const worst = [...d.querySelectorAll('*')]
        .filter(e => {
          const r = e.getBoundingClientRect()
          return r.width > 0 && r.right > root.clientWidth + 1
        })
        .slice(0, 3)
        .map(e => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`)
      findings.push(`scrolls sideways by ${root.scrollWidth - root.clientWidth}px — ${worst.join(', ')}`)
    }

    // Nothing hidden may take up room: the closed-dialog class of bug.
    for (const e of d.querySelectorAll('dialog:not([open]), [popover]:not(:popover-open)')) {
      const r = e.getBoundingClientRect()
      if (r.width > 1 || r.height > 1) {
        findings.push(`closed ${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} is ${Math.round(r.width)}×${Math.round(r.height)}`)
      }
    }

    // An id is a promise of uniqueness; aria-labelledby relies on it.
    const seen = new Map<string, number>()
    for (const e of d.querySelectorAll('[id]')) seen.set(e.id, (seen.get(e.id) ?? 0) + 1)
    const dup = [...seen].filter(([, n]) => n > 1).map(([id]) => id)
    if (dup.length) findings.push(`duplicate id: ${dup.slice(0, 5).join(', ')}`)

    // Interactive, and nothing says what it is.
    const named = (e: Element) =>
      (e.textContent ?? '').trim() ||
      e.getAttribute('aria-label') ||
      e.getAttribute('aria-labelledby') ||
      e.getAttribute('title') ||
      ((e as HTMLInputElement).labels?.length ?? 0) > 0
    const anon = [...d.querySelectorAll(
      'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=option], [role=tab], [role=treeitem]'
    )]
      .filter(e => !named(e))
      .map(e => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`)
    if (anon.length) findings.push(`no accessible name: ${[...new Set(anon)].slice(0, 5).join(', ')}`)

    return findings
  })
}

for (const route of routes) {
  test(route, async ({ page }) => {
    const said = listen(page)
    await page.goto(route, { waitUntil: 'networkidle' })
    /* Hydration and onMounted have run by now; a beat more lets a
       ResizeObserver settle. */
    await page.waitForTimeout(300)

    expect(signal(said), 'the console while loading').toEqual([])

    expect(await audit(page), 'at 1280').toEqual([])

    /* The phone width, on the same load. */
    await page.setViewportSize({ width: 390, height: 760 })
    await page.waitForTimeout(150)
    expect(await audit(page), 'at 390').toEqual([])
  })
}
