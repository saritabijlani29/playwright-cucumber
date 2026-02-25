import { Before, After, setDefaultTimeout, ITestCaseHookParameter } from '@cucumber/cucumber';
import fs from 'fs';

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

      const error = scenario.result.message || '';

    const isLocatorError =
      error.includes('locator') ||
      error.includes('Timeout') ||
      error.includes('waiting for');

    if (!isLocatorError) return;

    const context = {
      feature: scenario.gherkinDocument?.uri,
      scenario: scenario.pickle.name,
      error,
      timestamp: Date.now()
    };

    fs.writeFileSync(
      'healing-context.json',
      JSON.stringify(context, null, 2)
    );

    console.log('📌 Locator failure captured');
    }
  }
   catch (error) {
    console.error("Screenshot failed:", error);
  }

  await this.close();
});