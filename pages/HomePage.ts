import { Page } from '@playwright/test';

export class HomePage {
  constructor(private page: Page) { }

  async openHome() {
    await this.page.goto('/');
  }

  async addFirstProductToCart() {
    await this.page.locator('.product').first().hover();
    await this.page.locator('//div[@class="overlay-content"]/a[text()="Add to cart"]').first().click();
  }

  async goToCart() {
    await this.page.click('//u[text()="View Cart"]');
  }
}