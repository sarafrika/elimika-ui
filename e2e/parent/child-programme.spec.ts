import { expect, type Page, test } from '@playwright/test';
import {
  COURSE_UUID,
  ENROLLMENT_UUID,
  mockShell,
  PARENT_USER,
  progressReport,
  STUDENT_UUID,
} from '../fixtures/grades';
import { mockProgrammeReport, PROGRAM_UUID } from '../fixtures/programme';
import { MockApi } from '../support/api';
import { signIn } from '../support/session';

function mockParent(api: MockApi, scope: 'ACADEMICS' | 'ATTENDANCE') {
  mockShell(api, PARENT_USER);
  api.get(/^\/api\/v1\/guardians\/me\/students$/, [
    {
      student_uuid: STUDENT_UUID,
      student_name: 'Amani Wekesa',
      status: 'ACTIVE',
      share_scope: scope,
    },
  ]);
  api.get(new RegExp(`^/api/v1/guardians/students/${STUDENT_UUID}/dashboard$`), {
    student_uuid: STUDENT_UUID,
    student_name: 'Amani Wekesa',
    share_scope: scope,
    status: 'ACTIVE',
    course_progress: [
      {
        enrollment_uuid: ENROLLMENT_UUID,
        course_uuid: COURSE_UUID,
        course_name: 'Introduction to Piano',
        status: 'ACTIVE',
        progress_percentage: 60,
      },
    ],
    program_progress: [
      {
        program_uuid: PROGRAM_UUID,
        program_name: 'Foundation Music Certificate',
        progress_percentage: 40,
      },
    ],
    compliance_notices: [],
  });
  mockProgrammeReport(api);
  api.get(/\/gradebook\/enrollments\/[^/]+\/progress-report$/, progressReport());
  return api;
}

async function open(page: Page, api: MockApi) {
  await api.install(page);
  await page.goto('/dashboard/parent/overview');
}

test.describe("Parent · Child's program", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await signIn(context, PARENT_USER, baseURL as string);
  });

  test('one card grid: the program card leads the course cards, with no milestones panel', async ({
    page,
  }) => {
    await open(page, mockParent(new MockApi(), 'ACADEMICS'));

    const grid = page.getByTestId('guardian-card-grid');
    const card = grid.getByTestId('guardian-program-card');
    await expect(card.getByText('Foundation Music Certificate')).toBeVisible();
    await expect(card.getByText('Program mark · Provisional')).toBeVisible();
    await expect(card.getByText('75.76%')).toBeVisible();
    await expect(card.getByText('3 of 5')).toBeVisible();
    await expect(card.getByText('1 of 3 mandatory courses have a result')).toBeVisible();
    await expect(card.getByText('Strong left-hand control.')).toBeVisible();
    await expect(card.getByText(/Grace Njeri ·/)).toBeVisible();
    await expect(grid.getByText('Introduction to Piano')).toBeVisible();
    await expect(
      grid.getByText('Course · counts towards Foundation Music Certificate', { exact: false })
    ).toBeVisible();
    await expect(page.getByText('Program milestones')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Write remarks' })).toHaveCount(0);
  });

  test('the program card opens the full report in a Sheet, with lesson marks and print', async ({
    page,
  }) => {
    await open(page, mockParent(new MockApi(), 'ACADEMICS'));
    await page
      .getByTestId('guardian-program-card')
      .getByRole('button', { name: 'View full report' })
      .click();

    const sheet = page.getByRole('dialog', { name: 'Amani Wekesa · Program report' });
    const report = sheet.getByTestId('programme-report');
    await expect(report.getByRole('list', { name: 'To pass this program' })).toBeVisible();
    await expect(report.getByText('Performance technique')).toBeVisible();
    // Guardians can open the evidence behind a level.
    await report.getByRole('button', { name: 'Evidence (2)' }).click();
    await expect(report.getByTestId('evidence-table')).toContainText('Grace Njeri');
    await expect(report.getByRole('button', { name: 'Print report' })).toBeVisible();

    await report.getByRole('button', { name: 'Lesson marks for Introduction to Piano' }).click();
    await expect(
      page.getByTestId('lesson-marks-sheet').getByText('Review / piano orientation')
    ).toBeVisible();
  });

  test('attendance-only sharing hides marks and program reports and says why', async ({ page }) => {
    const api = mockParent(new MockApi(), 'ATTENDANCE');
    await open(page, api);
    await expect(page.getByTestId('parent-attendance-only')).toContainText(
      "You can see Amani's attendance."
    );
    await expect(page.getByTestId('guardian-program-card')).toHaveCount(0);
    expect(api.callsTo('GET', /\/programs\/students\/[^/]+\/reports$/)).toHaveLength(0);
  });
});
