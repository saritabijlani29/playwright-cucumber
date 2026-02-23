import { setWorldConstructor, World } from '@cucumber/cucumber';
import type { Browser, Page } from 'playwright'; // 👈 use type import
import { chromium } from 'playwright';
import { LoginPage } from '../../pages/LoginPage';

class CustomWorld extends World {
  browser!: Browser;
  page!: Page;
  loginPage!: LoginPage;

  async init() {
    this.browser = await chromium.launch({
      headless: true
    });
    const context = await this.browser.newContext({
      baseURL: "https://automationexercise.com"
    });
    this.page = await context.newPage();
  }

  async close() {
    await this.browser.close();
  }
}

setWorldConstructor(CustomWorld);