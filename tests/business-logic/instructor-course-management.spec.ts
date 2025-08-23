import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { mockUsers, mockCourses } from '../utils/mock-data';

test.describe('Instructor Course Management Business Logic', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);

    await helpers.mockApiResponse('**/api/auth/session', {
      user: mockUsers.instructor
    });
    await helpers.mockApiResponse('**/api/instructors/*/courses', {
      data: mockCourses
    });
  });

  test('should create a new course draft', async ({ page }) => {
    await helpers.mockApiResponse('**/api/courses', {
      success: true,
      course: { id: '3', title: 'New Course', status: 'draft' }
    });

    await helpers.navigateToPage('/dashboard/course-management/create-new-course');
    
    await helpers.fillFormField('[data-testid="course-title"]', 'Advanced TypeScript');
    await helpers.fillFormField('[data-testid="course-description"]', 'Master TypeScript advanced features');
    await helpers.clickButton('[data-testid="course-category"]');
    await helpers.clickButton('text=Programming');
    await helpers.fillFormField('[data-testid="course-duration"]', '10');
    await helpers.fillFormField('[data-testid="course-price"]', '399.99');
    
    await helpers.clickButton('[data-testid="save-draft-button"]');
    
    await helpers.expectToBeVisible('text=Course draft saved successfully');
    await expect(page).toHaveURL('/dashboard/course-management/drafts');
  });

  test('should validate required course fields', async ({ page }) => {
    await helpers.navigateToPage('/dashboard/course-management/create-new-course');
    
    await helpers.clickButton('[data-testid="save-draft-button"]');
    
    await helpers.expectToBeVisible('text=Course title is required');
    await helpers.expectToBeVisible('text=Course description is required');
    await helpers.expectToBeVisible('text=Category is required');
  });

  test('should publish a draft course', async ({ page }) => {
    await helpers.mockApiResponse('**/api/courses/*/publish', {
      success: true,
      course: { ...mockCourses[1], isPublished: true }
    });

    await helpers.navigateToPage('/dashboard/course-management/drafts');
    
    await helpers.clickButton(`[data-testid="publish-course-${mockCourses[1].id}"]`);
    
    await helpers.expectToBeVisible('[data-testid="publish-confirmation-modal"]');
    await helpers.expectToBeVisible('text=Are you sure you want to publish this course?');
    
    await helpers.clickButton('[data-testid="confirm-publish"]');
    
    await helpers.expectToBeVisible('text=Course published successfully');
    await helpers.expectToBeVisible('[data-testid="published-courses-list"]');
  });

  test('should prevent publishing incomplete courses', async ({ page }) => {
    const incompleteCourse = {
      ...mockCourses[1],
      hasLessons: false,
      hasAssignments: false
    };

    await helpers.mockApiResponse('**/api/courses/*', { data: incompleteCourse });

    await helpers.navigateToPage('/dashboard/course-management/drafts');
    
    await helpers.clickButton(`[data-testid="publish-course-${incompleteCourse.id}"]`);
    
    await helpers.expectToBeVisible('text=Course cannot be published');
    await helpers.expectToBeVisible('text=Add at least one lesson');
    await helpers.expectToBeVisible('text=Add at least one assignment');
  });

  test('should manage course pricing', async ({ page }) => {
    await helpers.mockApiResponse('**/api/courses/*/pricing', {
      success: true,
      pricing: { price: 199.99, discountPrice: 149.99 }
    });

    await helpers.navigateToPage(`/dashboard/course-management/preview/${mockCourses[0].id}`);
    
    await helpers.clickButton('[data-testid="edit-pricing-button"]');
    
    await helpers.expectToBeVisible('[data-testid="pricing-modal"]');
    
    await helpers.fillFormField('[data-testid="course-price"]', '199.99');
    await helpers.fillFormField('[data-testid="discount-price"]', '149.99');
    
    await helpers.clickButton('[data-testid="save-pricing"]');
    
    await helpers.expectToBeVisible('text=Pricing updated successfully');
  });

  test('should add lessons to course', async ({ page }) => {
    await helpers.mockApiResponse('**/api/courses/*/lessons', {
      success: true,
      lesson: { id: '1', title: 'Introduction to Components' }
    });

    await helpers.navigateToPage(`/dashboard/course-management/preview/${mockCourses[0].id}`);
    
    await helpers.clickButton('[data-testid="add-lesson-button"]');
    
    await helpers.expectToBeVisible('[data-testid="lesson-form"]');
    
    await helpers.fillFormField('[data-testid="lesson-title"]', 'Introduction to Components');
    await helpers.fillFormField('[data-testid="lesson-content"]', 'Learn about React components');
    await helpers.fillFormField('[data-testid="lesson-duration"]', '45');
    
    await helpers.clickButton('[data-testid="save-lesson"]');
    
    await helpers.expectToBeVisible('text=Lesson added successfully');
    await helpers.expectToBeVisible('text=Introduction to Components');
  });
});