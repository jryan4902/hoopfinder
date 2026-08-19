import { defineConfig, devices } from '@playwright/test'

// Deliberately not 5173: the tests must never latch onto a dev server someone
// already has running, because that server would not be in `test` mode and the
// Supabase stub URL would not be same-origin with it.
const PORT = 5174
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },

  // HoopFinder is a phone app. Pixel 5 is chromium-backed, so `npx playwright
  // install chromium` is all a contributor needs.
  projects: [{ name: 'mobile', use: { ...devices['Pixel 5'] } }],

  webServer: {
    command: `npm run dev -- --mode test --port ${PORT} --strictPort`,
    url: BASE_URL,
    // Always start a fresh one, so the mode and port are guaranteed.
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
