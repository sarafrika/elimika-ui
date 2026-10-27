import { expect, test } from '@playwright/test';
import { mockProgrammeReport, programmeReport, PROGRAM_UUID } from '../fixtures/programme';
import {
  CLASS_ID,
  COURSE_ID,
  INSTRUCTOR,
  INSTRUCTOR_PROFILE,
  mockInstructorWorkbook,
} from '../fixtures/session-report';
import { MockApi, paged } from '../support/api';
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

test('the class instructor writes a programme remark with rich text and a review date', async ({
  page,
}) => {
  const api = mockLearner(mockInstructorWorkbook(new MockApi()));
  mockProgrammeReport(
    api,
    programmeReport({ student_uuid: LEARNER.uuid, can_add_remarks: true }),
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

  const remarks = page.getByRole('region', { name: 'Progress remarks' });
  await expect(remarks.getByTestId('programme-remark')).toHaveCount(1);
  await expect(remarks.getByRole('button', { name: 'Save remarks' })).toBeDisabled();
  const editors = remarks.locator('[contenteditable="true"]');
  await editors.nth(0).click();
  await page.keyboard.type('Confident tone');
  await editors.nth(2).click();
  await page.keyboard.type('Metronome daily');
  await remarks.getByLabel('Next review date').fill('2026-11-30');
  await remarks.getByRole('button', { name: 'Save remarks' }).click();

  await expect.poll(() => api.callsTo('POST', /remarks$/).length).toBe(1);
  const body = api.callsTo('POST', /remarks$/)[0]?.body as Record<string, string | undefined>;
  expect(body.strengths).toContain('Confident tone');
  expect(body.recommendations).toContain('Metronome daily');
  expect(body.improvements).toBeUndefined();
  expect(body.next_review_date).toBe('2026-11-30');
});

test('the class Programme tab lists learners and switches to skill attainment', async ({
  page,
}) => {
  const api = mockInstructorWorkbook(new MockApi());
  api.get(/^\/api\/v1\/students\/search$/, paged([LEARNER]));
  api.get(new RegExp(`^/api/v1/classes/${CLASS_ID}/programme-progress$`), {
    class_definition_uuid: CLASS_ID,
    program_uuid: PROGRAM_UUID,
    program_title: 'Foundation Music Certificate',
    skills: [
      {
        skill_uuid: 's1',
        skill_name: 'Performance technique',
        achieved: 1,
        developing: 0,
        not_achieved: 0,
        no_evidence: 0,
      },
    ],
    learners: [
      {
        student_uuid: LEARNER.uuid,
        final_grade: 75.76,
        final_grade_provisional: true,
        result_status: 'IN_PROGRESS',
        mandatory_total: 5,
        mandatory_passed: 3,
        skill_levels: [{ skill_uuid: 's1', level_name: 'Achieved', counts_as_achieved: true }],
      },
    ],
  });
  await api.install(page);
  await page.goto(`/dashboard/instructor/classes/overview/${CLASS_ID}?tab=programme`);

  const section = page.getByTestId('class-programme');
  await expect(section.getByRole('link', { name: 'Amani Wekesa' })).toBeVisible();
  await expect(section.getByText('75.76% prov.')).toBeVisible();
  await expect(section.getByText('3 of 5')).toBeVisible();
  await section.getByRole('button', { name: 'Skill attainment' }).click();
  await expect(
    section.getByRole('img', { name: /Performance technique: 1 achieved/ })
  ).toBeVisible();
});
