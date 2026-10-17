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
 *
 * AN APP CHECKS ITS OWN TEMPLATES WITH THE SAME RULES. Installed, this
 * is the `lcf-check-strings` bin; given paths — folders or files,
 * relative to where it is run — it checks those instead of the layer's
 * components:
 *
 *   npx lcf-check-strings src/components src/pages
 *
 * .tsx and .jsx, stories and tests skipped, the same escape hatch. What
 * counts as "the message table" is then the app's own: the check only
 * says the text is a literal, not where the key should go.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const layer = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const asApp = args.length > 0
// Paths in the report are relative to where the reader is: the layer's
// root for its own check, the app's working directory for an app's.
const root = asApp ? process.cwd() : layer
const SOURCE = /\.(tsx|jsx)$/
const SKIP = /\.(stories|test|spec)\.(tsx|jsx)$/
const files = []
const walk = d => {
  for (const f of readdirSync(d)) {
    if (f === 'node_modules' || f.startsWith('.')) continue
    const p = join(d, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (SOURCE.test(f) && !SKIP.test(f)) files.push(p)
  }
}
for (const target of asApp ? args.map(a => resolve(process.cwd(), a)) : [join(layer, 'src/components')]) {
  if (statSync(target).isDirectory()) walk(target)
  else if (SOURCE.test(target)) files.push(target)
}

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
    (asApp
      ? `\n\n  Move each into your app's message table, or mark the line\n  // check-strings: ok <reason>\n`
      : `\n\n  Add a key to src/i18n/messages.ts and use t('key'), or mark the line\n  // check-strings: ok <reason>\n`))
  process.exit(1)
}
console.log(`  ${files.length} ${asApp ? 'files' : 'component files'}, no visible text outside the message table`)
