# ENTERPRISE SELF-HEAL REPORT

## Metadata
- Branch: main
- Run ID: 22340839204
- Timestamp: 2026-02-24T07:24:39.501Z
- Total Failures: 2

---

## Failure 1 of 2

Feature: Login functionality
Scenario: Successful login

Step: login should be successful
Step Definition File: tests/step-definitions/login.steps.ts
Step Definition Line: 17

Page Object File: /home/runner/work/playwright-cucumber/playwright-cucumber/pages/LoginPage.ts
Broken Locator: a[href="/logout1"]
Classification: LOCATOR_NOT_FOUND

### Error Stack

```
locator.waitFor: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('a[href="/logout1"]') to be visible

    at LoginPage.verifyLoginSuccess (/home/runner/work/playwright-cucumber/playwright-cucumber/pages/LoginPage.ts:17:51)
    at CustomWorld.<anonymous> (/home/runner/work/playwright-cucumber/playwright-cucumber/tests/step-definitions/login.steps.ts:18:24)
```

### Current Page Object Code

```typescript
import { expect, Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) { }

  async navigate() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('input[data-qa="login-email"]', email);
    await this.page.fill('input[data-qa="login-password"]', password);
    await this.page.click('button[data-qa="login-button"]');
  }

  async verifyLoginSuccess() {
    await this.page.locator('a[href="/logout1"]').waitFor({ state: 'visible' });
    await expect(this.page.locator('a[href="/logout"]')).toBeVisible();
  }

  async verifyLoginFailure() {
    await expect(this.page.locator('.login-form1 p')).toBeVisible();
  }
}

```

---

## Failure 2 of 2

Feature: Login functionality
Scenario: Invalid login

Step: login should fail
Step Definition File: tests/step-definitions/login.steps.ts
Step Definition Line: 21

Page Object File: /home/runner/work/playwright-cucumber/playwright-cucumber/pages/LoginPage.ts
Broken Locator: .login-form1 p
Classification: LOCATOR_NOT_FOUND

### Error Stack

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.login-form1 p')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "to.be.visible" with timeout 5000ms
  - waiting for locator('.login-form1 p')

    at Proxy.<anonymous> (/home/runner/work/playwright-cucumber/playwright-cucumber/node_modules/playwright/lib/matchers/expect.js:213:24)
    at LoginPage.verifyLoginFailure (/home/runner/work/playwright-cucumber/playwright-cucumber/pages/LoginPage.ts:22:55)
    at CustomWorld.<anonymous> (/home/runner/work/playwright-cucumber/playwright-cucumber/tests/step-definitions/login.steps.ts:22:24)
```

### Current Page Object Code

```typescript
import { expect, Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) { }

  async navigate() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('input[data-qa="login-email"]', email);
    await this.page.fill('input[data-qa="login-password"]', password);
    await this.page.click('button[data-qa="login-button"]');
  }

  async verifyLoginSuccess() {
    await this.page.locator('a[href="/logout1"]').waitFor({ state: 'visible' });
    await expect(this.page.locator('a[href="/logout"]')).toBeVisible();
  }

  async verifyLoginFailure() {
    await expect(this.page.locator('.login-form1 p')).toBeVisible();
  }
}

```

---

## COPILOT INSTRUCTIONS

You are fixing a Playwright + Cucumber (BDD) framework.
There are 2 broken locator(s) to fix.

STRICT RULES:

1. ONLY update locators in Page Object files.
2. DO NOT modify .feature files, step definitions, hooks, assertions, or business logic.
3. DO NOT introduce XPath, waitForTimeout, or hardcoded delays.
4. Preferred locator strategy: CSS selectors with class/attribute selectors.
5. Maintain existing method signatures.
6. If strict mode violation -> make locator more specific.
7. If timeout or locator not found -> fix the CSS selector.

Return ONLY the complete updated TypeScript file content.
Do NOT include any explanation, markdown formatting, or code fences.
Return raw TypeScript code only.