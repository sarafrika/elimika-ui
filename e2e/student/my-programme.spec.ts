import { expect, type Page, test } from '@playwright/test';
import { mockShell, progressReport, STUDENT_USER, STUDENT_UUID } from '../fixtures/grades';
import {
  failedReport,
  mockProgrammeReport,
  PROGRAM_UUID,
  passedReport,
  programmeReport,
} from '../fixtures/programme';
import { httpError, MockApi, paged } from '../support/api';
import { signIn } from '../support/session';

function mockStudent(api: MockApi, report: unknown = programmeReport()) {
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
  mockProgrammeReport(api, report);
  api.get(/\/gradebook\/enrollments\/[^/]+\/progress-report$/, progressReport());
  return api;
}

async function openAssessment(page: Page, api: MockApi) {
  await api.install(page);
  await page.goto(`/dashboard/student/programs/${PROGRAM_UUID}?tab=assessment`);
  return page.getByTestId('programme-report');
}

test.describe('Student · Program › Assessment', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await signIn(context, STUDENT_USER, baseURL as string);
  });

  test('shows the provisional report: mark, pass rule, courses, attendance, skills and remarks', async ({
    page,
  }) => {
    const report = await openAssessment(page, mockStudent(new MockApi()));

    await expect(report.getByText('Program mark', { exact: true })).toBeVisible();
    await expect(report.getByText('Provisional', { exact: true })).toBeVisible();
    await expect(report.getByText('25 of 26 sessions, 1 excused')).toBeVisible();
    await expect(report.getByText('96%', { exact: true })).toBeVisible();
    const rules = report.getByRole('list', { name: 'To pass this program' });
    await expect(rules).toContainText('Program mark at least 50%');
    await expect(rules).toContainText('Drums & Rhythm, Performance & Ensemble have no result yet');

    const drums = report.getByTestId('programme-course').filter({ hasText: 'Drums & Rhythm' });
    await expect(drums).toContainText('7 of 8 · 1 excused');
    await expect(drums).toContainText('88%');
    await expect(
      report.getByTestId('programme-course').filter({ hasText: 'Music Theory Club' })
    ).toContainText("Doesn't count");
    await expect(report.getByText('13.75 points ÷ 15% of weight decided so far')).toBeVisible();

    const skills = report.getByTestId('programme-skills');
    await expect(skills.getByText('Achieved from 70%', { exact: false })).toBeVisible();
    await expect(
      skills.getByTestId('programme-skill').filter({ hasText: 'Ensemble communication' })
    ).toContainText('Not assessed yet');
    await expect(
      skills.getByRole('link', { name: 'Verified in your Skills Wallet' })
    ).toHaveAttribute('href', '/dashboard/student/skills-wallet?tab=skills');
    // The learner reads levels here; evidence lives in the wallet.
    await expect(skills.getByRole('button', { name: /Evidence/ })).toHaveCount(0);
    await expect(page.getByText('In your skills wallet as verified')).toHaveCount(0);

    const remarks = report.getByRole('region', { name: 'Progress remarks' });
    await expect(remarks.getByTestId('programme-remark')).toHaveCount(1);
    await expect(remarks.getByText('Grace Njeri')).toBeVisible();
    await expect(remarks.getByText('Strong left-hand control.')).toBeVisible();
    await remarks.getByRole('button', { name: 'Show 1 earlier remark' }).click();
    await expect(remarks.getByTestId('programme-remark')).toHaveCount(2);
    await expect(remarks.getByText('Good posture at the keyboard.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Write remarks' })).toHaveCount(0);
  });

  test('a course row opens its lesson marks from the course gradebook', async ({ page }) => {
    const report = await openAssessment(page, mockStudent(new MockApi()));
    await report.getByRole('button', { name: 'Lesson marks for Introduction to Piano' }).click();
    const sheet = page.getByTestId('lesson-marks-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText('Review / piano orientation')).toBeVisible();
    // Courses without an enrolment have no gradebook to open.
    await expect(
      report.getByRole('button', { name: 'Lesson marks for Drums & Rhythm' })
    ).toHaveCount(0);
  });

  test('a passed program shows a final mark and both rules met', async ({ page }) => {
    const report = await openAssessment(page, mockStudent(new MockApi(), passedReport()));
    await expect(report.getByText('Final', { exact: true })).toBeVisible();
    await expect(
      report.getByText('All 3 mandatory courses have a result, so this mark is final.')
    ).toBeVisible();
    await expect(report.getByRole('list', { name: 'To pass this program' })).toContainText(
      'All 3 passed'
    );
    await expect(page.getByTestId('programme-failed-alert')).toHaveCount(0);
  });

  test('a failed mandatory course is explained in plain words', async ({ page }) => {
    await openAssessment(page, mockStudent(new MockApi(), failedReport()));
    const alert = page.getByTestId('programme-failed-alert');
    await expect(alert).toContainText('Not passed because a mandatory course was failed.');
    await expect(alert).toContainText(
      'Your program mark is 76.02%, above the 50% pass mark, but Drums & Rhythm is mandatory and finished at 45.00%.'
    );
  });

  test('a learner who has not enrolled is pointed to the classes', async ({ page }) => {
    const api = mockStudent(new MockApi());
    api.get(new RegExp(`^/api/v1/programs/${PROGRAM_UUID}/students/${STUDENT_UUID}/report`), () =>
      httpError(403, 'Access denied')
    );
    await api.install(page);
    await page.goto(`/dashboard/student/programs/${PROGRAM_UUID}?tab=assessment`);
    const empty = page.getByTestId('programme-report-no-access');
    await expect(empty.getByText('Your report starts when you enrol')).toBeVisible();
    await expect(empty.getByRole('link', { name: 'Find classes' })).toBeVisible();
  });

  test('previews the report in a Sheet before printing', async ({ page }) => {
    const report = await openAssessment(page, mockStudent(new MockApi()));
    await report.getByRole('button', { name: 'Print report' }).click();
    const preview = page.getByTestId('programme-report-preview');
    await expect(
      preview.getByRole('heading', { name: 'Foundation Music Certificate' })
    ).toBeVisible();
    await expect(preview.getByText('Amani Wekesa')).toBeVisible();
    await expect(preview.getByTestId('pass-rule-footer')).toContainText(
      'Pass rule: program mark at least 50% and every mandatory course passed.'
    );
    await expect(page.getByRole('link', { name: 'Print report' })).toHaveAttribute(
      'href',
      `/programme-report/${PROGRAM_UUID}/${STUDENT_UUID}?print=1`
    );
  });

  test('prints the academic report outside the dashboard', async ({ page }) => {
    const api = mockStudent(new MockApi());
    await api.install(page);
    await page.goto(`/programme-report/${PROGRAM_UUID}/${STUDENT_UUID}`);

    const sheet = page.getByTestId('programme-report-print');
    await expect(
      sheet.getByRole('heading', { name: 'Foundation Music Certificate' })
    ).toBeVisible();
    await expect(sheet.getByText('Amani Wekesa')).toBeVisible();
    await expect(sheet.getByText('(provisional)').first()).toBeVisible();
    await expect(sheet.getByText('7 of 8 · 1 excused')).toBeVisible();
    await expect(sheet.getByText('Progress remarks · Grace Njeri', { exact: false })).toBeVisible();
    await expect(sheet.getByTestId('pass-rule-footer')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeVisible();
  });

  test('the print route says so when the report is not available', async ({ page }) => {
    const api = mockStudent(new MockApi());
    api.get(new RegExp(`^/api/v1/programs/${PROGRAM_UUID}/students/${STUDENT_UUID}/report`), () =>
      httpError(403, 'Access denied')
    );
    await api.install(page);
    await page.goto(`/programme-report/${PROGRAM_UUID}/${STUDENT_UUID}`);
    await expect(page.getByText('This report is not available')).toBeVisible();
  });
});
