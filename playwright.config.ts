import { defineConfig } from '@playwright/test'

/**
 * One job: walk every page of the workshop in a real browser and read
 * what the browser says. Not a visual-regression suite, not component
 * tests — vitest does those against the real components already. This
 * is for the class of defect nothing else can see: a Vue warning on
 * load, a page that scrolls sideways at phone width, a control with no
 * name, a closed dialog taking up room.
 *
 * AGAINST THE DEV SERVER, NOT THE BUILD, and that is the decision in
 * this file. A hydration mismatch is a dev-only warning — production Vue
 * says nothing about it — and the two biggest catches this sweep ever
 * made were a hydration mismatch on every page and a template naming a
 * ref its script no longer declared. Both are silent in a build. So the
 * sweep runs against the thing that talks.
 *
 * Chromium only. The point is what Vue and the DOM report, and one
 * engine reports it; three engines would triple the time to find the
 * same sentence.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  /* A flaky sweep is a sweep people stop reading. One retry absorbs the
     dev server warming a route; a second would hide a real intermittent. */
  retries: 1,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3010',
    /* The browser pane's tab, not a phone: the phone width is measured
       inside the test by resizing, so one load serves both. */
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'pnpm exec nuxi dev .playground --port 3010',
    url: 'http://localhost:3010',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe'
  }
})
