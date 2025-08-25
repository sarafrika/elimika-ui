import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Responsive Design Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should display mobile navigation on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await helpers.navigateToPage('/dashboard');

    await helpers.expectToBeVisible('[data-testid="mobile-menu-button"]');
    await helpers.expectToBeHidden('[data-testid="desktop-sidebar"]');

    await helpers.clickButton('[data-testid="mobile-menu-button"]');

    await helpers.expectToBeVisible('[data-testid="mobile-sidebar"]');
  });

  test('should adapt form layouts for mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await helpers.navigateToPage('/onboarding/student');

    const form = page.locator('[data-testid="student-form"]');
    await expect(form).toHaveCSS('flex-direction', 'column');

    await helpers.expectToBeVisible('[data-testid="first-name"]');
    await helpers.expectToBeVisible('[data-testid="last-name"]');
  });

  test('should display course cards in grid on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad

    await helpers.navigateToPage('/courses');

    const courseGrid = page.locator('[data-testid="courses-grid"]');
    await expect(courseGrid).toBeVisible();

    const courseCards = page.locator('[data-testid^="course-card-"]');
    const count = await courseCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show desktop layout on large screens', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await helpers.navigateToPage('/dashboard');

    await helpers.expectToBeVisible('[data-testid="desktop-sidebar"]');
    await helpers.expectToBeHidden('[data-testid="mobile-menu-button"]');

    const sidebar = page.locator('[data-testid="desktop-sidebar"]');
    const mainContent = page.locator('[data-testid="main-content"]');

    await expect(sidebar).toBeVisible();
    await expect(mainContent).toBeVisible();
  });

  test('should handle touch interactions on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await helpers.navigateToPage('/courses');

    const firstCourse = page.locator('[data-testid^="course-card-"]').first();

    await firstCourse.tap();

    await expect(page).toHaveURL(/courses\/\d+/);
  });

  test('should maintain accessibility on all screen sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 }, // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await helpers.navigateToPage('/dashboard');

      const focusableElements = page.locator(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const count = await focusableElements.count();

      expect(count).toBeGreaterThan(0);

      await focusableElements.first().focus();
      await expect(focusableElements.first()).toBeFocused();
    }
  });
});
