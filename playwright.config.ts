import { defineConfig, devices } from '@playwright/test';

const WEB_PORT = 4173;
const API_PORT = Number(process.env.E2E_API_PORT ?? 3999);

/**
 * End-to-end tests run against the real bazario-api and Postgres:
 *   npm run e2e:db   # Postgres in Docker on :55433
 *   npm run e2e      # starts the API (from ../bazario-api) and a production build of the web app
 */
export default defineConfig({
  testDir: 'e2e/specs',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/stack/start-api.mjs',
      url: 'http://localhost:3998',
      timeout: 180_000,
      reuseExistingServer: false,
      stdout: 'pipe',
      env: { E2E_API_PORT: String(API_PORT), E2E_WEB_URL: `http://localhost:${WEB_PORT}` },
    },
    {
      command: `npx vite build && npx vite preview --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      timeout: 240_000,
      reuseExistingServer: false,
      env: { VITE_API_URL: `http://localhost:${API_PORT}` },
    },
  ],
});
