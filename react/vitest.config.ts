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
    css: false
  }
})
