import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Authentication Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should display login page', async ({ page }) => {
    await helpers.navigateToPage('/auth/login');
    
    await helpers.expectToBeVisible('[data-testid="email-input"]');
    await helpers.expectToBeVisible('[data-testid="password-input"]');
    await helpers.expectToBeVisible('[data-testid="login-button"]');
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await helpers.navigateToPage('/auth/login');
    
    await helpers.clickButton('[data-testid="login-button"]');
    
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should navigate to dashboard after successful login', async ({ page }) => {
    await helpers.mockApiResponse('**/api/auth/**', {
      user: { id: '1', email: 'test@example.com', role: 'student' },
      token: 'mock-jwt-token'
    });

    await helpers.navigateToPage('/auth/login');
    
    await helpers.fillFormField('[data-testid="email-input"]', 'test@example.com');
    await helpers.fillFormField('[data-testid="password-input"]', 'password123');
    await helpers.clickButton('[data-testid="login-button"]');
    
    await expect(page).toHaveURL(/dashboard/);
  });
});