import { expect, Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) { }

  async navigate() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('input[data-qa="login-email"]', email);
    await this.page.fill('input[data-qa="login-password"]', password);
    await this.page.click('button[data-qa="login-button"]');
  }

  async verifyLoginSuccess() {
    await this.page.locator('a[href="/logout"]').waitFor({ state: 'visible' });
    await expect(this.page.locator('a[href="/logout"]')).toBeVisible();
  }

  async verifyLoginFailure() {
    await expect(this.page.locator('.login-form1 p')).toBeVisible();
  }
}