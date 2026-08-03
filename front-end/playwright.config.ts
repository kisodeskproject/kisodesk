import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3101';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: process.env.CI ? undefined : 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
  ],
  webServer: {
    command: 'NEXT_PUBLIC_API_URL=http://127.0.0.1:3000 FRONTEND_PORT=3101 npm run dev -- --port 3101',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
