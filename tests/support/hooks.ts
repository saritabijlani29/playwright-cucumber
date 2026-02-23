import { Before, After, ITestCaseHookParameter } from '@cucumber/cucumber';

Before(async function () {
  await this.init();
});

After(async function (scenario: ITestCaseHookParameter) {
  await this.close();

  if (scenario.result?.status === 'FAILED') {
    const screenshot = await this.page.screenshot({
      encoding: 'base64',
      fullPage: true
    });

    await this.attach(screenshot, 'image/png');
  }
});
