#!/usr/bin/env node
/**
 * Package check — does the tarball contain the layer?
 *
 * A Nuxt layer is consumed as an installed package, and `files` in
 * package.json decides what an installed package contains. Nothing in a
 * normal build touches that list: every component resolves from disk in
 * this repo whether it is packed or not, so a missing entry is invisible
 * here and fatal there. That is exactly the class of mistake that only
 * shows up in somebody else's project.
 *
 * So this asks npm what it would ship and checks the answer against the
 * source tree: every component, every token, every composable, the
 * config that wires them together — and nothing that has no business
 * being installed.
 *
 * It does NOT prove the layer builds elsewhere. That needs a real
 * consumer, which is a manual step written down in the README; this is
 * the fast part of it, the part worth running on every commit.
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/* ---------- what npm says it would ship ---------- */

const out = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  cwd: root,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore']
})
const shipped = new Set(JSON.parse(out)[0].files.map(f => f.path))

/* ---------- what is actually here ---------- */

const wanted = []

for (const tier of ['atoms', 'molecules', 'organisms', 'templates']) {
  const dir = join(root, 'ui', tier)
  if (!existsSync(dir)) continue
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.vue')) wanted.push(`ui/${tier}/${f}`)
  }
}
for (const f of readdirSync(join(root, 'tokens'))) wanted.push(`tokens/${f}`)
for (const f of readdirSync(join(root, 'styles'))) wanted.push(`styles/${f}`)
for (const f of readdirSync(join(root, 'composables'))) wanted.push(`composables/${f}`)
for (const f of readdirSync(join(root, 'plugins'))) wanted.push(`plugins/${f}`)
/* The platform declarations are part of the layer, not of its workshop:
   a consumer typechecking DatePicker hits the same missing anchorName we
   did, and shipping the .d.ts is what stops them writing it again. */
for (const f of readdirSync(join(root, 'types'))) wanted.push(`types/${f}`)
/* Both agent-facing documents ship. CONSUMING.md is read from inside
   node_modules by the agent working in the app that installed this, so
   it is part of the surface, not of the repository. */
wanted.push('nuxt.config.ts', 'package.json', 'README.md', 'CONSUMING.md')

/* Placeholders for directories that are no longer empty, editor leftovers,
   anything a consumer installs and never reads. */
const junk = [...shipped].filter(f => /(^|\/)\.(gitkeep|DS_Store)$/.test(f))

/* ---------- and the wiring that has to be declared ---------- */

const pkg = JSON.parse(
  execFileSync('node', ['-p', 'JSON.stringify(require("./package.json"))'], {
    cwd: root,
    encoding: 'utf8'
  })
)
const meta = []
if (pkg.main !== './nuxt.config.ts') meta.push('main must point at nuxt.config.ts')
// Bundling Nuxt or Vue would install a second copy beside the consumer's.
for (const p of ['nuxt', 'vue']) {
  if (!pkg.peerDependencies?.[p]) meta.push(`${p} must be a peerDependency`)
  if (pkg.dependencies?.[p]) meta.push(`${p} must not be a dependency`)
}
// Anything a component imports at runtime, though, does have to come along.
if (!pkg.dependencies?.['lucide-vue-next']) meta.push('lucide-vue-next must be a dependency')

/* ---------- report ---------- */

const C = { dim: '\x1b[90m', red: '\x1b[31m', green: '\x1b[32m', bold: '\x1b[1m', off: '\x1b[0m' }

const missing = wanted.filter(f => !shipped.has(f))

for (const f of missing) console.log(`  ${C.red}MISSING${C.off}  ${f}`)
for (const f of junk) console.log(`  ${C.red}JUNK   ${C.off}  ${f}`)
for (const m of meta) console.log(`  ${C.red}META   ${C.off}  ${m}`)

const bad = missing.length + junk.length + meta.length
if (bad) {
  console.log(`\n  ${C.red}${bad} problem(s) with what would be installed${C.off}\n`)
  process.exit(1)
}

console.log(
  `\n  ${shipped.size} files would ship, ${wanted.length} of them required` +
    `\n  ${C.dim}peers declared, runtime dependency declared, no leftovers${C.off}\n`
)
