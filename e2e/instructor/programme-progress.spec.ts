import { expect, type Page, test } from '@playwright/test';
import {
  mockProgrammeReport,
  OTHER_PROGRAM_UUID,
  PROGRAM_UUID,
  programmeReport,
} from '../fixtures/programme';
import {
  CLASS_ID,
  COURSE_ID,
  INSTRUCTOR,
  INSTRUCTOR_PROFILE,
  mockInstructorWorkbook,
} from '../fixtures/session-report';
import { httpError, MockApi, paged } from '../support/api';
import { signIn } from '../support/session';

const LEARNER = {
  uuid: '00000000-0000-4000-8000-000000006001',
  user_uuid: '00000000-0000-4000-8000-000000007001',
  full_name: 'Amani Wekesa',
};

function mockLearner(api: MockApi) {
  return api
    .get(new RegExp(`^/api/v1/classes/instructor/${INSTRUCTOR_PROFILE}$`), [
      {
        class_definition: {
          uuid: CLASS_ID,
          title: 'Piano 2B',
          course_uuid: COURSE_ID,
          default_instructor_uuid: INSTRUCTOR_PROFILE,
          is_active: true,
        },
      },
    ])
    .get(/^\/api\/v1\/classes\/([^/]+)\/enrollments$/, [
      {
        uuid: 'seat-1',
        student_uuid: LEARNER.uuid,
        scheduled_instance_uuid: 'session-1',
        status: 'ENROLLED',
      },
    ])
    .get(/^\/api\/v1\/students\/search$/, paged([LEARNER]))
    .get(/^\/api\/v1\/config\/difficulty-levels$/, [
      { uuid: 'beginner', name: 'Beginner', level_order: 1 },
    ])
    .get(
      /^\/api\/v1\/courses\/search$/,
      paged([
        {
          uuid: COURSE_ID,
          name: 'Introduction to Piano',
          difficulty_uuid: 'beginner',
          status: 'PUBLISHED',
        },
      ])
    )
    .get(/^\/api\/v1\/classes\/[^/]+\/schedule$/, paged([]))
    .get(new RegExp(`^/api/v1/users/${LEARNER.user_uuid}$`), {
      uuid: LEARNER.user_uuid,
      full_name: LEARNER.full_name,
    })
    .get(/^\/api\/v1\/enrollment\/student\/([^/]+)\/overview$/, {
      student_uuid: LEARNER.uuid,
      course_enrollments: paged([]),
      class_enrollments: paged([]),
    });
}

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, INSTRUCTOR, baseURL as string);
});

async function openStudentProgram(page: Page, canAddRemarks: boolean) {
  const api = mockLearner(mockInstructorWorkbook(new MockApi()));
  mockProgrammeReport(
    api,
    programmeReport({ student_uuid: LEARNER.uuid, can_add_remarks: canAddRemarks }),
    LEARNER.uuid
  );
  api.on(
    'POST',
    new RegExp(`^/api/v1/programs/${PROGRAM_UUID}/students/${LEARNER.uuid}/remarks$`),
    request => request.postDataJSON()
  );
  await api.install(page);
  await page.goto(
    `/dashboard/instructor/students/${LEARNER.user_uuid}?sId=${LEARNER.uuid}&tab=programme`
  );
  return api;
}

test('the class instructor writes program remarks in a Sheet with three editors and a review date', async ({
  page,
}) => {
  const api = await openStudentProgram(page, true);

  await page.getByRole('button', { name: 'Write remarks' }).click();
  const sheet = page.getByRole('dialog', { name: 'Amani Wekesa · Program remarks' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('note')).toContainText('Your last remark was on');
  await expect(sheet.getByRole('button', { name: 'Save remarks' })).toBeDisabled();
  const editors = sheet.locator('[contenteditable="true"]');
  await expect(editors).toHaveCount(3);
  await editors.nth(0).click();
  await page.keyboard.type('Confident tone');
  await editors.nth(2).click();
  await page.keyboard.type('Metronome daily');
  await sheet.getByLabel('Next review date').fill('2026-11-30');
  await sheet.getByRole('button', { name: 'Save remarks' }).click();

  await expect.poll(() => api.callsTo('POST', /remarks$/).length).toBe(1);
  const body = api.callsTo('POST', /remarks$/)[0]?.body as Record<string, string | undefined>;
  expect(body.strengths).toContain('Confident tone');
  expect(body.recommendations).toContain('Metronome daily');
  expect(body.improvements).toBeUndefined();
  expect(body.next_review_date).toBe('2026-11-30');
  await expect(page.getByRole('status').filter({ hasText: 'Remarks saved.' })).toBeVisible();
});

test('the student Program tab shows evidence with graders, regrades and remark authors', async ({
  page,
}) => {
  await openStudentProgram(page, false);
  await expect(page.getByRole('button', { name: 'Write remarks' })).toHaveCount(0);

  const report = page.getByTestId('programme-report');
  const evidence = report.getByTestId('evidence-table');
  // The first skill with evidence opens for instructors.
  await expect(evidence).toBeVisible();
  await expect(evidence.getByText('Grace Njeri').first()).toBeVisible();
  await expect(
    evidence.getByText('Introduction to Piano · Solo performance').first()
  ).toBeVisible();
  await expect(evidence.locator('tr[data-superseded="true"]')).toHaveCount(1);
  await expect(evidence.getByText('Replaced by the regrade on', { exact: false })).toBeVisible();
  await expect(evidence.getByText('Regrade', { exact: true })).toBeVisible();

  const remarks = report.getByRole('region', { name: 'Progress remarks' });
  await expect(remarks.getByText('Grace Njeri')).toBeVisible();
  await remarks.getByRole('button', { name: 'Show 1 earlier remark' }).click();
  await expect(remarks.getByTestId('programme-remark')).toHaveCount(2);
});

const LEARNERS = [
  {
    student_uuid: LEARNER.uuid,
    user_uuid: LEARNER.user_uuid,
    final_grade: 75.76,
    final_grade_provisional: true,
    result_status: 'IN_PROGRESS',
    mandatory_total: 5,
    mandatory_passed: 3,
    skill_levels: [
      { skill_uuid: 's1', level_name: 'Achieved', counts_as_achieved: true },
      { skill_uuid: 's2', counts_as_achieved: false },
    ],
  },
];

const SKILLS = [
  {
    skill_uuid: 's1',
    skill_name: 'Performance technique',
    achieved: 1,
    developing: 0,
    not_achieved: 0,
    no_evidence: 0,
  },
  {
    skill_uuid: 's2',
    skill_name: 'Ensemble communication',
    achieved: 0,
    developing: 0,
    not_achieved: 0,
    no_evidence: 1,
  },
];

function ready(programUuid = PROGRAM_UUID, title = 'Foundation Music Certificate') {
  return {
    status: 'READY',
    class_definition_uuid: CLASS_ID,
    program_uuid: programUuid,
    program_title: title,
    programmes: [{ program_uuid: programUuid, title }],
    skills: SKILLS,
    learners: LEARNERS,
  };
}

const PROGRESS = new RegExp(`^/api/v1/classes/${CLASS_ID}/programme-progress$`);

async function openClassProgram(page: Page, progress: Parameters<MockApi['get']>[1]) {
  const api = mockInstructorWorkbook(new MockApi());
  api.get(/^\/api\/v1\/students\/search$/, paged([LEARNER]));
  api.get(PROGRESS, progress);
  await api.install(page);
  await page.goto(`/dashboard/instructor/classes/overview/${CLASS_ID}?tab=programme`);
  return api;
}

test('the class Program tab shows stats, learners with level pills and skill attainment', async ({
  page,
}) => {
  await openClassProgram(page, ready());

  await expect(page.getByRole('tab', { name: /Skills/ })).toHaveCount(0);
  const section = page.getByTestId('class-programme');
  await expect(section.getByText('Learners in the program')).toBeVisible();
  const link = section.getByRole('link', { name: 'Amani Wekesa' });
  await expect(link).toHaveAttribute(
    'href',
    `/dashboard/instructor/students/${LEARNER.user_uuid}?sId=${LEARNER.uuid}&tab=programme`
  );
  const row = section.getByRole('row').filter({ hasText: 'Amani Wekesa' });
  await expect(row).toContainText('75.76%');
  await expect(row).toContainText('Provisional');
  await expect(row).toContainText('3 of 5');
  await expect(row).toContainText('Achieved');
  await expect(section.getByRole('link', { name: 'Class report (lesson marks)' })).toHaveAttribute(
    'href',
    `/dashboard/instructor/training-hub/classes/${CLASS_ID}/report`
  );
  await expect(
    section.getByRole('img', { name: /Performance technique: 1 achieved/ })
  ).toBeVisible();
  await expect(
    section.getByRole('img', { name: /Ensemble communication: Not assessed yet/ })
  ).toBeVisible();
  await expect(section.getByRole('group', { name: 'Program' })).toHaveCount(0);
});

test('a course in two programs asks for a pick, then loads the chosen program', async ({
  page,
}) => {
  const api = await openClassProgram(page, request =>
    new URL(request.url()).searchParams.get('program_uuid') === OTHER_PROGRAM_UUID
      ? {
          ...ready(OTHER_PROGRAM_UUID, 'Junior Keyboard Pathway'),
          programmes: [
            { program_uuid: PROGRAM_UUID, title: 'Foundation Music Certificate' },
            { program_uuid: OTHER_PROGRAM_UUID, title: 'Junior Keyboard Pathway' },
          ],
        }
      : {
          status: 'PROGRAMME_CHOICE_REQUIRED',
          class_definition_uuid: CLASS_ID,
          programmes: [
            { program_uuid: PROGRAM_UUID, title: 'Foundation Music Certificate' },
            { program_uuid: OTHER_PROGRAM_UUID, title: 'Junior Keyboard Pathway' },
          ],
        }
  );

  const picker = page.getByTestId('class-programme-picker');
  await expect(picker).toContainText('part of 2 programs');
  await picker.getByRole('button', { name: 'Junior Keyboard Pathway' }).click();

  const section = page.getByTestId('class-programme');
  await expect(
    section.getByRole('heading', { name: 'Junior Keyboard Pathway · Learners' })
  ).toBeVisible();
  await expect(
    section
      .getByRole('group', { name: 'Program' })
      .getByRole('button', { name: 'Junior Keyboard Pathway' })
  ).toHaveAttribute('aria-pressed', 'true');
  expect(api.callsTo('GET', PROGRESS).some(call => call.search.includes(OTHER_PROGRAM_UUID))).toBe(
    true
  );
});

test('a class with no program shows an empty state with the class report', async ({ page }) => {
  await openClassProgram(page, {
    status: 'NO_PROGRAMME',
    class_definition_uuid: CLASS_ID,
    programmes: [],
  });
  const empty = page.getByTestId('class-programme-empty');
  await expect(empty.getByText('No learners here are in a program')).toBeVisible();
  await expect(empty.getByRole('link', { name: 'Open class report' })).toBeVisible();
});

test('a failing load shows an error with a retry, not an empty state', async ({ page }) => {
  await openClassProgram(page, () => httpError(403, 'Access denied'));
  const error = page.getByTestId('class-programme-error');
  await expect(error.getByText("Program progress didn't load")).toBeVisible();
  await expect(error.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(page.getByTestId('class-programme-empty')).toHaveCount(0);
});

test('Skills moved onto the class Overview', async ({ page }) => {
  await openClassProgram(page, ready());
  await page.getByRole('tab', { name: /Overview/ }).click();
  await expect(page.getByRole('heading', { name: 'Skills this class teaches' })).toBeVisible();
});
