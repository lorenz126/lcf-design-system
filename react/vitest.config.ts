import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Vitest only. The library build is scripts/build.mjs, and Storybook
 * brings its own Vite config — named vitest.config.ts and not
 * vite.config.ts precisely so Storybook does not pick it up. This is the
 * unit-test environment and nothing else, so a change to it cannot move
 * the shipped output or the workshop.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    /* Off. Vitest 5 keeps transformed modules in node_modules/.vitest-cache
       across runs, keyed by the file's own content — and a module that
       uses import.meta.glob (the Introduction's component catalogue) has
       its file list baked into that transform. Measured: with Field,
       Input and NumberField's stories added, the catalogue test still
       saw the four components of the run before, until the cache was
       deleted. The whole suite runs in about three seconds without it. */
    fsModuleCache: false
  }
})
