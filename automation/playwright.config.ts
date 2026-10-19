import { defineConfig, devices } from '@playwright/test';
import { ENV } from './config/env.js';

/**
 * One Playwright project per layer (ts-pom-standards). `ui`/`e2e` navigate
 * the real app, so they override `baseURL` to `ENV.baseUrl` (the API
 * clients build their own absolute URLs from `ENV.apiUrl` regardless of
 * this setting — see `fixtures/baseTest.ts`).
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
  ],
  outputDir: 'reports/artifacts',
  use: {
    baseURL: ENV.apiUrl,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: {},
    },
    {
      name: 'persistence',
      testDir: './tests/persistence',
      use: {},
    },
    {
      name: 'db',
      testDir: './tests/db',
      use: {},
    },
    {
      name: 'ui',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'], baseURL: ENV.baseUrl },
    },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'], baseURL: ENV.baseUrl },
    },
    // Cross-browser coverage, not needed for this trial:
    // { name: 'firefox', testDir: './tests/ui', use: { ...devices['Desktop Firefox'], baseURL: ENV.baseUrl } },
    // { name: 'webkit', testDir: './tests/ui', use: { ...devices['Desktop Safari'], baseURL: ENV.baseUrl } },
  ],
});
