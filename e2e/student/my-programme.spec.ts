import { expect, test } from '@playwright/test';
import { mockShell, STUDENT_USER, STUDENT_UUID } from '../fixtures/grades';
import { mockProgrammeReport, PROGRAM_UUID } from '../fixtures/programme';
import { MockApi, paged } from '../support/api';
import { signIn } from '../support/session';

function mockStudent(api: MockApi) {
  mockShell(api, STUDENT_USER);
  api.get(
    /^\/api\/v1\/students\/search/,
    paged([{ uuid: STUDENT_UUID, user_uuid: STUDENT_USER.uuid, full_name: 'Amani Wekesa' }])
  );
  api.get(new RegExp(`^/api/v1/programs/${PROGRAM_UUID}$`), {
    uuid: PROGRAM_UUID,
    title: 'Foundation Music Certificate',
    status: 'published',
  });
  mockProgrammeReport(api);
}

test.describe('Student · My programme', () => {
  test('shows the provisional mark, the pass checklist, excused sessions and skill history', async ({
    page,
    context,
    baseURL,
  }) => {
    await signIn(context, STUDENT_USER, baseURL as string);
    const api = new MockApi();
    mockStudent(api);
    await api.install(page);
    await page.goto(`/dashboard/student/programs/${PROGRAM_UUID}?tab=assessment`);

    const report = page.getByTestId('programme-report');
    await expect(report.getByText('Programme mark so far')).toBeVisible();
    await expect(report.getByText('Provisional', { exact: true })).toBeVisible();
    await expect(report.getByRole('list', { name: 'To complete this programme' })).toContainText(
      'Pass all 5 mandatory courses'
    );

    await report.getByRole('button', { name: /Drums & Rhythm/ }).click();
    await expect(report.getByText('Attendance: 7 of 8 · 1 excused, not counted')).toBeVisible();
    await expect(
      report.getByText("Optional · doesn't count toward the programme mark")
    ).toBeVisible();

    const skills = page.getByTestId('programme-skills');
    await expect(
      skills.getByText('In your skills wallet as verified · from Foundation Music Certificate')
    ).toBeVisible();
    await expect(skills.getByRole('row')).toHaveCount(3);
    await skills.getByRole('button', { name: /Ensemble communication/ }).click();
    await expect(skills.getByText('No evidence yet.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save remarks' })).toHaveCount(0);
  });

  test('prints the academic report outside the dashboard', async ({ page, context, baseURL }) => {
    await signIn(context, STUDENT_USER, baseURL as string);
    const api = new MockApi();
    mockStudent(api);
    await api.install(page);
    await page.goto(`/programme-report/${PROGRAM_UUID}/${STUDENT_UUID}`);

    const sheet = page.getByTestId('programme-report-print');
    await expect(
      sheet.getByRole('heading', { name: 'Foundation Music Certificate' })
    ).toBeVisible();
    await expect(sheet.getByText('Amani Wekesa')).toBeVisible();
    await expect(sheet.getByText('75.76% (provisional)')).toBeVisible();
    await expect(sheet.getByText('7 / 8 (1 excused)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeVisible();
  });
});
