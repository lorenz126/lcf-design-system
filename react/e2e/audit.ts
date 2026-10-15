import type { Page } from '@playwright/test'

/**
 * The five questions, carried over from the Nuxt layer's page sweep
 * unchanged except for the token names. Each one is there because it
 * caught something nothing else could: a page that scrolls sideways at
 * phone width, a closed dialog taking up the whole viewport, a duplicate
 * id under aria-labelledby, a control with no name, and text that clears
 * AA in the token table and not where it actually landed.
 */

/** The DOM questions, asked inside the page. */
export function audit(page: Page) {
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
    //
    // One exception, by name: addon-a11y's colour-vision decorator
    // appends its filter definitions — <svg id="storybook-a11y-vision-
    // filters" aria-hidden="true">, 0×0, seven <filter id="storybook-a11y-
    // vision-…"> — to <body> once per rendered story. A story renders one;
    // a docs page renders one per story, so the Button page carried ten
    // identical copies. Nothing names anything with them: they are
    // referenced only by url(#…) from the vision tool, which manager.ts
    // hides. Excused as that one element and what is inside it, not as
    // a prefix and not as "anything aria-hidden".
    const seen = new Map<string, number>()
    for (const e of d.querySelectorAll('[id]')) {
      if (e.closest('body > svg#storybook-a11y-vision-filters[aria-hidden="true"]')) continue
      seen.set(e.id, (seen.get(e.id) ?? 0) + 1)
    }
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
    const relaxed = ['--warning-text', '--caution-text', '--warning-on-soft', '--caution-on-soft']
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
