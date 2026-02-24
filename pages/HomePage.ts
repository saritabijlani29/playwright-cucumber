import { Page } from '@playwright/test';

export class HomePage {
  constructor(private page: Page) { }

  async openHome() {
    await this.page.goto('/');
  }

  async addFirstProductToCart() {
    await this.page.locator('.product-image-wrapper').first().hover();
    await this.page.locator('.overlay-content a').filter({ hasText: 'Add to cart' }).first().click();
  }

  async goToCart() {
    await this.page.locator('u').filter({ hasText: 'View Cart' }).click();
  }
}