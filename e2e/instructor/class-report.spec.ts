import { expect, test } from '@playwright/test';
import { CLASS_ID, INSTRUCTOR, LEARNERS, mockInstructorWorkbook } from '../fixtures/session-report';
import { MockApi, raw } from '../support/api';
import { signIn } from '../support/session';

const REPORT = new RegExp(`^/api/v1/timetable/classes/${CLASS_ID}/report$`);
const CSV = new RegExp(`^/api/v1/timetable/classes/${CLASS_ID}/report\\.csv$`);

test('the class report shows every learner per session, averages and bands, and exports CSV', async ({ page, context, baseURL }) => {
  await signIn(context, INSTRUCTOR, baseURL as string);
  const api = mockInstructorWorkbook(new MockApi())
    .get(REPORT, {
      class_definition_uuid: CLASS_ID,
      class_title: 'Drums D4',
      sessions: [
        { instance_uuid: 'i1', lesson_number: 1, start_time: '2026-10-05T07:00:00Z', report_status: 'submitted', class_average: 27.5, max_score: 30 },
        { instance_uuid: 'i2', lesson_number: 2, start_time: '2026-10-12T07:00:00Z', report_status: 'draft', overdue: true, max_score: 30 },
      ],
      students: [
        {
          student_uuid: LEARNERS.amani.uuid,
          cells: [
            { instance_uuid: 'i1', attendance: 'ATTENDED', score_status: 'submitted', score: 27.5 },
            { instance_uuid: 'i2', attendance: 'ATTENDED', score_status: 'draft', score: 21 },
          ],
          average: 27.5,
          average_percentage: 91.67,
          band: 'Merit',
        },
        {
          student_uuid: LEARNERS.brian.uuid,
          cells: [{ instance_uuid: 'i1', attendance: 'ABSENT', score_status: 'none' }],
          band: null,
        },
      ],
    })
    .get(CSV, raw('student,L1\nAmani Wekesa,27.5\n'));
  await api.install(page);
  await page.goto(`/dashboard/instructor/training-hub/classes/${CLASS_ID}/report`);

  const grid = page.getByTestId('class-report');
  const amani = grid.getByRole('row', { name: /Amani Wekesa/ });
  await expect(amani).toContainText('27.5');
  await expect(amani).toContainText('21*');
  await expect(amani).toContainText('91.67%');
  await expect(amani).toContainText('Merit');
  await expect(grid.getByRole('row', { name: /Brian Otieno/ })).toContainText('Absent');
  await expect(grid.getByText('Overdue')).toBeVisible();

  const download = page.waitForEvent('download');
  await grid.getByRole('button', { name: 'CSV' }).click();
  expect((await download).suggestedFilename()).toBe('Drums D4-report.csv');
});
