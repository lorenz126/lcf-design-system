#!/usr/bin/env node
/**
 * The library build: JavaScript by Vite, declarations by tsc.
 *
 * ONE ENTRY PER PUBLIC PATH, discovered rather than listed. Every
 * `src/components/<Name>/index.ts`, every `src/hooks/<name>.ts`, plus
 * theme and i18n. A component added to the tree is built and exported
 * the moment it exists; a hand-kept list of entries is the list somebody
 * forgets, and the one place nothing else would notice.
 *
 * preserveModules keeps one output file per source file, so a consumer
 * importing `@lcf/design/components/Button` pulls Button and what Button
 * imports — never the whole library behind a convenient name.
 *
 * CSS IS NOT BUILT. It ships as source (`src/css`, `src/tokens`, each
 * component's `.css`), imported once by the consumer through
 * `@lcf/design/css`. Plain CSS with custom properties needs no
 * compilation, and shipping it untouched means what the contrast check
 * measured is byte for byte what the browser gets.
 *
 * Runs on `prepare`, because a git dependency is installed from source:
 * pnpm and npm run `prepare` for a git spec, and that is the only moment
 * a consumer's machine can turn the TypeScript into something to import.
 */
import { readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { build } from 'vite'
import react from '@vitejs/plugin-react'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'src')

const entry = {
  'theme/index': join(src, 'theme/index.ts'),
  'i18n/index': join(src, 'i18n/index.ts')
}
for (const f of readdirSync(join(src, 'hooks'))) {
  if (f.endsWith('.ts') && !f.endsWith('.test.ts')) entry[`hooks/${f.slice(0, -3)}`] = join(src, 'hooks', f)
}
for (const name of readdirSync(join(src, 'components'))) {
  const index = join(src, 'components', name, 'index.ts')
  if (existsSync(index)) entry[`components/${name}/index`] = index
}

await build({
  root,
  configFile: false,
  logLevel: 'warn',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    lib: { entry, formats: ['es'] },
    rollupOptions: {
      // Everything in dependencies or peerDependencies stays a bare
      // import, resolved once in the consumer — two Reacts is a crash,
      // two Radixes is two focus scopes that do not know each other.
      external: id => /^(react|react-dom|radix-ui|@radix-ui|lucide-react|clsx)(\/|$)/.test(id),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js'
      }
    }
  }
})

execFileSync(join(root, 'node_modules/.bin/tsc'), ['-p', join(root, 'tsconfig.build.json')], { stdio: 'inherit' })
console.log(`  built ${Object.keys(entry).length} entries`)
