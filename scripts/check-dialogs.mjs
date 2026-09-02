/**
 * A closed <dialog> has to stay closed.
 *
 * The UA stylesheet hides one with `display: none`, and an author's own
 * `display` beats the UA stylesheet whatever the specificity says. So a
 * component that sets `display` on its dialog root un-hides the closed
 * one — and a closed dialog laid out as a grid is a full-viewport blank
 * block sitting in the normal flow of every page that mounts it,
 * measured at 982x1358 and adding its own height to the scroll.
 *
 * Two components had it. It survived because a dialog is only ever
 * looked at while it is open, and nobody scrolls to the bottom of a page
 * to confirm nothing is there. That is exactly the shape of thing a
 * check is for: cheap to state, invisible to test by eye.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const TIERS = ['atoms', 'molecules', 'organisms', 'templates']

let bad = 0
let checked = 0

for (const tier of TIERS) {
  const dir = join(root, 'ui', tier)
  for (const file of readdirSync(dir).filter(f => f.endsWith('.vue'))) {
    const src = readFileSync(join(dir, file), 'utf8')

    /* The root class of the <dialog> itself, if the component has one. */
    const tag = src.match(/<dialog\b[^>]*?\sclass="([^"]+)"/s)
    if (!tag) continue
    const cls = tag[1].trim().split(/\s+/)[0]
    checked++

    /* Every rule whose selector is that class alone — no [open], no
       other qualifier — and which sets display. */
    const offending = [...src.matchAll(/(^|\n)([^\n{]*\{[^}]*\})/g)]
      .map(m => m[2])
      .filter(block => {
        const [selector, body] = [block.slice(0, block.indexOf('{')), block]
        return selector.split(',').some(s => s.trim() === `.${cls}`)
          && /(^|[\s;{])display\s*:/.test(body)
      })

    if (offending.length) {
      bad++
      console.log(`  \x1b[31mFAIL\x1b[0m  ${tier}/${file} — .${cls} sets display outside [open]`)
    } else {
      console.log(`  \x1b[32mok  \x1b[0m  ${tier}/${file} — .${cls}`)
    }
  }
}

console.log(
  bad
    ? `\n  \x1b[1m${bad}\x1b[0m of ${checked} dialogs would show while closed\n`
    : `\n  ${checked} dialogs, none of them visible while closed\n`
)
process.exit(bad ? 1 : 0)
