#!/usr/bin/env node
/**
 * Layer check for the atomic structure.
 *
 * Atomic Design's categories are partly judgement — reasonable people
 * disagree about whether a Card is a molecule or an organism. The
 * DEPENDENCY DIRECTION is not a judgement call, and it is the part that
 * rots without enforcement:
 *
 *   atoms      may use atoms
 *   molecules  may use atoms and molecules
 *   organisms  may use anything below templates
 *   templates  may use anything
 *
 * Same tier is allowed, and deliberately: Button uses Spinner and Input
 * uses Field, both atoms, because the alternative is every atom keeping
 * its own copy of a thing that was never bigger than an atom.
 *
 * So that is what this checks. It deliberately says nothing about whether
 * a component sits in the right tier — only that it does not reach upward.
 *
 * Only the <template> block is scanned. Doc comments in <script> show
 * example markup, and counting those would report Icon.vue as using
 * itself.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const UI = join(root, 'ui')

/** Index is the rank: a tier may only use tiers at a lower index. */
const TIERS = ['atoms', 'molecules', 'organisms', 'templates']

/* ---------- collect ---------- */

/** name -> tier, e.g. Button -> atoms */
const home = new Map()
const files = []

for (const [rank, tier] of TIERS.entries()) {
  const dir = join(UI, tier)
  if (!existsSync(dir)) continue
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.vue')) continue
    const name = file.replace(/\.vue$/, '')
    if (home.has(name)) {
      console.error(`  duplicate component name: ${name}`)
      process.exit(1)
    }
    home.set(name, { tier, rank })
    files.push({ name, tier, rank, path: join(dir, file) })
  }
}

/** The <template> block only — see the note above. */
function template(src) {
  const open = src.indexOf('<template>')
  if (open < 0) return ''
  const close = src.lastIndexOf('</template>')
  return src.slice(open, close < 0 ? undefined : close)
}

/** <UiButton> / <UiIcon ... /> -> Button, Icon. Self-references dropped. */
function usedBy(file) {
  const tpl = template(readFileSync(file.path, 'utf8'))
  const names = new Set()
  for (const m of tpl.matchAll(/<Ui([A-Z][A-Za-z0-9]*)/g)) {
    if (m[1] !== file.name) names.add(m[1])
  }
  return [...names]
}

/* ---------- check ---------- */

const problems = []
const edges = []

for (const file of files) {
  for (const used of usedBy(file)) {
    const target = home.get(used)
    if (!target) {
      problems.push({
        file,
        msg: `uses <Ui${used}>, which is not a component in ui/`
      })
      continue
    }
    edges.push({ from: file, used, target })
    if (target.rank > file.rank) {
      problems.push({
        file,
        msg: `uses <Ui${used}> (${target.tier}) — ${file.tier} may not reach up into ${target.tier}`
      })
    }
  }
}

/* ---------- report ---------- */

const C = { dim: '\x1b[90m', red: '\x1b[31m', green: '\x1b[32m', bold: '\x1b[1m', off: '\x1b[0m' }

for (const tier of TIERS) {
  const inTier = files.filter(f => f.tier === tier)
  const label = `${C.bold}${tier}${C.off}`.padEnd(24)
  if (!inTier.length) {
    console.log(`\n  ${label}${C.dim}empty${C.off}`)
    continue
  }
  console.log(`\n  ${label}${C.dim}${inTier.length}${C.off}`)
  for (const f of inTier) {
    const uses = edges.filter(e => e.from.name === f.name)
    const detail = uses.length
      ? `${C.dim}uses ${uses.map(u => u.used).join(', ')}${C.off}`
      : ''
    const bad = problems.some(p => p.file.name === f.name)
    console.log(`    ${bad ? C.red + 'FAIL' + C.off : C.green + 'ok  ' + C.off}  ${f.name.padEnd(12)} ${detail}`)
  }
}

if (problems.length) {
  console.log(`\n  ${C.red}${problems.length} violation(s)${C.off}`)
  for (const p of problems) {
    console.log(`    ${p.file.tier}/${p.file.name}.vue  ${p.msg}`)
  }
  console.log()
  process.exit(1)
}

console.log(`\n  ${files.length} components, no upward dependencies\n`)
