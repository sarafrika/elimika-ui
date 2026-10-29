import { expect, type Page, test } from '@playwright/test';
import { CREATOR_USER, mockShell } from '../fixtures/grades';
import { MockApi, paged } from '../support/api';
import { type E2eUser, signIn } from '../support/session';

const CREATOR_UUID = '66666666-6666-4666-8666-666666666666';
const PROGRAM_UUID = '77777777-7777-4777-8777-777777777777';
const SKILL_UUID = '88888888-8888-4888-8888-888888888888';
const RUBRIC_UUID = '99999999-9999-4999-8999-999999999999';
const OTHER_SKILL_UUID = '88888888-8888-4888-8888-888888888889';

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
    `/dashboard/course-creator/course-management/create-program?id=${PROGRAM_UUID}&step=${step}`
  );
}

test.describe('Course creator · Program editor steps', () => {
  test('the editor has six steps and no Evaluation step', async ({ page, context, baseURL }) => {
    await signIn(context, CREATOR_USER, baseURL as string);
    const api = new MockApi();
    mockProgramme(api);
    await api.install(page);
    await openStep(page, 2);

    const steps = page.getByRole('navigation', { name: 'Program editor steps' });
    await expect(steps.getByRole('listitem')).toHaveCount(6);
    await expect(steps).not.toContainText('Evaluation');
    await expect(steps.getByRole('button', { name: /Pass rule & weights/ })).toHaveAttribute(
      'aria-current',
      'step'
    );
    await expect(
      page.getByRole('heading', { level: 1, name: 'Pass rule & weights' })
    ).toBeVisible();
  });
});

test.describe('Course creator · Program pass rule and weights', () => {
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
    await expect(section.getByText("Doesn't count")).toBeVisible();
    await expect(
      section.getByRole('link', {
        name: "Components total 90%. Open the course's grading to fix it",
      })
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
    await expect(section.getByText('Ready. Mandatory weights total exactly 100%.')).toBeVisible();
    await page.getByRole('button', { name: 'Save and continue' }).click();
    await expect.poll(() => api.callsTo('PUT', /course-weights$/).length).toBe(1);
    expect(api.callsTo('PUT', /course-weights$/)[0]?.body).toEqual([
      { program_course_uuid: 'pc-0', is_required: true, weight_percentage: 50 },
      { program_course_uuid: 'pc-1', is_required: true, weight_percentage: 50 },
      { program_course_uuid: 'pc-2', is_required: false },
    ]);
  });

  test('try a learner runs sample finals through the weights and pass rule', async ({
    page,
    context,
    baseURL,
  }) => {
    await signIn(context, CREATOR_USER, baseURL as string);
    const api = new MockApi();
    mockProgramme(api);
    await api.install(page);
    await openStep(page, 2);

    const section = page.getByRole('region', { name: 'Pass rule and course weights' });
    await section.getByRole('button', { name: 'Split evenly' }).click();
    const card = section.getByRole('complementary', { name: 'Try a learner' });
    const result = card.getByTestId('try-learner');
    await expect(result).toContainText('Program mark · provisional');
    await expect(result).toContainText('87.94%');
    await expect(result).toContainText('Guitar Fundamentals has no result yet');

    await card.getByRole('button', { name: 'All passed' }).click();
    await expect(result).toContainText('82.22%');
    await expect(result).toContainText('Passed');

    await card.getByRole('button', { name: 'One course failed' }).click();
    await expect(result).toContainText('60.75%');
    await expect(result).toContainText('Failed');
    await expect(result).toContainText('Introduction to Piano finished at 45.00%');
  });

  test('making a course optional clears its weight', async ({ page, context, baseURL }) => {
    await signIn(context, CREATOR_USER, baseURL as string);
    const api = new MockApi();
    mockProgramme(api);
    await api.install(page);
    await openStep(page, 2);

    const section = page.getByRole('region', { name: 'Pass rule and course weights' });
    await section.getByRole('textbox', { name: 'Weight for Guitar Fundamentals' }).fill('30');
    await section
      .getByRole('combobox', { name: 'Counts towards the mark for Guitar Fundamentals' })
      .click();
    await page.getByRole('option', { name: 'Optional' }).click();
    await expect(
      section.getByRole('textbox', { name: 'Weight for Guitar Fundamentals' })
    ).toHaveCount(0);
    await expect(section.getByText("Doesn't count")).toHaveCount(2);
  });
});

test.describe('Course creator · Program skills', () => {
  test('shows skills by course, flags an unlinked skill and links two criteria whose shares total 100%', async ({
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
      {
        skill_uuid: OTHER_SKILL_UUID,
        skill_name: 'Tonal control',
        display_order: 2,
        ready: true,
        mappings: [
          {
            course_assessment_uuid: 'a-recital',
            course_uuid: courses[0]!.uuid,
            course_assessment_title: 'Recital',
            rubric_criteria_uuid: 'cr-tone',
            rubric_criteria_name: 'Tonal Quality',
            share_percentage: 100,
          },
        ],
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

    const section = page.getByRole('region', { name: 'Program skills' });
    await expect(section.getByRole('alert')).toContainText(
      'Performance technique has no links yet.'
    );
    const rows = section.getByTestId('skill-row');
    await expect(rows).toHaveCount(2);
    await expect(rows.filter({ hasText: 'Performance technique' })).toContainText('Needs links');
    const linked = rows.filter({ hasText: 'Tonal control' });
    await expect(linked).toContainText('Ready');
    await expect(linked).toContainText('Recital');
    await expect(linked).toContainText('Tonal Quality 100');
    await expect(section.getByRole('columnheader', { name: /MUS110/ })).toContainText('optional');

    await section.getByRole('button', { name: 'Link evidence for Performance technique' }).click();
    const sheet = page.getByRole('dialog', { name: 'Performance technique · Link evidence' });
    await sheet.getByLabel('Program course').click();
    await page.getByRole('option', { name: 'Introduction to Piano · MUS101' }).click();
    await sheet.getByLabel('Assessment').click();
    await page.getByRole('option', { name: 'Lesson scores · rubric' }).click();
    await expect(
      sheet.getByText('Already gives evidence for Tonal control in another assessment')
    ).toBeVisible();
    await expect(sheet.getByText('Not linked to another skill')).toBeVisible();
    await sheet.getByRole('checkbox', { name: 'Technique' }).click();
    await sheet.getByRole('textbox', { name: 'Share for Technique' }).fill('60');
    await sheet.getByRole('checkbox', { name: 'Tonal Quality' }).click();
    await sheet.getByRole('textbox', { name: 'Share for Tonal Quality' }).fill('30');
    await expect(sheet.getByTestId('shares-total')).toHaveText('90%');
    await expect(sheet.getByRole('button', { name: 'Save link' })).toBeDisabled();
    await sheet.getByRole('textbox', { name: 'Share for Tonal Quality' }).fill('40');
    await expect(sheet.getByTestId('shares-total')).toHaveText('100%');
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

test.describe('Course creator and admin · Program Assessment tab', () => {
  const linkedSkills = [
    {
      skill_uuid: SKILL_UUID,
      skill_name: 'Performance technique',
      ready: true,
      mappings: [
        {
          course_assessment_uuid: 'a-lessons',
          course_uuid: courses[0]!.uuid,
          course_assessment_title: 'Lesson scores',
          rubric_criteria_uuid: 'cr-technique',
          rubric_criteria_name: 'Technique',
          share_percentage: 100,
        },
      ],
    },
    {
      skill_uuid: OTHER_SKILL_UUID,
      skill_name: 'Ensemble communication',
      ready: false,
      mappings: [],
    },
  ];

  function mockRecord(api: MockApi) {
    mockProgramme(api, linkedSkills);
    api.get(
      /^\/api\/v1\/programs\/courses\/search/,
      paged(
        courses.map((course, index) => ({
          uuid: `pc-${index}`,
          program_uuid: PROGRAM_UUID,
          course_uuid: course.uuid,
          sequence_order: index + 1,
          is_required: course.required,
          weight_percentage: course.required ? 50 : undefined,
        }))
      )
    );
    api.get(
      new RegExp(`^/api/v1/programs/${PROGRAM_UUID}/courses$`),
      courses.map(course => ({
        uuid: course.uuid,
        name: course.name,
        course_code: course.code,
        pass_mark: 50,
      }))
    );
    api.get(/^\/api\/v1\/skill-levels$/, [
      { uuid: 'l1', name: 'Not achieved', min_percentage: 0, counts_as_achieved: false },
      { uuid: 'l2', name: 'Developing', min_percentage: 50, counts_as_achieved: false },
      { uuid: 'l3', name: 'Achieved', min_percentage: 70, counts_as_achieved: true },
    ]);
  }

  test('the creator sees the plan, what blocks publishing and where to fix it', async ({
    page,
    context,
    baseURL,
  }) => {
    await signIn(context, CREATOR_USER, baseURL as string);
    const api = new MockApi();
    mockRecord(api);
    await api.install(page);
    await page.goto(`/dashboard/course-creator/programs/${PROGRAM_UUID}?tab=assessment`);

    await expect(page.getByRole('tab', { name: /Assessment/ })).toContainText('2 to fix');
    const plan = page.getByTestId('assessment-plan');
    await expect(plan.getByText('No assessment has been added')).toHaveCount(0);
    const weights = plan.getByRole('region', { name: 'Pass rule and weights' });
    await expect(weights).toContainText('Pass with a program mark of at least 50%');
    await expect(weights.getByRole('row', { name: /Introduction to Piano/ })).toContainText(
      'Total 100%'
    );
    await expect(weights.getByRole('row', { name: /Guitar Fundamentals/ })).toContainText(
      'Total 90% · fix in the course'
    );
    await expect(weights.getByRole('row', { name: /Mandatory total/ })).toContainText('100%');

    const skills = plan.getByRole('region', { name: 'Skills' });
    await expect(skills).toContainText(
      'Levels use the platform scale: Not achieved from 0%, Developing from 50%, Achieved from 70%.'
    );
    await expect(skills).toContainText('Introduction to Piano · Lesson scores (Technique 100)');
    await expect(skills).toContainText('No assessment linked yet');

    const ready = plan.getByRole('region', { name: 'Ready to publish' });
    await expect(ready).toContainText('2 of 4 done');
    await expect(ready.getByTestId('check-weights')).toContainText('50 + 50');
    await expect(ready.getByTestId('check-skills')).toContainText(
      'Ensemble communication has none'
    );
    await expect(ready.getByTestId('check-components')).toContainText('a warning only');
    await expect(ready.getByRole('link', { name: 'Fix: Every skill has a link' })).toHaveAttribute(
      'href',
      `/dashboard/course-creator/course-management/create-program?id=${PROGRAM_UUID}&step=3`
    );
    await expect(plan.getByRole('link', { name: 'Edit pass rule & weights' })).toBeVisible();
  });

  test('an admin reads the same plan without edit links', async ({ page, context, baseURL }) => {
    const admin: E2eUser = {
      uuid: '00000000-0000-4000-8000-0000000000d1',
      name: 'Platform Admin',
      email: 'admin@e2e.test',
      domains: ['admin'],
    };
    await signIn(context, admin, baseURL as string);
    const api = new MockApi();
    mockRecord(api);
    mockShell(api, admin);
    await api.install(page);
    await page.goto(`/dashboard/admin/programs/${PROGRAM_UUID}?tab=assessment`);

    const plan = page.getByTestId('assessment-plan');
    await expect(plan.getByRole('region', { name: 'Ready to publish' })).toContainText(
      '2 of 4 done'
    );
    await expect(page.getByRole('tab', { name: /Assessment/ })).toContainText('2 to fix');
    await expect(plan.getByRole('link', { name: /Fix:/ })).toHaveCount(0);
    await expect(plan.getByRole('link', { name: 'Edit skills' })).toHaveCount(0);
  });
});
