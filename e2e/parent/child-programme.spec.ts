import { expect, test } from '@playwright/test';
import { mockShell, PARENT_USER, STUDENT_UUID } from '../fixtures/grades';
import { mockProgrammeReport, PROGRAM_UUID } from '../fixtures/programme';
import { MockApi } from '../support/api';
import { signIn } from '../support/session';

test.describe("Parent · Child's programme", () => {
  test("shows the child's programme mark, courses, skills and latest remarks, read only", async ({
    page,
    context,
    baseURL,
  }) => {
    await signIn(context, PARENT_USER, baseURL as string);
    const api = new MockApi();
    mockShell(api, PARENT_USER);
    api.get(/^\/api\/v1\/guardians\/me\/students$/, [
      {
        student_uuid: STUDENT_UUID,
        student_name: 'Amani Wekesa',
        status: 'ACTIVE',
        share_scope: 'ACADEMICS',
      },
    ]);
    api.get(new RegExp(`^/api/v1/guardians/students/${STUDENT_UUID}/dashboard$`), {
      student_uuid: STUDENT_UUID,
      student_name: 'Amani Wekesa',
      share_scope: 'ACADEMICS',
      status: 'ACTIVE',
      course_progress: [],
      program_progress: [],
      compliance_notices: [],
    });
    mockProgrammeReport(api);
    await api.install(page);
    await page.goto('/dashboard/parent/overview');

    const card = page.getByRole('region', { name: 'Foundation Music Certificate report' });
    await expect(card.getByText('75.76%').first()).toBeVisible();
    await expect(card.getByText('3 of 5')).toBeVisible();
    await expect(card.getByText('Performance technique · Achieved')).toBeVisible();
    await expect(card.getByText('Latest from the instructor')).toBeVisible();
    await expect(card.getByText('Strong left-hand control.')).toBeVisible();
    await expect(card.getByRole('link', { name: 'Print report' })).toHaveAttribute(
      'href',
      `/programme-report/${PROGRAM_UUID}/${STUDENT_UUID}`
    );
    await expect(page.getByRole('button', { name: 'Save remarks' })).toHaveCount(0);
  });
});
