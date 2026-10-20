import { expect, type Page, test } from '@playwright/test';
import { COURSE_UUID, CREATOR_USER, mockShell } from '../fixtures/grades';
import { MockApi, paged } from '../support/api';
import { signIn } from '../support/session';

// Stored HTML that tries to run code two ways, around one harmless formatted word.
const PAYLOAD = '<img src=x onerror="window.__xss=1"><script>window.__xss=1</script><p><strong>Safe</strong></p>';
const CREATOR_UUID = '66666666-6666-4666-8666-666666666666';
const PROFILE_USER = '00000000-0000-4000-8000-0000000000e9';

async function expectInert(page: Page, region: ReturnType<Page['locator']>) {
  await expect(region.locator('strong', { hasText: 'Safe' })).toBeVisible();
  await expect(region.locator('script')).toHaveCount(0);
  await expect(region.locator('img[onerror]')).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
}

test.describe('Rich text is sanitised wherever stored HTML is shown', () => {
  test('a course description in the course preview', async ({ page, context, baseURL }) => {
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
      description: PAYLOAD,
      objectives: PAYLOAD,
      // The builder loops without shares, so a realistic course carries them.
      creator_share_percentage: 70,
      instructor_share_percentage: 30,
    });
    await api.install(page);
    await page.goto(`/dashboard/course-creator/course-management/create-new-course?id=${COURSE_UUID}`);
    await page.getByRole('button', { name: 'Preview', exact: true }).click();

    const description = page.getByRole('heading', { name: 'Course Description' }).locator('..');
    await expectInert(page, description);
  });

  test("an instructor's bio on their public profile", async ({ page, context, baseURL }) => {
    await signIn(context, CREATOR_USER, baseURL as string);
    const api = new MockApi();
    mockShell(api, CREATOR_USER);
    api
      .get(new RegExp(`^/api/v1/users/${PROFILE_USER}$`), {
        uuid: PROFILE_USER,
        first_name: 'Faith',
        last_name: 'Mwangi',
        full_name: 'Faith Mwangi',
        user_domain: ['instructor'],
      })
      .get(/^\/api\/v1\/instructors\/search$/, paged([
        { uuid: '00000000-0000-4000-8000-0000000000ea', user_uuid: PROFILE_USER, full_name: 'Faith Mwangi', bio: PAYLOAD },
      ]));
    await api.install(page);
    await page.goto(`/profile-user/${PROFILE_USER}?domain=instructor`);

    const about = page.getByText('About Me').locator('xpath=ancestor::*[contains(@class,"rounded")][1]');
    await expectInert(page, about);
  });
});
