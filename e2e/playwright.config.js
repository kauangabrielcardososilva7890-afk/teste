const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.js',
  timeout: 45_000,
  retries: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'python3 -m http.server 4173 --directory ..',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: false,
    timeout: 30_000
  },
  reporter: [['line'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
});
