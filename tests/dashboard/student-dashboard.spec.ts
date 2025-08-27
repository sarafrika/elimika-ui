import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Student Dashboard', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);

    await helpers.mockApiResponse('**/api/auth/session', {
      user: { id: '1', email: 'student@example.com', role: 'student' },
    });

    await helpers.mockApiResponse('**/api/students/**', {
      courses: [],
      schedule: [],
      grades: [],
      certificates: [],
    });
  });

  test('should display student navigation', async ({ page }) => {
    await helpers.navigateToPage('/dashboard');

    await helpers.expectToBeVisible('[data-testid="student-nav"]');
    await helpers.expectToBeVisible('text=Overview');
    await helpers.expectToBeVisible('text=My Courses');
    await helpers.expectToBeVisible('text=My Schedule');
    await helpers.expectToBeVisible('text=Grades');
    await helpers.expectToBeVisible('text=Certificates');
    await helpers.expectToBeVisible('text=Profile');
  });

  test('should navigate to courses page', async ({ page }) => {
    await helpers.navigateToPage('/dashboard');

    await helpers.clickButton('text=My Courses');

    await expect(page).toHaveURL(/dashboard.*my-courses/);
    await helpers.expectToBeVisible('[data-testid="courses-list"]');
  });

  test('should navigate to schedule page', async ({ page }) => {
    await helpers.navigateToPage('/dashboard');

    await helpers.clickButton('text=My Schedule');

    await expect(page).toHaveURL(/dashboard.*my-schedule/);
    await helpers.expectToBeVisible('[data-testid="schedule-view"]');
  });

  test('should display profile form when navigating to profile', async ({ page }) => {
    await helpers.navigateToPage('/dashboard');

    await helpers.clickButton('text=Profile');

    await expect(page).toHaveURL(/dashboard.*profile/);
    await helpers.expectToBeVisible('[data-testid="profile-form"]');
  });
});
