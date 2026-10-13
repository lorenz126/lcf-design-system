import { defineConfig } from '@playwright/test'

/**
 * One job: load every story in a real browser and read what the browser
 * says. Against the Storybook dev server, because React reports its
 * development warnings — a key missing from a list, a ref on a function
 * component — only in development, and those are what this is for.
 *
 * THREE PASSES. Every contrast failure the Nuxt layer ever had was in
 * the dark theme, and every overflow it ever had was a longer word. So
 * the second pass is dark AND German, the way a real Swiss user's
 * screen looks; the third is reduced motion.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 1,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:6011',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'light', metadata: { globals: 'theme:light;locale:en-GB' } },
    { name: 'dark-de', metadata: { globals: 'theme:dark;locale:de-CH' } },
    { name: 'reduced-motion', metadata: { globals: 'theme:light;locale:en-GB' }, use: { contextOptions: { reducedMotion: 'reduce' } } }
  ],
  webServer: {
    command: 'pnpm exec storybook dev -p 6011 --ci --no-open',
    url: 'http://localhost:6011/iframe.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe'
  }
})
