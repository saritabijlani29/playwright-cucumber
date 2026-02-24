import { Page } from '@playwright/test';

export class HomePage {
  constructor(private page: Page) { }

  async openHome() {
    await this.page.goto('/');
  }

  async addFirstProductToCart() {
    await this.page.locator('.product-image-wrapper').first().hover();
    await this.page.locator('.overlay-content a[href*="add_to_cart"]').first().click();
  }

  async goToCart() {
    await this.page.click('u:has-text("View Cart")');
  }
}
