import { defineConfig } from '@playwright/test';

export default defineConfig({
  retries: 2,
  timeout: 50000,
  reporter: [
    ['list'],
    ['html'],
    ['allure-playwright'],
    ['json', { outputFile: 'artifacts/cucumber-report.json' }]
  ],
  use: {
    baseURL: 'https://automationexercise.com',
    headless: false,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry'
  }
});