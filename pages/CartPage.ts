import { expect, Page } from '@playwright/test';

export class CartPage {
  constructor(private page: Page) {}

  async verifyProductVisible() {
    await expect(this.page.locator('#cart_info_table')).toBeVisible();
  }
}