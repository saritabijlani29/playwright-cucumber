import { Given, When, Then } from '@cucumber/cucumber';
import { LoginPage } from '../../pages/LoginPage';

Given('user is on login page', async function () {
  this.loginPage = new LoginPage(this.page);
  await this.loginPage.navigate();
});

When('user logs in with valid credentials', async function () {
  await this.loginPage.login('ecommercetest412@gmail.com', 'test123@2');
});

When('user logs in with invalid credentials', async function () {
  await this.loginPage.login('wrong@test.com', 'wrongpass');
});

Then('login should be successful', async function () {
  await this.loginPage.verifyLoginSuccess();
});

Then('login should fail', async function () {
  await this.loginPage.verifyLoginFailure();
});