import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Form Validation Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Student Registration Form', () => {
    test('should validate required fields', async ({ page }) => {
      await helpers.navigateToPage('/onboarding/student');

      await helpers.clickButton('[data-testid="submit-button"]');

      await helpers.expectToBeVisible('text=First name is required');
      await helpers.expectToBeVisible('text=Last name is required');
      await helpers.expectToBeVisible('text=Email is required');
    });

    test('should validate email format', async ({ page }) => {
      await helpers.navigateToPage('/onboarding/student');

      await helpers.fillFormField('[data-testid="email"]', 'invalid-email');
      await helpers.clickButton('[data-testid="submit-button"]');

      await helpers.expectToBeVisible('text=Invalid email format');
    });

    test('should validate phone number format', async ({ page }) => {
      await helpers.navigateToPage('/onboarding/student');

      await helpers.fillFormField('[data-testid="phone"]', '123');
      await helpers.clickButton('[data-testid="submit-button"]');

      await helpers.expectToBeVisible('text=Invalid phone number format');
    });

    test('should show success state for valid form', async ({ page }) => {
      await helpers.mockApiResponse('**/api/students', { success: true });

      await helpers.navigateToPage('/onboarding/student');

      await helpers.fillFormField('[data-testid="first-name"]', 'John');
      await helpers.fillFormField('[data-testid="last-name"]', 'Doe');
      await helpers.fillFormField('[data-testid="email"]', 'john.doe@example.com');
      await helpers.fillFormField('[data-testid="phone"]', '+1234567890');

      await helpers.clickButton('[data-testid="submit-button"]');

      await helpers.expectToBeVisible('text=Registration successful');
    });
  });

  test.describe('Course Creation Form', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.mockApiResponse('**/api/auth/session', {
        user: { role: 'instructor' },
      });
    });

    test('should validate course title length', async ({ page }) => {
      await helpers.navigateToPage('/dashboard/course-management/create-new-course');

      await helpers.fillFormField('[data-testid="course-title"]', 'a');
      await helpers.clickButton('[data-testid="save-draft-button"]');

      await helpers.expectToBeVisible('text=Title must be at least 5 characters');
    });

    test('should validate course description length', async ({ page }) => {
      await helpers.navigateToPage('/dashboard/course-management/create-new-course');

      await helpers.fillFormField('[data-testid="course-description"]', 'Short');
      await helpers.clickButton('[data-testid="save-draft-button"]');

      await helpers.expectToBeVisible('text=Description must be at least 20 characters');
    });

    test('should validate price format', async ({ page }) => {
      await helpers.navigateToPage('/dashboard/course-management/create-new-course');

      await helpers.fillFormField('[data-testid="course-price"]', 'invalid');
      await helpers.clickButton('[data-testid="save-draft-button"]');

      await helpers.expectToBeVisible('text=Invalid price format');
    });

    test('should validate duration is positive number', async ({ page }) => {
      await helpers.navigateToPage('/dashboard/course-management/create-new-course');

      await helpers.fillFormField('[data-testid="course-duration"]', '-5');
      await helpers.clickButton('[data-testid="save-draft-button"]');

      await helpers.expectToBeVisible('text=Duration must be a positive number');
    });
  });

  test.describe('Dynamic Form Validation', () => {
    test('should show real-time validation feedback', async ({ page }) => {
      await helpers.navigateToPage('/onboarding/student');

      const emailField = page.locator('[data-testid="email"]');

      await emailField.fill('invalid');
      await emailField.blur();

      await helpers.expectToBeVisible('text=Invalid email format');

      await emailField.fill('valid@example.com');
      await emailField.blur();

      await helpers.expectToBeHidden('text=Invalid email format');
    });

    test('should clear validation errors when field is corrected', async ({ page }) => {
      await helpers.navigateToPage('/onboarding/student');

      await helpers.clickButton('[data-testid="submit-button"]');
      await helpers.expectToBeVisible('text=First name is required');

      await helpers.fillFormField('[data-testid="first-name"]', 'John');

      await helpers.expectToBeHidden('text=First name is required');
    });

    test('should handle async validation', async ({ page }) => {
      await helpers.mockApiResponse('**/api/validate/email', {
        valid: false,
        message: 'Email already exists',
      });

      await helpers.navigateToPage('/onboarding/student');

      await helpers.fillFormField('[data-testid="email"]', 'existing@example.com');
      await helpers.clickButton('[data-testid="submit-button"]');

      await helpers.expectToBeVisible('text=Email already exists');
    });
  });

  test.describe('Form Accessibility', () => {
    test('should associate labels with form fields', async ({ page }) => {
      await helpers.navigateToPage('/onboarding/student');

      const firstNameField = page.locator('[data-testid="first-name"]');
      const labelId = await firstNameField.getAttribute('aria-labelledby');

      expect(labelId).toBeTruthy();

      const label = page.locator(`[id="${labelId}"]`);
      await expect(label).toBeVisible();
    });

    test('should announce validation errors to screen readers', async ({ page }) => {
      await helpers.navigateToPage('/onboarding/student');

      await helpers.clickButton('[data-testid="submit-button"]');

      const emailField = page.locator('[data-testid="email"]');
      const describedBy = await emailField.getAttribute('aria-describedby');

      expect(describedBy).toBeTruthy();

      const errorMessage = page.locator(`[id="${describedBy}"]`);
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toHaveAttribute('role', 'alert');
    });

    test('should focus first invalid field on submission', async ({ page }) => {
      await helpers.navigateToPage('/onboarding/student');

      await helpers.clickButton('[data-testid="submit-button"]');

      const firstNameField = page.locator('[data-testid="first-name"]');
      await expect(firstNameField).toBeFocused();
    });
  });
});
