# ENTERPRISE SELF-HEAL REPORT

## Metadata
- Branch: main
- Run ID: 22339865136
- Timestamp: 2026-02-24T06:47:05.723Z
- Classification: LOCATOR_NOT_FOUND

---

## Failing Test

Feature: Login functionality
Scenario: Invalid login

Step: login should fail
Step Definition File: tests/step-definitions/login.steps.ts
Step Definition Line: 21

Page Object File: /home/runner/work/playwright-cucumber/playwright-cucumber/pages/LoginPage.ts
Broken Locator: .login-form1 p

---

## Error Stack

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

---

## Current Page Object Code

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
    await this.page.locator('a[href="/logout"]').waitFor({ state: 'visible' });
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

This failure is classified as: LOCATOR_NOT_FOUND
The broken locator is: .login-form1 p
The page object file is: /home/runner/work/playwright-cucumber/playwright-cucumber/pages/LoginPage.ts

STRICT RULES:

1. ONLY update the locator in the Page Object file.
2. DO NOT modify:
   - .feature files
   - step definition files
   - hooks
   - assertions logic
   - business logic
3. DO NOT introduce:
   - XPath
   - waitForTimeout
   - hardcoded delays
4. Preferred locator strategy order:
   - getByRole()
   - getByLabel()
   - getByTestId()
   - CSS locator() fallback
5. Maintain existing method signature.
6. If strict mode violation -> make locator more specific.
7. If timeout or locator not found -> fix the CSS selector.

Return ONLY the complete updated TypeScript file content for: /home/runner/work/playwright-cucumber/playwright-cucumber/pages/LoginPage.ts
Do NOT include any explanation, markdown formatting, or code fences.
Return raw TypeScript code only.