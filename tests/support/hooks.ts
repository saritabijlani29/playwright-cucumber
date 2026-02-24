import { Before, After, setDefaultTimeout, ITestCaseHookParameter } from '@cucumber/cucumber';

setDefaultTimeout(60 * 1000); // 60 seconds - must be higher than Playwright's expect timeout

Before(async function () {
  await this.init();
});

After(async function (scenario: ITestCaseHookParameter) {
  try {
    if (scenario.result?.status === 'FAILED' && this.page) {
      const screenshot = await this.page.screenshot({
        encoding: 'base64',
        fullPage: true
      });

      await this.attach(screenshot, 'image/png');
    }
  } catch (error) {
    console.error("Screenshot failed:", error);
  }

  await this.close();
});
