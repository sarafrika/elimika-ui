import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { mockUsers } from '../utils/mock-data';

test.describe('User Profile Management Business Logic', () => {
  let helpers: TestHelpers;

  test.describe('Student Profile', () => {
    test.beforeEach(async ({ page }) => {
      helpers = new TestHelpers(page);
      await helpers.mockApiResponse('**/api/auth/session', { user: mockUsers.student });
    });

    test('should update student profile information', async ({ page }) => {
      await helpers.mockApiResponse('**/api/students/*', {
        success: true,
        student: { ...mockUsers.student, firstName: 'Updated' }
      });

      await helpers.navigateToPage('/dashboard/profile/general');
      
      await helpers.fillFormField('[data-testid="first-name"]', 'Updated');
      await helpers.fillFormField('[data-testid="last-name"]', 'Name');
      await helpers.fillFormField('[data-testid="phone"]', '+1111111111');
      
      await helpers.clickButton('[data-testid="save-profile"]');
      
      await helpers.expectToBeVisible('text=Profile updated successfully');
    });

    test('should validate profile form fields', async ({ page }) => {
      await helpers.navigateToPage('/dashboard/profile/general');
      
      await helpers.fillFormField('[data-testid="first-name"]', '');
      await helpers.fillFormField('[data-testid="last-name"]', '');
      await helpers.fillFormField('[data-testid="phone"]', 'invalid-phone');
      
      await helpers.clickButton('[data-testid="save-profile"]');
      
      await helpers.expectToBeVisible('text=First name is required');
      await helpers.expectToBeVisible('text=Last name is required');
      await helpers.expectToBeVisible('text=Invalid phone number format');
    });

    test('should add education information', async ({ page }) => {
      await helpers.mockApiResponse('**/api/students/*/education', {
        success: true,
        education: { id: '1', degree: 'Bachelor of Science', institution: 'University' }
      });

      await helpers.navigateToPage('/dashboard/profile/education');
      
      await helpers.fillFormField('[data-testid="degree"]', 'Bachelor of Science');
      await helpers.fillFormField('[data-testid="institution"]', 'Tech University');
      await helpers.fillFormField('[data-testid="graduation-year"]', '2020');
      
      await helpers.clickButton('[data-testid="add-education"]');
      
      await helpers.expectToBeVisible('text=Education added successfully');
      await helpers.expectToBeVisible('text=Bachelor of Science');
    });
  });

  test.describe('Instructor Profile', () => {
    test.beforeEach(async ({ page }) => {
      helpers = new TestHelpers(page);
      await helpers.mockApiResponse('**/api/auth/session', { user: mockUsers.instructor });
    });

    test('should update instructor specializations', async ({ page }) => {
      await helpers.mockApiResponse('**/api/instructors/*/skills', {
        success: true,
        skills: ['React', 'Vue.js', 'Angular']
      });

      await helpers.navigateToPage('/dashboard/profile/skills');
      
      await helpers.clickButton('[data-testid="skill-selector"]');
      await helpers.clickButton('text=Vue.js');
      await helpers.clickButton('text=Angular');
      
      await helpers.clickButton('[data-testid="save-skills"]');
      
      await helpers.expectToBeVisible('text=Skills updated successfully');
      await helpers.expectToBeVisible('text=Vue.js');
      await helpers.expectToBeVisible('text=Angular');
    });

    test('should add professional experience', async ({ page }) => {
      await helpers.mockApiResponse('**/api/instructors/*/experience', {
        success: true,
        experience: { id: '1', company: 'Tech Corp', position: 'Senior Developer' }
      });

      await helpers.navigateToPage('/dashboard/profile/experience');
      
      await helpers.fillFormField('[data-testid="company-name"]', 'Tech Corp');
      await helpers.fillFormField('[data-testid="position"]', 'Senior Developer');
      await helpers.fillFormField('[data-testid="start-date"]', '2018-01');
      await helpers.fillFormField('[data-testid="end-date"]', '2023-12');
      await helpers.fillFormField('[data-testid="description"]', 'Led development team');
      
      await helpers.clickButton('[data-testid="add-experience"]');
      
      await helpers.expectToBeVisible('text=Experience added successfully');
      await helpers.expectToBeVisible('text=Tech Corp');
      await helpers.expectToBeVisible('text=Senior Developer');
    });

    test('should set availability schedule', async ({ page }) => {
      await helpers.mockApiResponse('**/api/instructors/*/availability', {
        success: true,
        availability: { monday: ['09:00-17:00'], tuesday: ['10:00-16:00'] }
      });

      await helpers.navigateToPage('/dashboard/profile/availability');
      
      await helpers.clickButton('[data-testid="monday-checkbox"]');
      await helpers.fillFormField('[data-testid="monday-start"]', '09:00');
      await helpers.fillFormField('[data-testid="monday-end"]', '17:00');
      
      await helpers.clickButton('[data-testid="tuesday-checkbox"]');
      await helpers.fillFormField('[data-testid="tuesday-start"]', '10:00');
      await helpers.fillFormField('[data-testid="tuesday-end"]', '16:00');
      
      await helpers.clickButton('[data-testid="save-availability"]');
      
      await helpers.expectToBeVisible('text=Availability updated successfully');
    });
  });

  test.describe('Organization Profile', () => {
    test.beforeEach(async ({ page }) => {
      helpers = new TestHelpers(page);
      await helpers.mockApiResponse('**/api/auth/session', { user: mockUsers.organization });
    });

    test('should update training center information', async ({ page }) => {
      await helpers.mockApiResponse('**/api/organizations/*', {
        success: true,
        organization: { ...mockUsers.organization, address: 'Updated Address' }
      });

      await helpers.navigateToPage('/dashboard/account/training-center');
      
      await helpers.fillFormField('[data-testid="organization-name"]', 'Updated Tech Academy');
      await helpers.fillFormField('[data-testid="address"]', '123 Main St');
      await helpers.fillFormField('[data-testid="city"]', 'Tech City');
      await helpers.fillFormField('[data-testid="postal-code"]', '12345');
      
      await helpers.clickButton('[data-testid="save-training-center"]');
      
      await helpers.expectToBeVisible('text=Training center information updated');
    });
  });
});