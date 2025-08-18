import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Account Creation Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should display account type selector', async ({ page }) => {
    await helpers.navigateToPage('/onboarding');
    
    await helpers.expectToBeVisible('[data-testid="student-option"]');
    await helpers.expectToBeVisible('[data-testid="instructor-option"]');
    await helpers.expectToBeVisible('[data-testid="organization-option"]');
  });

  test('should navigate to student onboarding when student is selected', async ({ page }) => {
    await helpers.navigateToPage('/onboarding');
    
    await helpers.clickButton('[data-testid="student-option"]');
    
    await expect(page).toHaveURL(/onboarding\/student/);
    await helpers.expectToBeVisible('[data-testid="student-form"]');
  });

  test('should navigate to instructor onboarding when instructor is selected', async ({ page }) => {
    await helpers.navigateToPage('/onboarding');
    
    await helpers.clickButton('[data-testid="instructor-option"]');
    
    await expect(page).toHaveURL(/onboarding\/instructor/);
    await helpers.expectToBeVisible('[data-testid="instructor-form"]');
  });

  test('should navigate to organization onboarding when organization is selected', async ({ page }) => {
    await helpers.navigateToPage('/onboarding');
    
    await helpers.clickButton('[data-testid="organization-option"]');
    
    await expect(page).toHaveURL(/onboarding\/organisation/);
    await helpers.expectToBeVisible('[data-testid="organization-form"]');
  });

  test('should complete student onboarding form', async ({ page }) => {
    await helpers.mockApiResponse('**/api/students', {
      success: true,
      student: { id: '1', name: 'John Doe' }
    });

    await helpers.navigateToPage('/onboarding/student');
    
    await helpers.fillFormField('[data-testid="first-name"]', 'John');
    await helpers.fillFormField('[data-testid="last-name"]', 'Doe');
    await helpers.fillFormField('[data-testid="email"]', 'john.doe@example.com');
    await helpers.fillFormField('[data-testid="phone"]', '+1234567890');
    
    await helpers.clickButton('[data-testid="submit-button"]');
    
    await expect(page).toHaveURL(/dashboard/);
  });
});