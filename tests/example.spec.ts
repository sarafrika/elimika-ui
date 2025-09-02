import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Elimika/);

  await expect(page.locator('body')).toBeVisible();
});
