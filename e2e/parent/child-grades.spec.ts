import { expect, test } from '@playwright/test';
import { COURSE_UUID, ENROLLMENT_UUID, mockShell, PARENT_USER, progressReport, STUDENT_UUID } from '../fixtures/grades';
import { MockApi } from '../support/api';
import { signIn } from '../support/session';

test.describe("Parent · Child's grades", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await signIn(context, PARENT_USER, baseURL as string);
  });

  test('shows a grade summary per course and opens the full report', async ({ page }) => {
    const api = new MockApi();
    mockShell(api, PARENT_USER);
    api.get(/^\/api\/v1\/guardians\/me\/students$/, [
      { student_uuid: STUDENT_UUID, student_name: 'Amani Wekesa', status: 'ACTIVE', share_scope: 'FULL' },
    ]);
    api.get(new RegExp(`^/api/v1/guardians/students/${STUDENT_UUID}/dashboard$`), {
      student_uuid: STUDENT_UUID,
      student_name: 'Amani Wekesa',
      share_scope: 'FULL',
      status: 'ACTIVE',
      course_progress: [
        { enrollment_uuid: ENROLLMENT_UUID, course_uuid: COURSE_UUID, course_name: 'Introduction to Piano', status: 'ACTIVE', progress_percentage: 86 },
      ],
      program_progress: [],
      compliance_notices: [],
    });
    api.get(/\/gradebook\/enrollments\/[^/]+\/progress-report$/, progressReport());
    await api.install(page);
    await page.goto('/dashboard/parent/overview');

    const summary = page.getByTestId('guardian-grade-summary');
    await expect(summary.getByText('Merit')).toBeVisible();
    await expect(summary.getByText('27.5 / 30')).toBeVisible();
    await expect(summary.getByText('6 of 7')).toBeVisible();
    await expect(summary.locator('strong', { hasText: 'Good progress.' })).toBeVisible();

    await summary.getByRole('button', { name: 'View full report' }).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet.getByText('91.67%')).toBeVisible();
    await expect(sheet.getByText('Drafts are never shown.')).toBeVisible();
    await expect(sheet.getByText('From the instructor')).toBeVisible();
  });

  test('shows nothing about grades when the report is not available to guardians', async ({ page }) => {
    const api = new MockApi();
    mockShell(api, PARENT_USER);
    api.get(/^\/api\/v1\/guardians\/me\/students$/, [
      { student_uuid: STUDENT_UUID, student_name: 'Amani Wekesa', status: 'ACTIVE', share_scope: 'FULL' },
    ]);
    api.get(new RegExp(`^/api/v1/guardians/students/${STUDENT_UUID}/dashboard$`), {
      student_uuid: STUDENT_UUID,
      student_name: 'Amani Wekesa',
      course_progress: [{ enrollment_uuid: ENROLLMENT_UUID, course_uuid: COURSE_UUID, course_name: 'Introduction to Piano', status: 'ACTIVE', progress_percentage: 86 }],
    });
    api.get(/\/gradebook\/enrollments\/[^/]+\/progress-report$/, { success: false, message: 'Forbidden' });
    await api.install(page);
    await page.goto('/dashboard/parent/overview');
    await expect(page.getByText('Introduction to Piano')).toBeVisible();
    await expect(page.getByTestId('guardian-grade-summary')).toHaveCount(0);
  });
});
