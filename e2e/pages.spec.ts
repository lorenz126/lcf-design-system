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

    // Text that cannot be read against what it is actually on.
    //
    // check-contrast measures TOKENS against the grounds they were
    // designed for. This measures RENDERED text against whatever it
    // landed on, compositing every translucent layer up to the page —
    // which is how a tint recipe calibrated against the page fails at
    // 4.04:1 on a raised panel, and how a blue badge that clears AA on
    // white measures 2.96:1 on a dark sidebar.
    //
    // The rules are the system's own: 4.5 for text, 3.0 for large text,
    // and 3.0 for anything painted --fg-subtle, which check-contrast
    // holds to that floor by decision. Deliberately faded things —
    // disabled, opacity below one anywhere up the chain — are excused,
    // and so is anything hidden from assistive technology.
    // Two syntaxes come back from getComputedStyle: `rgb(r g b / a)` in
    // 0–255, and — for anything that went through color-mix — `color(srgb
    // r g b / a)` in 0–1. Read as 0–255, the second is near-black, every
    // ground goes dark, and every ratio is fiction. Measured: a blue badge
    // reported at 3.15:1 that was really 5.4.
    const parse = (s: string) => {
      const m = s.match(/-?[\d.]+(?:e-?\d+)?/g)
      if (!m) return null
      const unit = s.startsWith('color(') ? 255 : 1
      const [r, g, b, a = 1] = m.map(Number)
      return [r! * unit, g! * unit, b! * unit, a] as [number, number, number, number]
    }
    const lin = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
    const lum = ([r, g, b]: number[]) => 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!)
    const over = (top: number[], under: number[]) => {
      const a = top[3]!
      return [0, 1, 2].map(i => top[i]! * a + under[i]! * (1 - a)).concat([1])
    }
    const ratio = (a: number[], b: number[]) => {
      const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x)
      return (h! + 0.05) / (l! + 0.05)
    }
    const tokenColor = (name: string) => {
      const s = d.createElement('span')
      s.style.color = `var(${name})`
      d.body.appendChild(s)
      const c = parse(getComputedStyle(s).color)
      s.remove()
      return c
    }
    const subtle = tokenColor('--fg-subtle')
    // Yellow and orange are held to 3.0 by decision — at the lightness
    // AA needs they read as brown — and check-contrast records that
    // under LIGHT_HUES. The same decision, applied to pixels: text
    // painted in either hue's own colour is held to the same floor.
    const relaxed = ['--yellow-text', '--orange-text', '--yellow-badge-fg', '--orange-badge-fg', '--yellow-tint-fg', '--orange-tint-fg']
      .map(tokenColor).filter(Boolean).map(c => c!.slice(0, 3).join())
    const same = (a: number[] | null, key: string) => !!a && a.slice(0, 3).join() === key
    const page = parse(getComputedStyle(d.body).backgroundColor) ?? [255, 255, 255, 1]
    // The ground, or null when it cannot be known: a gradient or an
    // image is a background-image, not a background-color, and text over
    // one has no single ratio. Glass buttons live on exactly that — the
    // component says so, and says its contrast cannot be guaranteed —
    // and measuring them against the page underneath the gradient
    // reported 3.56:1 for a label that is sitting on something else.
    const ground = (el: Element) => {
      let acc: number[] | null = null
      let e: Element | null = el
      while (e) {
        const cs = getComputedStyle(e)
        if (cs.backgroundImage !== 'none') return null
        const bg = parse(cs.backgroundColor)
        if (bg && bg[3] > 0) acc = acc ? over(acc, bg) : bg
        if (acc && acc[3]! >= 1) break
        e = e.parentElement
      }
      return acc ? (acc[3]! >= 1 ? acc : over(acc, page)) : page
    }
    const faint: string[] = []
    for (const el of d.querySelectorAll('body *')) {
      const text = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent!.trim()).join('')
      if (text.length < 2) continue
      // An emoji paints itself; its `color` is meaningless.
      if (!/[\p{L}\p{N}]/u.test(text)) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none') continue
      if (el.closest('[aria-hidden="true"]')) continue
      let opacity = 1
      for (let e: Element | null = el; e && e !== d.body; e = e.parentElement) opacity *= parseFloat(getComputedStyle(e).opacity)
      if (opacity < 0.99) continue
      const fg = parse(cs.color)
      if (!fg) continue
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      const bg = ground(el)
      if (!bg) continue
      const got = ratio(over(fg, bg), bg)
      const size = parseFloat(cs.fontSize)
      const large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight) >= 600)
      const isSubtle = same(fg, subtle ? subtle.slice(0, 3).join() : '')
      const isRelaxed = relaxed.some(k => same(fg, k))
      const need = large || isSubtle || isRelaxed ? 3 : 4.5
      if (got < need) faint.push(`${got.toFixed(2)}:1 (needs ${need}) ${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} “${text.slice(0, 24)}”`)
    }
    if (faint.length) findings.push(`text too faint to read: ${faint.sort().slice(0, 5).join(' · ')}`)

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
