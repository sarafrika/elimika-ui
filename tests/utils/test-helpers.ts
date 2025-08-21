import { Page, expect, Locator } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  async waitForLoadingToFinish() {
    await this.page.waitForLoadState('networkidle');
  }

  async fillFormField(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  async clickButton(selector: string) {
    await this.page.click(selector);
  }

  async expectToHaveText(selector: string, text: string) {
    await expect(this.page.locator(selector)).toHaveText(text);
  }

  async expectToBeVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async expectToBeHidden(selector: string) {
    await expect(this.page.locator(selector)).toBeHidden();
  }

  async navigateToPage(path: string) {
    await this.page.goto(path);
    await this.waitForLoadingToFinish();
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png` });
  }

  async mockApiResponse(url: string, response: any) {
    await this.page.route(url, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  async waitForApiCall(url: string) {
    return this.page.waitForResponse(url);
  }

  async login(email: string = 'test@example.com', password: string = 'password') {
    await this.navigateToPage('/auth/login');
    await this.fillFormField('[data-testid="email-input"]', email);
    await this.fillFormField('[data-testid="password-input"]', password);
    await this.clickButton('[data-testid="login-button"]');
    await this.waitForLoadingToFinish();
  }
}