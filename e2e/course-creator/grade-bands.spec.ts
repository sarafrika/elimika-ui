import { expect, test } from '@playwright/test';
import { COURSE_UUID, CREATOR_USER, mockShell } from '../fixtures/grades';
import { MockApi } from '../support/api';
import { signIn } from '../support/session';

const CREATOR_UUID = '66666666-6666-4666-8666-666666666666';

test.describe('Course creator · Grade bands', () => {
  test('loads the workbook bands, previews a score and saves the whole list', async ({ page, context, baseURL }) => {
    await signIn(context, CREATOR_USER, baseURL as string);
    const api = new MockApi();
    mockShell(api, CREATOR_USER, {
      path: /^\/api\/v1\/course-creators\/search/,
      row: { uuid: CREATOR_UUID, user_uuid: CREATOR_USER.uuid, full_name: CREATOR_USER.name, admin_verified: true },
    });
    api.get(new RegExp(`^/api/v1/courses/${COURSE_UUID}$`), {
      uuid: COURSE_UUID,
      name: 'Introduction to Piano',
      course_creator_uuid: CREATOR_UUID,
      status: 'draft',
      pass_mark: 60,
      categories: [],
      category_uuids: [],
      creator_share_percentage: 70,
      instructor_share_percentage: 30,
      is_free: false,
      price: 1000,
      minimum_training_fee: 1000,
      total_duration_display: '0 minutes',
    });
    let saved: unknown = null;
    api.get(new RegExp(`^/api/v1/courses/${COURSE_UUID}/grade-bands$`), () => saved ?? []);
    api.on('PUT', new RegExp(`^/api/v1/courses/${COURSE_UUID}/grade-bands$`), request => {
      saved = request.postDataJSON();
      return saved;
    });
    await api.install(page);
    await page.goto(`/dashboard/course-creator/course-management/create-new-course?id=${COURSE_UUID}`);
    await page.getByRole('tab', { name: 'Assessment Structure' }).click();

    const section = page.getByRole('region', { name: 'Grade bands' });
    await expect(section.getByText('No bands: learners see no grade label.')).toBeVisible();
    await section.getByRole('button', { name: "Use the school's workbook bands" }).click();
    await expect(section.getByTestId('band-row')).toHaveCount(5);

    await section.getByRole('button', { name: '27.5', exact: true }).click();
    await expect(section.getByTestId('band-preview')).toContainText('91.67% earns');
    await expect(section.getByTestId('band-preview')).toContainText('Merit');

    await section.getByRole('button', { name: 'Save bands' }).click();
    await expect.poll(() => api.callsTo('PUT', /grade-bands$/).length).toBe(1);
    const body = api.callsTo('PUT', /grade-bands$/)[0]?.body as Array<{ name: string; min_percentage: number }>;
    expect(body.map(b => [b.name, b.min_percentage])).toEqual([
      ['Distinction', 93.33],
      ['Merit', 80],
      ['Pass', 60],
      ['Fail', 40],
      ['No Effort', 0],
    ]);
  });

  test('refuses duplicate labels before saving', async ({ page, context, baseURL }) => {
    await signIn(context, CREATOR_USER, baseURL as string);
    const api = new MockApi();
    mockShell(api, CREATOR_USER, {
      path: /^\/api\/v1\/course-creators\/search/,
      row: { uuid: CREATOR_UUID, user_uuid: CREATOR_USER.uuid, admin_verified: true },
    });
    api.get(new RegExp(`^/api/v1/courses/${COURSE_UUID}$`), {
      uuid: COURSE_UUID,
      name: 'Introduction to Piano',
      course_creator_uuid: CREATOR_UUID,
      // The builder loops without shares, so a realistic course carries them.
      creator_share_percentage: 70,
      instructor_share_percentage: 30,
    });
    api.get(new RegExp(`^/api/v1/courses/${COURSE_UUID}/grade-bands$`), [
      { name: 'Merit', min_percentage: 80 },
      { name: 'Pass', min_percentage: 60 },
    ]);
    await api.install(page);
    await page.goto(`/dashboard/course-creator/course-management/create-new-course?id=${COURSE_UUID}`);
    await page.getByRole('tab', { name: 'Assessment Structure' }).click();
    const section = page.getByRole('region', { name: 'Grade bands' });
    await section.getByRole('textbox', { name: 'Band label' }).nth(1).fill('Merit');
    await expect(section.getByRole('alert')).toContainText('Two bands are called Merit');
    await expect(section.getByRole('button', { name: 'Save bands' })).toBeDisabled();
  });
});
