import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration for the NABD Chain System.
 *
 * Prerequisites:
 *   - Frontend running on http://localhost:5173  (pnpm dev)
 *   - Backend  running on http://localhost:3001  (cd server && pnpm dev)
 *   - VITE_USE_MOCK_AUTH=true in .env so MockAuthProvider is active
 *
 * Run:
 *   pnpm test:e2e          # headless
 *   pnpm test:e2e:ui       # interactive UI mode
 *   npx playwright test --list   # list discovered tests
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // In CI, serve the pre-built frontend via vite preview (fast startup).
  // Locally, assume dev servers are already running.
  ...(process.env.CI
    ? {
        webServer: [
          {
            command: 'pnpm preview --port 5173',
            url: 'http://localhost:5173',
            reuseExistingServer: false,
            timeout: 30_000,
          },
        ],
      }
    : {}),
});
