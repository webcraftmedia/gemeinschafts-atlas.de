import { defineConfig } from '@playwright/test'

import { BASE_URL, PORT } from './e2e/server'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  // Refuses to run against a server that is not this app — see the file.
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    reducedMotion: 'reduce',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    // Deliberately the production artifact, not `nuxt dev`: the dev server loads
    // Nuxt DevTools after hydration, which re-renders the page underneath the
    // test and makes interactions flaky. It also means the suite exercises what
    // actually gets deployed.
    command: 'npx nuxt build && node .output/server/index.mjs',
    url: `${BASE_URL}/api/health`,
    env: { PORT: String(PORT), HOST: '127.0.0.1' },
    timeout: Number(process.env.E2E_SERVER_TIMEOUT ?? 300_000),
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
