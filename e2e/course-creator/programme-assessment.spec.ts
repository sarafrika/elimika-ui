import { expect, type Page, test } from '@playwright/test';
import { CREATOR_USER, mockShell } from '../fixtures/grades';
import { MockApi, paged } from '../support/api';
import { signIn } from '../support/session';

const CREATOR_UUID = '66666666-6666-4666-8666-666666666666';
const PROGRAM_UUID = '77777777-7777-4777-8777-777777777777';
const SKILL_UUID = '88888888-8888-4888-8888-888888888888';
const RUBRIC_UUID = '99999999-9999-4999-8999-999999999999';

const courses = [
  {
    uuid: 'c1000000-0000-4000-8000-000000000001',
    name: 'Introduction to Piano',
    code: 'MUS101',
    required: true,
  },
  {
    uuid: 'c1000000-0000-4000-8000-000000000002',
    name: 'Guitar Fundamentals',
    code: 'MUS102',
    required: true,
  },
  {
    uuid: 'c1000000-0000-4000-8000-000000000003',
    name: 'Music Theory Club',
    code: 'MUS110',
    required: false,
  },
];

function mockProgramme(api: MockApi, skills: unknown[] = []) {
  mockShell(api, CREATOR_USER, {
    path: /^\/api\/v1\/course-creators\/search/,
    row: {
      uuid: CREATOR_UUID,
      user_uuid: CREATOR_USER.uuid,
      full_name: CREATOR_USER.name,
      admin_verified: true,
    },
  });
  api.get(new RegExp(`^/api/v1/programs/${PROGRAM_UUID}$`), {
    uuid: PROGRAM_UUID,
    title: 'Foundation Music Certificate',
    program_code: 'PRG-MUS-01',
    pass_mark: 50,
    course_creator_uuid: CREATOR_UUID,
    status: 'draft',
    class_limit: 20,
  });
  api.get(new RegExp(`^/api/v1/programs/${PROGRAM_UUID}/requirements`), paged([]));
  api.get(
    /^\/api\/v1\/programs\/courses\/search/,
    paged(
      courses.map((course, index) => ({
        uuid: `pc-${index}`,
        program_uuid: PROGRAM_UUID,
        course_uuid: course.uuid,
        sequence_order: index + 1,
        is_required: course.required,
      }))
    )
  );
  api.get(
    /^\/api\/v1\/courses\/search/,
    paged(
      courses.map(course => ({
        uuid: course.uuid,
        name: course.name,
        course_code: course.code,
        pass_mark: 50,
      }))
    )
  );
  api.get(/^\/api\/v1\/courses\/[^/]+\/assessments/, request =>
    request.url().includes(courses[0]!.uuid)
      ? paged([
          {
            uuid: 'a-lessons',
            course_uuid: courses[0]!.uuid,
            title: 'Lesson scores',
            assessment_type: 'performance',
            weight_percentage: 70,
            rubric_uuid: RUBRIC_UUID,
          },
          {
            uuid: 'a-exam',
            course_uuid: courses[0]!.uuid,
            title: 'Final exam',
            assessment_type: 'exam',
            weight_percentage: 30,
          },
        ])
      : request.url().includes(courses[1]!.uuid)
        ? paged([
            {
              uuid: 'a-other',
              course_uuid: courses[1]!.uuid,
              title: 'Practical',
              assessment_type: 'practical',
              weight_percentage: 90,
            },
          ])
        : paged([])
  );
  api.get(new RegExp(`^/api/v1/programs/${PROGRAM_UUID}/skills$`), () => skills);
  api.get(
    new RegExp(`^/api/v1/rubrics/${RUBRIC_UUID}/criteria`),
    paged([
      {
        uuid: 'cr-technique',
        rubric_uuid: RUBRIC_UUID,
        component_name: 'Technique',
        display_order: 1,
      },
      {
        uuid: 'cr-tone',
        rubric_uuid: RUBRIC_UUID,
        component_name: 'Tonal Quality',
        display_order: 2,
      },
    ])
  );
}

async function openStep(page: Page, step: number) {
  await page.goto(
    `/dashboard/course-creator/courses/create-program?id=${PROGRAM_UUID}&step=${step}`
  );
}

test.describe('Course creator · Programme pass rule and weights', () => {
  test('weights must total 100% before continuing, and only mandatory courses are sent with a weight', async ({
    page,
    context,
    baseURL,
  }) => {
    await signIn(context, CREATOR_USER, baseURL as string);
    const api = new MockApi();
    mockProgramme(api);
    api.on('PUT', new RegExp(`^/api/v1/programs/${PROGRAM_UUID}/course-weights$`), request =>
      request.postDataJSON()
    );
    await api.install(page);
    await openStep(page, 2);

    const section = page.getByRole('region', { name: 'Pass rule and course weights' });
    await expect(section.getByText('Introduction to Piano')).toBeVisible();
    await expect(section.getByText('Not weighted')).toBeVisible();
    await expect(
      section.getByText('Course weights total 90%. Ask the course author to fix them.')
    ).toBeVisible();

    await section.getByRole('textbox', { name: 'Weight for Introduction to Piano' }).fill('40');
    await section.getByRole('textbox', { name: 'Weight for Guitar Fundamentals' }).fill('50');
    await expect(section.getByRole('alert')).toContainText('Add 10% more.');
    await page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(page.getByText(/must total exactly 100%/).first()).toBeVisible();
    expect(api.callsTo('PUT', /course-weights$/)).toHaveLength(0);

    await section.getByRole('button', { name: 'Split evenly' }).click();
    await expect(
      section.getByRole('progressbar', { name: 'Mandatory weights total' })
    ).toHaveAttribute('aria-valuenow', '100');
    await page.getByRole('button', { name: 'Save and continue' }).click();
    await expect.poll(() => api.callsTo('PUT', /course-weights$/).length).toBe(1);
    expect(api.callsTo('PUT', /course-weights$/)[0]?.body).toEqual([
      { program_course_uuid: 'pc-0', is_required: true, weight_percentage: 50 },
      { program_course_uuid: 'pc-1', is_required: true, weight_percentage: 50 },
      { program_course_uuid: 'pc-2', is_required: false },
    ]);
  });

  test('making a course optional clears its weight', async ({ page, context, baseURL }) => {
    await signIn(context, CREATOR_USER, baseURL as string);
    const api = new MockApi();
    mockProgramme(api);
    await api.install(page);
    await openStep(page, 2);

    const section = page.getByRole('region', { name: 'Pass rule and course weights' });
    await section.getByRole('textbox', { name: 'Weight for Guitar Fundamentals' }).fill('30');
    await section.getByRole('checkbox', { name: 'Guitar Fundamentals is mandatory' }).click();
    await expect(
      section.getByRole('textbox', { name: 'Weight for Guitar Fundamentals' })
    ).toHaveCount(0);
    await expect(section.getByText('Not weighted')).toHaveCount(2);
  });
});

test.describe('Course creator · Programme skills', () => {
  test('flags an unlinked skill and links two criteria whose shares total 100%', async ({
    page,
    context,
    baseURL,
  }) => {
    await signIn(context, CREATOR_USER, baseURL as string);
    const api = new MockApi();
    mockProgramme(api, [
      {
        skill_uuid: SKILL_UUID,
        skill_name: 'Performance technique',
        display_order: 1,
        ready: false,
        mappings: [],
      },
    ]);
    api.on(
      'PUT',
      new RegExp(`^/api/v1/programs/${PROGRAM_UUID}/skills/${SKILL_UUID}/mappings$`),
      request => ({
        skill_uuid: SKILL_UUID,
        skill_name: 'Performance technique',
        ready: true,
        mappings: request.postDataJSON(),
      })
    );
    await api.install(page);
    await openStep(page, 3);

    const section = page.getByRole('region', { name: 'Programme skills' });
    await expect(section.getByText('Needs links')).toBeVisible();
    await expect(section.getByRole('alert')).toContainText('Nothing is linked to this skill yet');

    await section.getByRole('button', { name: 'Link evidence' }).click();
    const sheet = page.getByRole('dialog', { name: 'Link evidence to Performance technique' });
    await sheet.getByLabel('Programme course').click();
    await page.getByRole('option', { name: 'Introduction to Piano' }).click();
    await sheet.getByLabel('Assessment').click();
    await page.getByRole('option', { name: 'Lesson scores (rubric)' }).click();
    await sheet.getByRole('checkbox', { name: 'Technique' }).click();
    await sheet.getByRole('textbox', { name: 'Share for Technique' }).fill('60');
    await sheet.getByRole('checkbox', { name: 'Tonal Quality' }).click();
    await sheet.getByRole('textbox', { name: 'Share for Tonal Quality' }).fill('30');
    await expect(sheet.getByRole('button', { name: 'Save link' })).toBeDisabled();
    await sheet.getByRole('textbox', { name: 'Share for Tonal Quality' }).fill('40');
    await sheet.getByRole('button', { name: 'Save link' }).click();

    await expect.poll(() => api.callsTo('PUT', /mappings$/).length).toBe(1);
    expect(api.callsTo('PUT', /mappings$/)[0]?.body).toEqual([
      {
        course_assessment_uuid: 'a-lessons',
        rubric_criteria_uuid: 'cr-technique',
        share_percentage: 60,
      },
      {
        course_assessment_uuid: 'a-lessons',
        rubric_criteria_uuid: 'cr-tone',
        share_percentage: 40,
      },
    ]);
  });
});
