import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Instructor Dashboard', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    await helpers.mockApiResponse('**/api/auth/session', {
      user: { id: '1', email: 'instructor@example.com', role: 'instructor' }
    });
    
    await helpers.mockApiResponse('**/api/instructors/**', {
      courses: [],
      classes: [],
      students: [],
      earnings: 0
    });
  });

  test('should display instructor navigation', async ({ page }) => {
    await helpers.navigateToPage('/dashboard');
    
    await helpers.expectToBeVisible('[data-testid="instructor-nav"]');
    await helpers.expectToBeVisible('text=Overview');
    await helpers.expectToBeVisible('text=Course Management');
    await helpers.expectToBeVisible('text=Classes');
    await helpers.expectToBeVisible('text=Students');
    await helpers.expectToBeVisible('text=Assignments');
    await helpers.expectToBeVisible('text=Reviews');
    await helpers.expectToBeVisible('text=Earnings');
    await helpers.expectToBeVisible('text=Profile');
  });

  test('should navigate to course management', async ({ page }) => {
    await helpers.navigateToPage('/dashboard');
    
    await helpers.clickButton('text=Course Management');
    
    await expect(page).toHaveURL(/dashboard.*course-management/);
    await helpers.expectToBeVisible('[data-testid="course-management-view"]');
  });

  test('should display course creation form', async ({ page }) => {
    await helpers.navigateToPage('/dashboard/course-management/create-new-course');
    
    await helpers.expectToBeVisible('[data-testid="course-creation-form"]');
    await helpers.expectToBeVisible('[data-testid="course-title"]');
    await helpers.expectToBeVisible('[data-testid="course-description"]');
    await helpers.expectToBeVisible('[data-testid="course-category"]');
  });

  test('should create a new course', async ({ page }) => {
    await helpers.mockApiResponse('**/api/courses', {
      success: true,
      course: { id: '1', title: 'Test Course' }
    });

    await helpers.navigateToPage('/dashboard/course-management/create-new-course');
    
    await helpers.fillFormField('[data-testid="course-title"]', 'Introduction to React');
    await helpers.fillFormField('[data-testid="course-description"]', 'Learn React fundamentals');
    await helpers.clickButton('[data-testid="course-category"]');
    await helpers.clickButton('text=Programming');
    
    await helpers.clickButton('[data-testid="create-course-button"]');
    
    await expect(page.locator('text=Course created successfully')).toBeVisible();
  });
});