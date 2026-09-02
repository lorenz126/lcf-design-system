import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import autoImport from 'unplugin-auto-import/vite'

const root = dirname(fileURLToPath(import.meta.url))

/**
 * The components are written for Nuxt, which hands them `ref`, `computed`
 * and everything in composables/ without an import, and registers ui/
 * globally. A test runner does neither, so this config reproduces both —
 * the auto-imports here, the global registration in tests/setup.ts.
 *
 * Reproducing rather than working around: adding imports to the
 * components to make them testable would mean testing a version of them
 * that no consumer ever runs.
 */
export default defineConfig({
  plugins: [
    vue(),
    autoImport({
      imports: ['vue'],
      dirs: [join(root, 'composables')],
      dts: false
    })
  ],
  test: {
    environment: 'happy-dom',
    setupFiles: [join(root, 'tests', 'setup.ts')],
    include: [join(root, 'tests', '**', '*.test.ts')],
    restoreMocks: true
  }
})
