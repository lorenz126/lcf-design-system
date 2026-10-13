#!/usr/bin/env node
/**
 * No component says anything the app cannot translate.
 *
 * A component that writes "No rows." into its markup has decided the
 * language for every app that uses it. Three of those survived into the
 * Nuxt layer with no way to override them at all — "Choose files",
 * "Series", "Nothing selected." — and nobody noticed until a German
 * interface was built on top.
 *
 * What it looks for, in every component's .tsx (stories and tests
 * excluded, since they are written in the workshop's language on
 * purpose):
 *
 *   - JSX text with a letter in it:            <p>No rows.</p>
 *   - a literal in an attribute a person reads: aria-label="Close"
 *                                               placeholder / title / alt
 *
 * Text that comes from props or from t('key') is an expression, `{…}`,
 * and passes. A static parse would be more exact; this has been enough
 * to find every case so far, and the escape hatch for a real exception
 * is a comment on the line — `// check-strings: ok <why>` — so the
 * reason sits beside the exception.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const files = []
const walk = d => {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.tsx$/.test(f) && !/\.(stories|test)\.tsx$/.test(f)) files.push(p)
  }
}
walk(join(root, 'src/components'))

const found = []
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (/check-strings: ok/.test(line)) return
    if (/^\s*(\*|\/\/|\/\*)/.test(line)) return // comments
    const where = `${relative(root, file)}:${i + 1}`
    // JSX text: between a closing `>` and the next `<` or `{`, with a letter.
    for (const m of line.matchAll(/>([^<>{}]*\p{L}[^<>{}]*)</gu)) {
      const text = m[1].trim()
      if (text && !/^[=&|?:]/.test(text) && !/=>/.test(m[0])) found.push(`${where}  text "${text}"`)
    }
    for (const m of line.matchAll(/\b(aria-label|placeholder|title|alt)="([^"]*\p{L}[^"]*)"/gu)) {
      found.push(`${where}  ${m[1]}="${m[2]}"`)
    }
  })
}

if (found.length) {
  console.error(`\n  ${found.length} visible string(s) outside the message table:\n` + found.map(f => `    ${f}`).join('\n') +
    `\n\n  Add a key to src/i18n/messages.ts and use t('key'), or mark the line\n  // check-strings: ok <reason>\n`)
  process.exit(1)
}
console.log(`  ${files.length} component files, no visible text outside the message table`)
