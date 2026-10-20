import { expect, test } from '@playwright/test';
import {
  INSTRUCTOR,
  LEARNERS,
  mockInstructorWorkbook,
  REPORT_PATH,
  SUBMIT_PATH,
  sessionReport,
  WORKBOOK_URL,
} from '../fixtures/session-report';
import { MockApi } from '../support/api';
import { signIn } from '../support/session';

test.describe('Instructor · Session report', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await signIn(context, INSTRUCTOR, baseURL as string);
  });

  test('blocks submission until the checklist is done and links to the fix', async ({ page }) => {
    const api = mockInstructorWorkbook(new MockApi()).get(
      REPORT_PATH,
      sessionReport({
        can_submit: false,
        checklist: [
          { code: 'SCORE_MISSING', severity: 'blocker', student_uuid: LEARNERS.amani.uuid, message: 'No score yet' },
          { code: 'TOPIC_NOT_RECORDED', severity: 'blocker', message: 'Record what was taught' },
        ],
      })
    );
    await api.install(page);
    await page.goto(WORKBOOK_URL);

    const report = page.getByTestId('session-report');
    await expect(report.getByText('2 to do')).toBeVisible();
    await expect(report.getByText('Amani Wekesa: No score yet')).toBeVisible();
    await expect(report.getByRole('button', { name: 'Preview & submit' })).toBeDisabled();
    await report.getByRole('button', { name: 'Score' }).click();
    await expect(page).toHaveURL(/tab=grading/);
  });

  test('shows the class aggregates and every learner row', async ({ page }) => {
    await mockInstructorWorkbook(new MockApi()).get(REPORT_PATH, sessionReport()).install(page);
    await page.goto(WORKBOOK_URL);

    const report = page.getByTestId('session-report');
    await expect(report.getByText('1 of 2 · 50%')).toBeVisible();
    await expect(report.getByText('27.5 / 30').first()).toBeVisible();
    await expect(report.getByText('1 Merit')).toBeVisible();
    const amani = report.getByRole('row', { name: /Amani Wekesa/ });
    await expect(amani).toContainText('Present');
    await expect(amani.locator('strong', { hasText: 'Steady' })).toBeVisible();
    await expect(report.getByRole('row', { name: /Brian Otieno/ })).toContainText('Absent');
  });

  test('previews the frozen report and submits it', async ({ page }) => {
    let submitted = false;
    const api = mockInstructorWorkbook(new MockApi())
      .get(REPORT_PATH, () => (submitted ? sessionReport({ status: 'submitted', submitted_at: '2026-10-19T09:00:00Z', editable_until: '2026-10-21T09:00:00Z' }) : sessionReport()))
      .on('POST', SUBMIT_PATH, () => {
        submitted = true;
        return sessionReport({ status: 'submitted' });
      });
    await api.install(page);
    await page.goto(WORKBOOK_URL);

    await page.getByRole('button', { name: 'Preview & submit' }).click();
    const preview = page.getByRole('dialog', { name: 'Preview session report' });
    await expect(preview.getByText('Attendance 1 of 2 · Class average 27.5 / 30')).toBeVisible();
    await preview.getByRole('button', { name: 'Submit report' }).click();

    await expect.poll(() => api.callsTo('POST', SUBMIT_PATH).length).toBe(1);
    await expect(page.getByText('Session report submitted.')).toBeVisible();
    await expect(page.getByTestId('session-report').getByText('Submitted', { exact: true })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'You can still change anything until' })).toBeVisible();
  });

  test('a locked report cannot be resubmitted or fixed', async ({ page }) => {
    await mockInstructorWorkbook(new MockApi())
      .get(
        REPORT_PATH,
        sessionReport({
          status: 'locked',
          editable_until: '2026-10-19T10:00:00Z',
          can_submit: false,
          checklist: [{ code: 'SCORE_MISSING', severity: 'note', student_uuid: LEARNERS.amani.uuid, message: 'No score' }],
        })
      )
      .install(page);
    await page.goto(WORKBOOK_URL);

    const report = page.getByTestId('session-report');
    await expect(report.getByRole('button', { name: 'Report locked' })).toBeDisabled();
    await expect(report.getByText(/Records for this session can no longer be changed/)).toBeVisible();
    await expect(report.getByRole('button', { name: 'Score' })).toHaveCount(0);
  });
});
