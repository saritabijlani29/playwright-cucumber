import { setWorldConstructor, World } from '@cucumber/cucumber';
import type { Browser, BrowserContext, Page } from 'playwright';
import { chromium } from 'playwright';
import { LoginPage } from '../../pages/LoginPage';
import { CartPage } from '../../pages/CartPage';
import { HomePage } from '../../pages/HomePage';

class CustomWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  loginPage?: LoginPage;
  cartPage?: CartPage;
  homePage?: HomePage;

  async init() {
    this.browser = await chromium.launch({
      headless: true
    });

    this.context = await this.browser.newContext({
      baseURL: "https://automationexercise.com"
    });

    this.page = await this.context.newPage();
  }

  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
      }
    } catch (error) {
      console.error("Error closing browser:", error);
    }
  }
}

setWorldConstructor(CustomWorld);