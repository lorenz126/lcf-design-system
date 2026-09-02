/**
 * Every component has a page, and every page has a component.
 *
 * The navigation used to carry a hand-written path per item, which was a
 * second place for the answer to live and drifted whenever a component
 * moved. Routes are derived now — so what is left to check is that both
 * lists agree with `ui/`, in both directions.
 *
 * The direction that catches real rot is the second one: a component
 * added to ui/ with no page is a component nobody can look at, and
 * nothing else in the build says so.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const TIERS = ['atoms', 'molecules', 'organisms', 'templates']

const slug = n => n.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const list = (dir, ext) =>
  readdirSync(join(root, dir)).filter(f => f.endsWith(ext)).map(f => f.slice(0, -ext.length))

const nav = readFileSync(join(root, '.playground/app/data/nav.ts'), 'utf8')

let bad = 0
const say = (mark, text) => console.log(`  ${mark}  ${text}`)

for (const tier of TIERS) {
  const components = list(join('ui', tier), '.vue')
  const pages = new Set(list(join('.playground/app/pages', tier), '.vue'))

  for (const c of components) {
    const want = slug(c)
    const hasPage = pages.has(want)
    const inNav = new RegExp(`\\['${c}'`).test(nav)
    if (hasPage && inNav) {
      say('\x1b[32mok  \x1b[0m', `${tier}/${want}`)
    } else {
      bad++
      say('\x1b[31mFAIL\x1b[0m', `${tier}/${want} — ${[
        hasPage ? null : 'no page',
        inNav ? null : 'not in nav.ts'
      ].filter(Boolean).join(', ')}`)
    }
    pages.delete(want)
  }

  for (const orphan of pages) {
    bad++
    say('\x1b[31mFAIL\x1b[0m', `${tier}/${orphan} — a page with no component`)
  }
}

const total = TIERS.reduce((n, t) => n + list(join('ui', t), '.vue').length, 0)
console.log(
  bad
    ? `\n  \x1b[1m${bad} missing\x1b[0m of ${total} components\n`
    : `\n  ${total} components, each with its own page\n`
)
process.exit(bad ? 1 : 0)
