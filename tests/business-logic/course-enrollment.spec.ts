import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { mockApiResponses, mockCourses, mockUsers } from '../utils/mock-data';

test.describe('Course Enrollment Business Logic', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);

    await helpers.mockApiResponse('**/api/auth/session', mockApiResponses.session);
    await helpers.mockApiResponse('**/api/courses', mockApiResponses.courses);
  });

  test('should display available courses for enrollment', async ({ page }) => {
    await helpers.navigateToPage('/courses');

    await helpers.expectToBeVisible(`text=${mockCourses[0].title}`);
    await helpers.expectToBeVisible(`text=${mockCourses[0].description}`);
    await helpers.expectToBeVisible(`text=$${mockCourses[0].price}`);
    await helpers.expectToBeVisible(`[data-testid="enroll-button-${mockCourses[0].id}"]`);
  });

  test('should show course details when clicked', async ({ page }) => {
    await helpers.navigateToPage('/courses');

    await helpers.clickButton(`[data-testid="course-card-${mockCourses[0].id}"]`);

    await expect(page).toHaveURL(`/courses/${mockCourses[0].id}`);
    await helpers.expectToBeVisible(`text=${mockCourses[0].title}`);
    await helpers.expectToBeVisible(`text=${mockCourses[0].description}`);
    await helpers.expectToBeVisible(`text=Duration: ${mockCourses[0].duration}`);
  });

  test('should handle enrollment process', async ({ page }) => {
    await helpers.mockApiResponse('**/api/enrollments', mockApiResponses.enrollment);
    await helpers.mockApiResponse('**/api/payments', mockApiResponses.payment);

    await helpers.navigateToPage(`/courses/${mockCourses[0].id}`);

    await helpers.clickButton(`[data-testid="enroll-button"]`);

    await helpers.expectToBeVisible('[data-testid="enrollment-modal"]');
    await helpers.expectToBeVisible(`text=Enroll in ${mockCourses[0].title}`);
    await helpers.expectToBeVisible(`text=Price: $${mockCourses[0].price}`);

    await helpers.clickButton('[data-testid="confirm-enrollment"]');

    await helpers.expectToBeVisible('[data-testid="payment-form"]');

    await helpers.fillFormField('[data-testid="card-number"]', '4242424242424242');
    await helpers.fillFormField('[data-testid="expiry-date"]', '12/25');
    await helpers.fillFormField('[data-testid="cvc"]', '123');

    await helpers.clickButton('[data-testid="pay-button"]');

    await helpers.expectToBeVisible('text=Enrollment successful');
    await expect(page).toHaveURL('/dashboard/my-courses');
  });

  test('should prevent enrollment when course is full', async ({ page }) => {
    const fullCourse = { ...mockCourses[0], capacity: 30, enrolledCount: 30 };
    await helpers.mockApiResponse('**/api/courses/*', { data: fullCourse });

    await helpers.navigateToPage(`/courses/${fullCourse.id}`);

    await helpers.expectToBeVisible('text=Course Full');
    await expect(page.locator('[data-testid="enroll-button"]')).toBeDisabled();
  });

  test('should show prerequisite warning when not met', async ({ page }) => {
    const courseWithPrereqs = {
      ...mockCourses[1],
      prerequisites: ['Introduction to React'],
      hasPrerequisites: false,
    };

    await helpers.mockApiResponse('**/api/courses/*', { data: courseWithPrereqs });

    await helpers.navigateToPage(`/courses/${courseWithPrereqs.id}`);

    await helpers.expectToBeVisible('text=Prerequisites not met');
    await helpers.expectToBeVisible('text=Introduction to React');
    await expect(page.locator('[data-testid="enroll-button"]')).toBeDisabled();
  });
});
