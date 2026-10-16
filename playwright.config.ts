import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:5179' },
  webServer: { command: 'npx vite --config e2e/vite.config.ts', url: 'http://localhost:5179', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
