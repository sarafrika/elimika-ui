import { expect, test } from '@playwright/test';
import { CLASS_ID, INSTRUCTOR, mockInstructorWorkbook, SESSION_ID } from '../fixtures/session-report';
import { MockApi, paged } from '../support/api';
import { signIn } from '../support/session';

const HOUR = 3_600_000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString();

test('the training hub lists overdue, due and editable session reports with the right action', async ({ page, context, baseURL }) => {
  await signIn(context, INSTRUCTOR, baseURL as string);
  const reports = [
    { report_uuid: 'r1', instance_uuid: SESSION_ID, class_definition_uuid: CLASS_ID, status: 'draft', overdue: true, due_at: iso(-3 * HOUR), session_start: iso(-30 * HOUR) },
    { report_uuid: 'r2', instance_uuid: 's2', class_definition_uuid: CLASS_ID, status: 'draft', overdue: false, due_at: iso(18 * HOUR), session_start: iso(-6 * HOUR) },
    { report_uuid: 'r3', instance_uuid: 's3', class_definition_uuid: CLASS_ID, status: 'submitted', overdue: false, editable_until: iso(40 * HOUR), session_start: iso(-50 * HOUR) },
  ];
  const api = mockInstructorWorkbook(new MockApi())
    .get(/^\/api\/v1\/timetable\/session-reports$/, paged(reports))
    .get(/^\/api\/v1\/classes\/batch$/, [{ uuid: CLASS_ID, title: 'Drums D4' }]);
  await api.install(page);
  await page.goto('/dashboard/instructor/training-hub');

  const panel = page.getByTestId('reports-due');
  await expect(panel.getByText('Session reports due')).toBeVisible();
  await expect(panel.getByText('Overdue by 3h')).toBeVisible();
  await expect(panel.getByText(/Due in 1[78]h/)).toBeVisible();
  await expect(panel.getByRole('link', { name: 'Submit now' })).toHaveAttribute(
    'href',
    `/dashboard/instructor/classes/training/${CLASS_ID}?schedule=${SESSION_ID}&tab=report`
  );
  await expect(panel.getByRole('link', { name: 'Review' })).toBeVisible();

  await panel.getByRole('button', { name: 'Overdue' }).click();
  await expect(panel.getByRole('listitem')).toHaveCount(1);
  await panel.getByRole('button', { name: 'Submitted' }).click();
  await expect(panel.getByRole('listitem')).toHaveCount(1);
  await expect(panel.getByText(/Submitted · editable until/)).toBeVisible();
  const statusQuery = api.calls.find(c => c.path === '/api/v1/timetable/session-reports')?.search ?? '';
  expect(statusQuery).toContain('status=draft');
});

test('nothing renders when no report is owed', async ({ page, context, baseURL }) => {
  await signIn(context, INSTRUCTOR, baseURL as string);
  await mockInstructorWorkbook(new MockApi()).get(/^\/api\/v1\/timetable\/session-reports$/, paged([])).install(page);
  await page.goto('/dashboard/instructor/training-hub');
  await expect(page.getByRole('heading', { name: 'My Classes' })).toBeVisible();
  await expect(page.getByTestId('reports-due')).toHaveCount(0);
});
