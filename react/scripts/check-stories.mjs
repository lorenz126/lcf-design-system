#!/usr/bin/env node
/**
 * Every component, accounted for, in all three places it has to be.
 *
 *   1. It has stories. A component without a story is one nobody can
 *      look at, and one the browser sweep never loads.
 *   2. Its CSS is imported by src/css/index.css. A component whose
 *      stylesheet is not in the one file consumers import ships unstyled,
 *      and nothing in the build would say so — the stories import the
 *      same file, so this is also what keeps the workshop honest.
 *   3. It is a public path. `index.ts` is what scripts/build.mjs turns
 *      into `@lcf/design/components/<Name>`.
 *   4. Its stories export a `Showcase` tagged '!autodocs' — the row under
 *      the title of its docs page (.storybook/DocsPage.tsx). Without it
 *      the page has no hero; without the tag the row is listed a second
 *      time under Examples, and placed first it becomes the primary
 *      example in place of Base.
 *
 * Derived from the tree, both directions, so a new folder is checked the
 * moment it exists and a deleted one leaves no stale import behind.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'src/components')
const index = readFileSync(join(root, 'src/css/index.css'), 'utf8')
const problems = []

const names = readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
for (const n of names) {
  const has = f => existsSync(join(dir, n, f))
  if (!has('index.ts')) problems.push(`${n}: no index.ts, so no public path`)
  // A provider renders nothing to look at or style.
  if (n === 'LcfProvider') continue
  if (!has(`${n}.stories.tsx`)) problems.push(`${n}: no ${n}.stories.tsx`)
  else {
    const src = readFileSync(join(dir, n, `${n}.stories.tsx`), 'utf8')
    // The Showcase's own object: from its export to the next one.
    const showcase = src.match(/^export const Showcase\b[\s\S]*?(?=^export |(?![\s\S]))/m)?.[0]
    if (!showcase) problems.push(`${n}: no Showcase story, so its docs page has no row under the title`)
    else if (!/tags:\s*\[[^\]]*'!autodocs'/.test(showcase)) {
      problems.push(`${n}: Showcase is not tagged '!autodocs' — it would be listed again under Examples`)
    }
  }
  if (has(`${n}.css`) && !index.includes(`../components/${n}/${n}.css`)) {
    problems.push(`${n}: ${n}.css is not imported by src/css/index.css — it would ship unstyled`)
  }
}
for (const m of index.matchAll(/\.\.\/components\/(\w+)\/(\w+)\.css/g)) {
  if (!existsSync(join(dir, m[1], `${m[2]}.css`))) problems.push(`src/css/index.css imports ${m[0]}, which does not exist`)
}

if (problems.length) {
  console.error(`\n  ${problems.length} problem(s):\n` + problems.map(p => `    ${p}`).join('\n') + '\n')
  process.exit(1)
}
console.log(`  ${names.length} components: stories with a Showcase, stylesheet and public path for each`)
