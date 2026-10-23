import { expect, test } from '@playwright/test';
import { INSTRUCTOR, INSTRUCTOR_PROFILE, mockInstructorWorkbook } from '../fixtures/session-report';
import { MockApi, paged } from '../support/api';
import { signIn } from '../support/session';

const CLASS_IDS = [1, 2, 3, 4].map(index => `00000000-0000-4000-8000-00000000100${index}`);
const students = [1, 2, 3, 4, 5].map(index => ({
  uuid: `00000000-0000-4000-8000-00000000200${index}`,
  user_uuid: `00000000-0000-4000-8000-00000000300${index}`,
  full_name: `Student ${index}`,
}));
const sessions = CLASS_IDS.flatMap((classId, classIndex) =>
  [0, 1, 2, 3].map(index => ({
    uuid: `${classId}-session-${index}`,
    class_definition_uuid: classId,
    instructor_uuid: INSTRUCTOR_PROFILE,
    title: `Class ${classIndex + 1}`,
    timezone: 'Africa/Lagos',
    status: 'COMPLETED',
    start_time: `2026-10-${20 + index}T08:00:00Z`,
    end_time: `2026-10-${20 + index}T09:00:00Z`,
  }))
);
const records = sessions.flatMap((session, index) =>
  students.flatMap((student, studentIndex) => {
    if (studentIndex === 4 && index % 4 === 3) return [];
    return [
      {
        uuid: `${student.uuid}-${session.uuid}`,
        student_uuid: student.uuid,
        scheduled_instance_uuid: session.uuid,
        status: ['ATTENDED', 'ABSENT', 'ENROLLED', 'ATTENDED'][index % 4],
        updated_date: '2026-10-23T10:00:00Z',
      },
    ];
  })
);
const attendancePath = /^\/api\/v1\/enrollment\/search$/;
const schedulesPath = /^\/api\/v1\/classes\/schedules$/;
const url = '/dashboard/instructor/training-hub?tab=attendance';

function mockAttendance() {
  return mockInstructorWorkbook(new MockApi())
    .get(
      new RegExp(`^/api/v1/classes/instructor/${INSTRUCTOR_PROFILE}$`),
      CLASS_IDS.map((uuid, index) => ({
        class_definition: { uuid, title: `Class ${index + 1}` },
        course_title: 'Music course',
      }))
    )
    .get(schedulesPath, [...sessions].reverse())
    .get(attendancePath, request => {
      const params = new URL(request.url()).searchParams;
      const ids = params.get('class_definition_uuid_in')?.split(',') ?? [];
      const scoped = records.filter(record =>
        ids.some(id => record.scheduled_instance_uuid.startsWith(id))
      );
      const page = Number(params.get('page') ?? 0);
      return {
        content: scoped.slice(page * 50, (page + 1) * 50),
        metadata: {
          pageNumber: page,
          pageSize: 50,
          totalPages: Math.ceil(scoped.length / 50),
          totalElements: scoped.length,
        },
      };
    })
    .get(/^\/api\/v1\/students\/search$/, paged(students))
    .get(
      /^\/api\/v1\/users\/directory$/,
      students.map(student => ({ uuid: student.user_uuid, full_name: student.full_name }))
    );
}

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, INSTRUCTOR, baseURL as string);
});

test('four classes show complete totals and expand into student attendance matrices using batched requests', async ({
  page,
}, testInfo) => {
  const api = mockAttendance();
  await api.install(page);
  await page.goto(url);
  for (let index = 1; index <= 4; index++) {
    const card = page.getByLabel(`Class ${index} attendance`, { exact: true });
    await expect(card.getByText('5 students · 4 class instances')).toBeVisible();
    const totals = card.getByLabel(`Class ${index} attendance totals`);
    await expect(
      totals.locator('div').filter({ has: page.getByText('Attended', { exact: true }) })
    ).toHaveText('Attended9');
    await expect(
      totals.locator('div').filter({ has: page.getByText('Absent', { exact: true }) })
    ).toHaveText('Absent5');
    await expect(
      totals.locator('div').filter({ has: page.getByText('Not marked', { exact: true }) })
    ).toHaveText('Not marked5');
  }
  expect(api.callsTo('GET', schedulesPath)).toHaveLength(1);
  expect(api.callsTo('GET', attendancePath)).toHaveLength(2);
  expect(api.callsTo('GET', /^\/api\/v1\/students\/search$/)).toHaveLength(0);
  await page.getByRole('button', { name: 'View attendance for Class 1', exact: true }).click();
  const table = page.getByRole('table', { name: 'Class 1 student attendance', exact: true });
  await expect(table.getByRole('row')).toHaveCount(6);
  const first = table.getByRole('row', { name: /^Student 1 / });
  await expect(first.getByRole('cell')).toHaveText(['Present', 'Absent', 'Not marked', 'Present']);
  const last = table.getByRole('row', { name: /^Student 5 / });
  await expect(last.getByLabel('Not enrolled')).toBeVisible();
  await expect(table.getByRole('columnheader')).toHaveCount(5);
  await page.getByRole('button', { name: 'View attendance for Class 2', exact: true }).click();
  await expect(
    page.getByRole('table', { name: 'Class 2 student attendance', exact: true })
  ).toBeVisible();
  await expect(table).toBeVisible();
  expect(api.callsTo('GET', schedulesPath)).toHaveLength(1);
  expect(api.callsTo('GET', attendancePath)).toHaveLength(2);
  expect(api.callsTo('GET', /^\/api\/v1\/classes\/[^/]+\/(schedule|enrollments)$/)).toHaveLength(0);
  await page.screenshot({ path: testInfo.outputPath('attendance-desktop.png'), fullPage: true });
});

test('attendance failures show a retry state instead of false zero totals', async ({ page }) => {
  const api = mockAttendance();
  let fail = true;
  api.get(attendancePath, () =>
    fail ? { success: false, error: 'Attendance unavailable' } : paged(records)
  );
  await api.install(page);
  await page.goto(url);
  await expect(page.getByText('Unable to load class attendance')).toBeVisible();
  await expect(page.getByLabel('Class 1 attendance totals')).toHaveCount(0);
  fail = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByLabel('Class 1 attendance totals')).toBeVisible();
});

test('search filters classes and a mobile attendance table scrolls without widening the page', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const api = mockAttendance();
  await api.install(page);
  await page.goto(url);
  await page.getByRole('searchbox', { name: 'Search classes for attendance' }).fill('Class 4');
  await expect(page.getByLabel('Class 4 attendance', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Class 1 attendance', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'View attendance for Class 4', exact: true }).click();
  const table = page.getByRole('table', { name: 'Class 4 student attendance', exact: true });
  await expect(table.getByRole('rowheader', { name: 'Student 1', exact: true })).toBeVisible();
  expect(
    await table.evaluate(element => {
      const container = element.parentElement;
      return Boolean(container && container.scrollWidth > container.clientWidth);
    })
  ).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.screenshot({
    path: testInfo.outputPath('attendance-mobile-dark.png'),
    fullPage: true,
  });
});
