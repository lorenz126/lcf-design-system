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
 *   5. Every example says what it shows. Each story under Examples is a
 *      heading, its doc comment, and the canvas; without the comment the
 *      heading runs straight into the picture. Measured: 13 of 21
 *      examples had none, so the page switched rhythm from one section
 *      to the next. Base (the primary, shown under Usage with no
 *      sentence) and Showcase are exempt.
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

/* Whether the export at `at` has a doc comment of its own: the last
   thing before it is a comment block that opens with `/**`. A `//` line
   or a comment over something else does not count — Storybook shows only
   a JSDoc block attached to the export itself, and Badge's sentence for
   StatusMap once sat on the const above it, where the page never showed
   it. Read line by line, upward, through the comment's own lines. */
const described = (src, at) => {
  const lines = src.slice(0, at).trimEnd().split('\n').map(l => l.trim())
  if (!lines.at(-1)?.endsWith('*/')) return false
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith('/*')) return lines[i].startsWith('/**')
    if (!lines[i].startsWith('*') && i !== lines.length - 1) return false
  }
  return false
}

const names = readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
let withStories = 0
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
    for (const m of src.matchAll(/^export const (\w+)/gm)) {
      if (m[1] === 'Base' || m[1] === 'Showcase') continue
      if (!described(src, m.index)) problems.push(`${n}: ${m[1]} has no /** doc comment */ — its section under Examples would be a heading and a picture, no sentence`)
    }
    withStories++
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
// Counted as checked: LcfProvider has a public path and nothing else to check.
console.log(`  ${names.length} components with a public path; ${withStories} of them with stories, a Showcase and a sentence for every example`)
