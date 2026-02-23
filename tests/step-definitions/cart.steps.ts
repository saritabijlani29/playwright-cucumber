import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { HomePage } from '../../pages/HomePage';
import { CartPage } from '../../pages/CartPage';

Before(async function () {
  await this.init();
});

After(async function () {
  await this.close();
});

Given('user is on home page', async function () {
  this.homePage = new HomePage(this.page);
  await this.homePage.openHome();
});

When('user adds first product to cart', async function () {
  await this.homePage.addFirstProductToCart();
});

When('user navigates to cart page', async function () {
  await this.homePage.goToCart();
});

Then('product should be visible in cart', async function () {
  const cartPage = new CartPage(this.page);
  await cartPage.verifyProductVisible();
});