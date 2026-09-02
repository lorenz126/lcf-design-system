#!/usr/bin/env node
/**
 * Contrast check for the colour tokens.
 *
 * Resolves tokens/color.css by hand rather than through a browser: the
 * whole point is that this runs in CI in milliseconds. That means
 * supporting the subset of CSS colour syntax the tokens actually use —
 * hex, rgb() with and without alpha, var() chains, and color-mix().
 *
 * The EXPECTATIONS table is the real content. Every pair carries the
 * ratio it must clear, and every relaxed pair carries the reason it is
 * relaxed. An exception without a reason is how a design system quietly
 * loses its floor.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
// geometry.css defines --focus-color in terms of --accent, so both files
// have to be in the map for the focus ring to resolve.
const css =
  readFileSync(join(root, 'tokens/color.css'), 'utf8') +
  '\n' +
  readFileSync(join(root, 'tokens/geometry.css'), 'utf8')

/* ---------- parse ---------- */

/** Strip comments, then collect custom properties per top-level block. */
function blocks(src) {
  const clean = src.replace(/\/\*[\s\S]*?\*\//g, '')
  const out = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m
  while ((m = re.exec(clean))) {
    const selector = m[1].trim()
    if (selector.startsWith('@')) continue // skip at-rules
    const decls = {}
    for (const line of m[2].split(';')) {
      const i = line.indexOf(':')
      if (i < 0) continue
      const prop = line.slice(0, i).trim()
      if (prop.startsWith('--')) decls[prop] = line.slice(i + 1).trim()
    }
    out.push({ selector, decls })
  }
  return out
}

/** Both :root and [data-theme=...] match <html>, so a theme map is every
 *  matching block merged in source order — later declarations win. */
function themeMap(parsed, theme) {
  const map = {}
  for (const { selector, decls } of parsed) {
    const matches = selector.split(',').some(s => {
      s = s.trim()
      return s === ':root' || s === `[data-theme="${theme}"]`
    })
    if (matches) Object.assign(map, decls)
  }
  return map
}

/* ---------- colour ---------- */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

/** The paren group starting at index `open`, closing paren included. */
function balanced(s, open) {
  let depth = 1
  let i = open
  while (i < s.length && depth > 0) {
    i++
    if (s[i] === '(') depth++
    else if (s[i] === ')') depth--
  }
  return s.slice(open, i + 1)
}

/** Split on top-level commas only. */
function splitTop(s) {
  const parts = []
  let depth = 0
  let cur = ''
  for (const ch of s) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      parts.push(cur)
      cur = ''
    } else cur += ch
  }
  parts.push(cur)
  return parts
}

/** Expand every var() in a value string, leaving other syntax intact. */
function expandVars(value, map, seen) {
  let v = String(value).trim()
  let guard = 0
  while (true) {
    const at = v.indexOf('var(')
    if (at < 0) return v
    if (++guard > 100) throw new Error(`var() loop in "${value}"`)
    const group = balanced(v, at + 3)
    const args = splitTop(group.slice(1, -1))
    const name = args[0].trim()
    let replacement
    if (map[name] !== undefined) {
      if (seen.has(name)) throw new Error(`circular var ${name}`)
      seen.add(name)
      replacement = map[name]
    } else if (args.length > 1) {
      replacement = args.slice(1).join(',').trim()
    } else {
      throw new Error(`undefined token ${name}`)
    }
    v = v.slice(0, at) + replacement + v.slice(at + 3 + group.length)
  }
}

/** Resolve a value to [r,g,b,a] with 0-255 channels. */
function resolve(value, map, seen = new Set()) {
  const v = expandVars(value, map, new Set(seen)).trim()
  if (v.startsWith('#')) return hex(v)
  if (v.startsWith('rgb')) return rgb(v)
  if (v.startsWith('color-mix')) return mix(v, map, seen)
  if (v === 'transparent') return [0, 0, 0, 0]
  const named = { white: '#ffffff', black: '#000000' }[v]
  if (named) return hex(named)
  throw new Error(`cannot parse colour "${v}"`)
}

function hex(h) {
  let s = h.slice(1)
  if (s.length === 3) s = [...s].map(c => c + c).join('')
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
    s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1
  ]
}

function rgb(v) {
  const body = balanced(v, v.indexOf('(')).slice(1, -1)
  const [colorPart, alphaPart] = body.split('/')
  const nums = colorPart.trim().split(/[\s,]+/).filter(Boolean).map(Number)
  const a = alphaPart === undefined ? 1 : Number(alphaPart.trim())
  return [nums[0], nums[1], nums[2], a]
}

function mix(v, map, seen) {
  const parts = splitTop(balanced(v, v.indexOf('(')).slice(1, -1))
  if (parts[0].trim() !== 'in srgb') {
    throw new Error(`only srgb color-mix is supported: ${v}`)
  }
  const parse = p => {
    const m = p.trim().match(/^(.*?)\s+([\d.]+)%$/)
    return m
      ? { c: resolve(m[1], map, seen), w: Number(m[2]) / 100 }
      : { c: resolve(p, map, seen), w: null }
  }
  const a = parse(parts[1])
  const b = parse(parts[2])
  const wa = a.w ?? 1 - (b.w ?? 0.5)
  const wb = b.w ?? 1 - wa
  const t = wa + wb
  return [0, 1, 2]
    .map(i => (a.c[i] * wa + b.c[i] * wb) / t)
    .concat((a.c[3] * wa + b.c[3] * wb) / t)
}

/** Flatten a translucent colour onto an opaque backdrop. */
const over = (fg, bg) =>
  [0, 1, 2].map(i => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat(1)

function luminance([r, g, b]) {
  const f = v => {
    const c = clamp(v, 0, 255) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/* ---------- what must hold ---------- */

const AA = 4.5
/** WCAG floor for large text and non-text UI components. */
const UI = 3.0

const HUES = ['yellow', 'green', 'blue', 'purple', 'red', 'orange']
/** Tuned for chroma over contrast — see the Colour principle. */
const LIGHT_HUES = ['yellow', 'orange']
const WHY_RELAXED =
  'chroma over contrast; at AA-legible lightness it reads brown'

function expectations() {
  const out = [
    { what: 'text/primary', fg: '--fg', bg: '--bg', min: AA },
    { what: 'text/muted', fg: '--fg-muted', bg: '--bg', min: AA },
    {
      what: 'text/subtle',
      fg: '--fg-subtle',
      bg: '--bg',
      min: UI,
      why: 'placeholders and metadata; never body copy'
    },
    {
      // --accent is a border, fill and focus colour. 3:1 is the WCAG
      // threshold for UI component boundaries; --accent-text is the
      // token for anything that has to be read.
      what: 'accent/ui',
      fg: '--accent',
      bg: '--bg',
      min: UI,
      why: 'borders, fills and focus rings — not text'
    },
    { what: 'accent/text', fg: '--accent-text', bg: '--bg', min: AA },
    { what: 'accent/hover', fg: '--accent-hover', bg: '--bg', min: AA },
    { what: 'solid/neutral', fg: '--bg', bg: '--fg', min: AA },
    // Text does not only appear on the page. A card, a well and a board
    // column are all backdrops something has to be read against.
    { what: 'text/primary on raised', fg: '--fg', bg: '--bg-raised', min: AA },
    { what: 'text/muted on raised', fg: '--fg-muted', bg: '--bg-raised', min: AA },
    { what: 'text/muted on sunken', fg: '--fg-muted', bg: '--bg-sunken', min: AA },
    {
      // Group headings and trailing notes inside a panel — a suggestion
      // list, a menu, a card footer.
      what: 'text/subtle on raised',
      fg: '--fg-subtle',
      bg: '--bg-raised',
      min: UI,
      why: 'headings and notes beside a label that carries the meaning'
    },
    {
      what: 'text/subtle on sunken',
      fg: '--fg-subtle',
      bg: '--bg-sunken',
      min: UI,
      why: 'counts and limits in a column header; never body copy'
    },
    { what: 'danger on sunken', fg: '--danger-text', bg: '--bg-sunken', min: AA },
    // A filled search field: its placeholder at rest, and on the deeper
    // ground it takes on hover and focus.
    {
      what: 'placeholder on fill',
      fg: '--fg-subtle',
      bg: '--fill-quiet',
      min: UI,
      why: 'placeholder text; the value typed over it is --fg'
    },
    {
      what: 'placeholder on fill, deep',
      fg: '--fg-subtle',
      bg: '--fill',
      min: UI,
      why: 'placeholder text; the value typed over it is --fg'
    },
    { what: 'search value', fg: '--fg', bg: '--fill', min: AA },
    {
      // A slider's handle sits INSIDE its track and takes --bg, which
      // puts it at 1.47:1 against the empty side in dark mode. The ring
      // is what makes it findable, so the ring is what gets measured.
      what: 'slider handle',
      fg: '--fg-muted',
      bg: '--fill-strong',
      min: UI,
      why: 'the edge of a control, not text'
    },
    // The row a sidebar marks as current: a neutral ground, on a panel.
    { what: 'nav current', fg: '--fg', bg: '--fill', on: '--bg-raised', min: AA },
    // The current row in a sidebar: accent text on the accent tint, on a
    // raised panel. The most important line in the navigation.
    // A destructive menu row, highlighted: red text on the neutral fill,
    // on a raised panel. The worst case in both themes, since the fill
    // moves the ground TOWARDS the text in each.
    {
      // A destructive menu row while the keyboard or pointer is on it.
      // The highlight moves the ground TOWARDS the text in both themes,
      // so this is the worst case a coloured row ever measures — and it
      // is why the highlight is --fill-quiet rather than --fill: at 9%
      // in dark mode the same row falls to 4.11:1.
      what: 'danger on highlight',
      fg: '--red-text',
      bg: '--fill-quiet',
      on: '--bg-raised',
      min: AA
    },
    // Chart marks are graphics, so 3:1 is the right threshold. Their
    // separation FROM EACH OTHER is a different question this script
    // cannot answer — that is the dataviz validator's six checks, and
    // the reason there are three of these and not six.
    { what: 'chart/1', fg: '--chart-1', bg: '--bg', min: UI, why: 'chart mark, not text' },
    { what: 'chart/2', fg: '--chart-2', bg: '--bg', min: UI, why: 'chart mark, not text' },
    { what: 'chart/3', fg: '--chart-3', bg: '--bg', min: UI, why: 'chart mark, not text' },
    {
      // outline-offset puts the ring on the PAGE, not on the control, so
      // that is what it has to contrast against. WCAG 2.4.11 wants 3:1
      // for a focus indicator.
      what: 'focus-ring',
      fg: '--focus-color',
      bg: '--bg',
      min: UI,
      why: 'focus indicator, graded against the page it sits on'
    },
    {
      // The same ring inside a raised panel — a menu row, a card. Dark
      // mode moves the ground two steps here, which is a different
      // measurement, not the same one rounded.
      what: 'focus-ring on raised',
      fg: '--focus-color',
      bg: '--fill-quiet',
      on: '--bg-raised',
      min: UI,
      why: 'focus indicator on a panel'
    }
  ]
  for (const h of HUES) {
    const relaxed = LIGHT_HUES.includes(h)
    const min = relaxed ? UI : AA
    const why = relaxed ? WHY_RELAXED : undefined
    out.push(
      { what: `text/${h}`, fg: `--${h}-text`, bg: '--bg', min, why },
      { what: `badge/${h}`, fg: `--${h}-badge-fg`, bg: `--${h}-badge-bg`, min, why },
      { what: `tinted/${h}`, fg: `--${h}-tint-fg`, bg: `--${h}-tint-bg`, min, why },
      // Solid takes white text always, so it must clear AA for every hue.
      { what: `solid/${h}`, fg: '--solid-fg', bg: `--${h}-solid-bg`, min: AA },
      // A diagram node: tinted ground on a card, outlined in the hue.
      // The outline carries the shape, so it is graded as a UI boundary.
      {
        what: `node-edge/${h}`,
        fg: `--${h}-text`,
        bg: '--bg-raised',
        min: UI,
        why: 'node outline, not text'
      },
      { what: `node-text/${h}`, fg: '--fg', bg: `--${h}-fill`, on: '--bg-raised', min: AA },
      // A banner's mark: the hue's own text on the hue's own tint. It is
      // a graphic rather than a label — the words beside it carry the
      // meaning and are set in --fg — so the UI floor applies.
      {
        what: `mark-on-tint/${h}`,
        fg: `--${h}-text`,
        bg: `--${h}-fill`,
        on: '--bg-raised',
        min: UI,
        why: 'an icon beside text that says the same thing'
      }
    )
  }
  return out
}

/* ---------- run ---------- */

const C = {
  dim: '\x1b[90m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  bold: '\x1b[1m',
  off: '\x1b[0m'
}

const parsed = blocks(css)
const rows = []
let failed = 0

for (const theme of ['light', 'dark']) {
  const map = themeMap(parsed, theme)

  for (const e of expectations()) {
    try {
      // A translucent colour has to be flattened onto whatever is really
      // behind it, and that is not always the page.
      const page = resolve(map[e.on ?? '--bg'], map)
      const bg = over(resolve(map[e.bg], map), page)
      const fg = over(resolve(map[e.fg], map), bg)
      const r = ratio(fg, bg)
      const ok = r >= e.min
      if (!ok) failed++
      rows.push({ theme, what: e.what, ratio: r, min: e.min, ok, note: e.why ?? '' })
    } catch (err) {
      failed++
      rows.push({ theme, what: e.what, ratio: null, min: e.min, ok: false, note: err.message })
    }
  }
}

const W = Math.max(...rows.map(r => r.what.length))
let lastTheme = ''
for (const r of rows) {
  if (r.theme !== lastTheme) {
    console.log(`\n  ${C.bold}${r.theme.toUpperCase()}${C.off}`)
    lastTheme = r.theme
  }
  const mark = r.ok ? `${C.green}PASS${C.off}` : `${C.red}FAIL${C.off}`
  const val = r.ratio === null ? '  ERR' : r.ratio.toFixed(2).padStart(5)
  const need = `min ${r.min.toFixed(1)}`.padEnd(8)
  const note = r.note ? `  ${C.dim}${r.note}${C.off}` : ''
  console.log(`  ${mark}  ${r.what.padEnd(W)}  ${val}:1  ${need}${note}`)
}

const relaxed = rows.filter(r => r.min < AA && r.ratio !== null).length
console.log(
  `\n  ${rows.length} pairs checked, ${failed} failing` +
    (relaxed ? `, ${relaxed} held to the ${UI.toFixed(1)} UI floor by decision` : '') +
    '\n'
)
process.exit(failed ? 1 : 0)
