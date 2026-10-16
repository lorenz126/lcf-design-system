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
 *
 * AN APP'S OWN COLOURS are checked the same way. Pass its theme file —
 * the stylesheet where it sets --accent, --accent-text and --accent-solid-bg
 * — and it is read after the tokens, so its declarations win exactly as
 * they will in the browser:
 *
 *   npx lcf-check-contrast src/theme.css
 *
 * Every pair below is then measured against the app's colours. A brand
 * red that is a fine focus ring and too light to carry white text fails
 * here, in the app's CI, before it reaches a button.
 *
 * An entry may also carry `anyOf`, a list of pairs of which ONE has to
 * clear the floor. That is not a loophole, it is a shape that occurs:
 * a slider's handle is findable by its own lightness against the track
 * OR by the hairline around it, and which of the two does the work flips
 * between themes. Requiring both would fail a control that is perfectly
 * legible; requiring neither would measure nothing. The report prints
 * whichever one is carrying it.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve as resolvePath } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
// geometry.css defines --focus-color in terms of --accent, so both files
// have to be in the map for the focus ring to resolve. An app's theme
// files come last, so they override as the cascade would.
const appThemes = process.argv.slice(2)
const css = [
  join(root, 'src/tokens/color.css'),
  join(root, 'src/tokens/geometry.css'),
  ...appThemes.map(f => resolvePath(process.cwd(), f))
].map(f => readFileSync(f, 'utf8')).join('\n')
if (appThemes.length) console.log(`\n  with ${appThemes.join(', ')} over the tokens`)

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
      // [data-theme] alone is a block re-declared on every theme root.
      return s === ':root' || s === '[data-theme]' || s === `[data-theme="${theme}"]`
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
  /* A weight is a percentage, or `calc(<number> * 100%)` — which is how
     a fill written as `rgb(hue / var(--fill-alpha))` says the same 14%
     once it is flattened with color-mix. Unread, the calc fell through
     to the default of 50%, and every hue fill measured a mid-tone that
     nothing on any page actually paints. */
  const weight = w => {
    const pct = w.match(/^([\d.]+)%$/)
    if (pct) return Number(pct[1]) / 100
    const calc = w.match(/^calc\(\s*([\d.]+)\s*\*\s*100%\s*\)$/)
    if (calc) return Number(calc[1])
    throw new Error(`cannot read a color-mix weight from "${w}"`)
  }
  const parse = p => {
    const m = p.trim().match(/^(.*?)\s+((?:[\d.]+%)|(?:calc\([^)]*\)))$/)
    return m
      ? { c: resolve(m[1], map, seen), w: weight(m[2]) }
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
const INTENTS = ['primary', 'secondary', 'info', 'success', 'warning', 'caution', 'danger', 'discovery']
/** warning is orange and caution is yellow — the two LIGHT_HUES. */
const RELAXED_INTENTS = ['warning', 'caution']
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
      /* THE ONE KNOWING EXCEPTION IN THIS TABLE.
         A slider handle is light in both themes. In dark that is 13:1
         against the track and needs nothing else; in light it is 1.32:1,
         and the only way to raise it is the hard outline the design
         deliberately does not have. Every platform makes the same trade
         and carries it on the shadow instead.
         It stays measured rather than deleted, at a floor that says what
         it is: if the palette ever moves enough to break even this, the
         row goes red and somebody has to look again. */
      what: 'slider handle',
      fg: '--solid-fg',
      bg: '--fill-strong',
      min: 1.25,
      why: 'RELAXED: the raised silhouette carries this one, not the colour'
    },
    // The row a sidebar marks as current: a neutral ground, on a panel.
    { what: 'nav current', fg: '--fg', bg: '--fill', on: '--bg-raised', min: AA },
    // The count beside a tab label. It is a number someone reads, not a
    // dot, so it is held to AA and not to the UI floor — and it sits on
    // the same neutral fill the tab itself uses when it is the open one.
    { what: 'tab count', fg: '--fg-muted', bg: '--fill', min: AA },
    // A combobox chip: the label of something already chosen, on the
    // same neutral fill, and read rather than glanced at.
    { what: 'combobox chip', fg: '--fg', bg: '--fill', on: '--bg-raised', min: AA },
    { what: 'tab count, open', fg: '--fg', bg: '--fill', min: AA },
    // A toggle button that is on: the neutral "here".
    { what: 'button selected', fg: '--fg', bg: '--fill-strong', min: AA },
    { what: 'button selected on raised', fg: '--fg', bg: '--fill-strong', on: '--bg-raised', min: AA },
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
  /* THE INTENT TIER — what components actually read. Each of these is
     an alias of a recipe measured above, so with the shipped tokens they
     pass for the same reason; they are listed because an app overriding
     --accent changes `primary` and nothing else, and this is where that
     shows. */
  for (const c of INTENTS) {
    const relaxed = RELAXED_INTENTS.includes(c)
    const min = relaxed ? UI : AA
    const why = relaxed ? WHY_RELAXED : undefined
    out.push(
      { what: `${c}/solid`, fg: `--${c}-on-solid`, bg: `--${c}-solid`, min: AA },
      { what: `${c}/soft`, fg: `--${c}-on-soft`, bg: `--${c}-soft`, min, why },
      { what: `${c}/soft on raised`, fg: `--${c}-on-soft`, bg: `--${c}-soft`, on: '--bg-raised', min, why },
      { what: `${c}/text`, fg: `--${c}-text`, bg: '--bg', min, why },
      // An alert: the words are --fg and --fg-muted ON the colour's tint,
      // the mark is the colour. Words at AA, the mark as a graphic.
      { what: `${c}/alert title`, fg: '--fg', bg: `--${c}-soft`, on: '--bg-raised', min: AA },
      { what: `${c}/alert body`, fg: '--fg-muted', bg: `--${c}-soft`, on: '--bg-raised', min: AA },
      { what: `${c}/alert mark`, fg: `--${c}-text`, bg: `--${c}-soft`, on: '--bg-raised', min: UI, why: 'an icon beside text that says the same thing' },
      { what: `${c}/text on raised`, fg: `--${c}-text`, bg: '--bg-raised', min, why },
      c === 'secondary'
        ? /* A NEUTRAL OUTLINE IS A HAIRLINE, and measured as one. The
             outline button has always drawn --border-strong; what makes
             it a control is its label, which is --fg at 17:1. WCAG 1.4.11
             asks 3:1 of a boundary only where the boundary is what
             identifies the control. Held at a floor that says what it is,
             so that a palette move that drops it further turns this red. */
          { what: `${c}/border`, fg: `--${c}-border`, bg: '--bg', min: 1.3, why: 'RELAXED: a hairline; the label names the control' }
        : { what: `${c}/border`, fg: `--${c}-border`, bg: '--bg', min: UI, why: 'an outline, not text' }
    )
  }
  for (const h of HUES) {
    const relaxed = LIGHT_HUES.includes(h)
    const min = relaxed ? UI : AA
    const why = relaxed ? WHY_RELAXED : undefined
    out.push(
      { what: `text/${h}`, fg: `--${h}-text`, bg: '--bg', min, why },
      { what: `badge/${h}`, fg: `--${h}-badge-fg`, bg: `--${h}-badge-bg`, min, why },
      { what: `tinted/${h}`, fg: `--${h}-tint-fg`, bg: `--${h}-tint-bg`, min, why },
      // The same two, ON A PANEL. A badge fill is translucent, so what
      // it composites against decides the number — and a sidebar, a
      // card and a board column are all --bg-raised, not --bg. The page
      // sweep measured a blue badge at 2.96:1 on a dark sidebar while
      // this file said 4.5 on the page. Both were right.
      { what: `badge/${h} on raised`, fg: `--${h}-badge-fg`, bg: `--${h}-badge-bg`, on: '--bg-raised', min, why },
      { what: `tinted/${h} on raised`, fg: `--${h}-tint-fg`, bg: `--${h}-tint-bg`, on: '--bg-raised', min, why },
      // And on the CURRENT ROW of a sidebar: the badge's fill, on the
      // row's fill, on the panel. Three translucent layers is where a
      // recipe calibrated against the page goes furthest from it.
      { what: `badge/${h} on current row`, fg: `--${h}-badge-fg`, bg: `--${h}-badge-bg`, on: ['--fill', '--bg-raised'], min, why },
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
      const pairs = e.anyOf ?? [e]
      // A translucent colour has to be flattened onto whatever is really
      // behind it, and that is not always the page.
      const ratios = pairs.map(p => {
        /* `on` may be a CHAIN, innermost first, because the ground under
           a thing is not always one layer. A badge on the current row of
           a sidebar sits on --fill, which is translucent, which sits on
           --bg-raised: two translucent layers before the page. The page
           sweep measured that badge at 2.87:1 while every single-ground
           pair here passed. Folded from the outside in. */
        const layers = [].concat(p.on ?? e.on ?? '--bg')
        const page = layers.reduceRight(
          (under, token) => over(resolve(map[token], map), under),
          resolve(map['--bg'], map)
        )
        const bg = over(resolve(map[p.bg], map), page)
        const fg = over(resolve(map[p.fg], map), bg)
        return { r: ratio(fg, bg), by: p.by }
      })
      // The one carrying it, or the closest one when none of them is.
      const best = ratios.reduce((a, b) => (b.r > a.r ? b : a))
      const r = best.r
      const ok = r >= e.min
      if (!ok) failed++
      const note = [e.why, e.anyOf && best.by].filter(Boolean).join(' · ')
      rows.push({ theme, what: e.what, ratio: r, min: e.min, ok, note })
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

/* Counted apart, because they are different admissions. A pair at the UI
   floor is a graphic being graded as one; a pair below it is a place
   where colour is not what carries the thing, and that should never be
   buried in the same number. */
const atUi = rows.filter(r => r.ratio !== null && r.min < AA && r.min >= UI).length
/* By what it MEASURES, not by what it is allowed: a relaxed pair that
   clears the floor anyway is not relying on anything. */
const below = rows.filter(r => r.ratio !== null && r.ratio < UI)
console.log(
  `\n  ${rows.length} pairs checked, ${failed} failing` +
    (atUi ? `\n  ${atUi} held to the ${UI.toFixed(1)} UI floor by decision` : '') +
    (below.length
      ? `\n  ${C.bold}${below.length} below it${C.off}, each carried by something other than colour:` +
        below.map(r => `\n    ${r.what} (${r.theme}) ${r.ratio.toFixed(2)}:1`).join('')
      : '') +
    '\n'
)
process.exit(failed ? 1 : 0)
