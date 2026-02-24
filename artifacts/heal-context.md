# ENTERPRISE SELF-HEAL REPORT

## Metadata
- Branch: main
- Run ID: 22343435045
- Timestamp: 2026-02-24T08:51:24.915Z
- Total Failures: 3

---

## Failure 1 of 3

Feature: Cart functionality
Scenario: Add product to cart

Step: user adds first product to cart
Step Definition File: tests/step-definitions/cart.steps.ts
Step Definition Line: 10

Page Object File: /home/runner/work/playwright-cucumber/playwright-cucumber/pages/HomePage.ts
Broken Locator: .product
Classification: LOCATOR_NOT_FOUND

### Error Stack

```
locator.hover: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('.product').first()

    at HomePage.addFirstProductToCart (/home/runner/work/playwright-cucumber/playwright-cucumber/pages/HomePage.ts:11:49)
    at CustomWorld.<anonymous> (/home/runner/work/playwright-cucumber/playwright-cucumber/tests/step-definitions/cart.steps.ts:11:23)
```

### Current Page Object Code

```typescript
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
```

---

## Failure 2 of 3

Feature: Login functionality
Scenario: Successful login

Step: user logs in with valid credentials
Step Definition File: tests/step-definitions/login.steps.ts
Step Definition Line: 9

Page Object File: /home/runner/work/playwright-cucumber/playwright-cucumber/pages/LoginPage.ts
Broken Locator: input[data-qa="2444login-email"]
Classification: LOCATOR_NOT_FOUND

### Error Stack

```
page.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[data-qa="2444login-email"]')

    at LoginPage.login (/home/runner/work/playwright-cucumber/playwright-cucumber/pages/LoginPage.ts:11:21)
    at CustomWorld.<anonymous> (/home/runner/work/playwright-cucumber/playwright-cucumber/tests/step-definitions/login.steps.ts:10:24)
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
    await this.page.fill('input[data-qa="2444login-email"]', email);
    await this.page.fill('input[data-qa="login-password"]', password);
    await this.page.click('button[data-qa="login-button"]');
  }

  async verifyLoginSuccess() {
    await this.page.locator('a[href="/logou1t"]').waitFor({ state: 'visible' });
    await expect(this.page.locator('a[href="/logou1t"]')).toBeVisible();
  }

  async verifyLoginFailure() {
    await expect(this.page.locator('.login-form1 p')).toBeVisible();
  }
}

```

---

## Failure 3 of 3

Feature: Login functionality
Scenario: Invalid login

Step: user logs in with invalid credentials
Step Definition File: tests/step-definitions/login.steps.ts
Step Definition Line: 13

Page Object File: /home/runner/work/playwright-cucumber/playwright-cucumber/pages/LoginPage.ts
Broken Locator: input[data-qa="2444login-email"]
Classification: LOCATOR_NOT_FOUND

### Error Stack

```
page.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[data-qa="2444login-email"]')

    at LoginPage.login (/home/runner/work/playwright-cucumber/playwright-cucumber/pages/LoginPage.ts:11:21)
    at CustomWorld.<anonymous> (/home/runner/work/playwright-cucumber/playwright-cucumber/tests/step-definitions/login.steps.ts:14:24)
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
    await this.page.fill('input[data-qa="2444login-email"]', email);
    await this.page.fill('input[data-qa="login-password"]', password);
    await this.page.click('button[data-qa="login-button"]');
  }

  async verifyLoginSuccess() {
    await this.page.locator('a[href="/logou1t"]').waitFor({ state: 'visible' });
    await expect(this.page.locator('a[href="/logou1t"]')).toBeVisible();
  }

  async verifyLoginFailure() {
    await expect(this.page.locator('.login-form1 p')).toBeVisible();
  }
}

```

---

## COPILOT INSTRUCTIONS

You are fixing a Playwright + Cucumber (BDD) framework.
There are 3 broken locator(s) to fix.

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