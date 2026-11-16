import { expect, type Page, test } from '@playwright/test';
import { ADMIN, COURSE, mockOrganisationSession, ORG, TRAINERS } from '../fixtures/organisation';
import { MockApi, paged } from '../support/api';
import { signIn } from '../support/session';

// Music → Piano → "Piano Foundations", taught at the Kasarani branch in Studio A.
const MUSIC = '00000000-0000-4000-8000-0000000001c1';
const PIANO = '00000000-0000-4000-8000-0000000001c2';
const BRANCH = '00000000-0000-4000-8000-0000000001b1';
const STUDIO = '00000000-0000-4000-8000-0000000001d1';
const KEYBOARDS = '00000000-0000-4000-8000-0000000001d2';
const JOB = '00000000-0000-4000-8000-0000000001e1';

const ORG_RATES = {
  currency: 'KES',
  private_inperson_hourly_rate: 1500,
  group_inperson_hourly_rate: 1200,
  private_online_hourly_rate: 3000,
  group_online_hourly_rate: 5000,
};
const TRAINER_RATES = { ...ORG_RATES, private_inperson_hourly_rate: 1000, group_inperson_hourly_rate: 800 };

const inWeeks = (weeks: number) => {
  const date = new Date(Date.now() + weeks * 7 * 86_400_000);
  return date.toISOString().slice(0, 10);
};

function mockBuilder(api: MockApi) {
  return mockOrganisationSession(api)
    .get(/^\/api\/v1\/config\/categories$/, paged([
      { uuid: MUSIC, name: 'Music', parent_uuid: null },
      { uuid: PIANO, name: 'Piano', parent_uuid: MUSIC },
    ]))
    .get(/^\/api\/v1\/courses\/search$/, paged([
      { uuid: COURSE, name: 'Piano Foundations', category_names: ['Piano'], class_limit: 12 },
    ]))
    .get(/^\/api\/v1\/programs\/training-applications\/search$/, paged([]))
    .get(/^\/api\/v1\/courses\/training-applications\/search$/, (request: { url: () => string }) => {
      const search = new URL(request.url()).search;
      return search.includes('instructor')
        ? paged([{ uuid: 'ta-t', applicant_uuid: TRAINERS.antony.uuid, course_uuid: COURSE, rate_card: TRAINER_RATES }])
        : paged([{ uuid: 'ta-o', applicant_uuid: ORG, course_uuid: COURSE, rate_card: ORG_RATES }]);
    })
    .get(new RegExp(`^/api/v1/instructors/organisations/${ORG}/summaries$`), [
      { instructor_uuid: TRAINERS.antony.uuid, full_name: TRAINERS.antony.full_name, email: 'antony@e2e.test' },
    ])
    .get(/^\/api\/v1\/instructors\/[^/]+\/availability\/check$/, true)
    .get(new RegExp(`^/api/v1/organisations/${ORG}/training-branches$`), paged([
      { uuid: BRANCH, branch_name: 'Kasarani', organisation_uuid: ORG, address: 'Kasarani, Nairobi', latitude: -1.22, longitude: 36.89, active: true },
    ]))
    .get(new RegExp(`^/api/v1/organisations/${ORG}/resources$`), (request: { url: () => string }) =>
      new URL(request.url()).search.includes('VENUE')
        ? paged([{ uuid: STUDIO, name: 'Studio A', resource_type: 'VENUE', branch_uuid: BRANCH, seat_capacity: 20, active: true }])
        : paged([{ uuid: KEYBOARDS, name: 'Keyboards', resource_type: 'EQUIPMENT_POOL', branch_uuid: BRANCH, total_quantity: 10, active: true }])
    )
    .get(new RegExp(`^/api/v1/organisations/${ORG}/student-groups$`), paged([]))
    .get(/^\/api\/v1\/classes\/jobs$/, paged([]));
}

async function pickCourse(page: Page) {
  await page.getByLabel('Select Category *').click();
  await page.getByRole('option', { name: 'Music' }).click();
  // The only subject and its only course are picked for you.
  await expect(page.getByLabel('Select Subject *')).toContainText('Piano');
  await expect(page.getByLabel(/Select Course/)).toContainText('Piano Foundations');
  await expect(page.getByText('Music — Piano', { exact: true })).toBeVisible();
}

async function fillPlaceAndRegistration(page: Page) {
  await page.getByLabel(/^Branch/).click();
  await page.getByRole('option', { name: /Kasarani/ }).click();
  await page.getByRole('radio', { name: /Studio A/ }).click();
  await page.getByLabel('Registration opens *').fill(inWeeks(0));
  await page.getByLabel('Registration closes *').fill(inWeeks(1));
}

test('an organisation creates a class directly for its own instructor', async ({ page, context, baseURL }) => {
  await signIn(context, ADMIN, baseURL as string);
  const api = mockBuilder(new MockApi()).on('POST', /^\/api\/v1\/classes$/, {
    class_definition: { uuid: 'new-class', title: 'Music — Piano' },
  });
  await api.install(page);
  await page.goto('/dashboard/organisation/classes?modal=create-class');

  const dialog = page.getByRole('dialog', { name: 'Organisation — Create a class' });
  await expect(dialog).toBeVisible();
  await pickCourse(page);

  await page.getByLabel('Instructor *').click();
  await page.getByRole('option', { name: /Antony Trainer/ }).click();
  await page.getByRole('radio', { name: /Group session/ }).click();
  await expect(page.getByRole('radio', { name: /Group session/ })).toContainText('1,200');
  await fillPlaceAndRegistration(page);

  await expect(dialog.getByText('Seats: 12 seats, set by the course')).toBeVisible();
  const publish = page.getByRole('button', { name: 'Publish Class' });
  await expect(publish).toBeEnabled();
  await publish.click();

  const posts = api.callsTo('POST', /^\/api\/v1\/classes$/);
  await expect.poll(() => posts.length).toBe(1);
  const body = posts[0]?.body as Record<string, unknown>;
  expect(body).toMatchObject({
    default_instructor_uuid: TRAINERS.antony.uuid,
    organisation_uuid: ORG,
    branch_uuid: BRANCH,
    course_uuid: COURSE,
    title: 'Music — Piano',
    session_format: 'GROUP',
    sale_price: 1200,
    instructor_pay: 800,
    rate_basis: 'per_hour',
    max_participants: 12,
    resources: [{ resource_uuid: STUDIO, quantity: 1 }],
  });
  expect(api.callsTo('POST', /^\/api\/v1\/classes\/jobs/)).toHaveLength(0);
  await expect(page).toHaveURL(/classes\?highlight=new-class/);
});

test('publishing is blocked until an instructor is picked', async ({ page, context, baseURL }) => {
  await signIn(context, ADMIN, baseURL as string);
  await mockBuilder(new MockApi()).install(page);
  await page.goto('/dashboard/organisation/classes?modal=create-class');

  await pickCourse(page);
  await page.getByRole('radio', { name: /1-on-1 session/ }).click();
  await fillPlaceAndRegistration(page);

  await expect(page.getByRole('alert').filter({ hasText: 'Resolve before publishing' })).toContainText(
    'Instructor is required'
  );
  await expect(page.getByRole('button', { name: 'Publish Class' })).toBeDisabled();
});

test('a calendar slot opens Create class on that day and time', async ({ page, context, baseURL }) => {
  await signIn(context, ADMIN, baseURL as string);
  await mockBuilder(new MockApi()).install(page);
  const day = inWeeks(2);
  await page.goto(`/dashboard/organisation/classes/new?date=${day}&startTime=14:00&endTime=15:30`);

  await expect(page).toHaveURL(/classes\?modal=create-class/);
  await expect(page.getByRole('dialog', { name: 'Organisation — Create a class' })).toBeVisible();
  // The slot lands as a picked date with its own times.
  const times = page.getByRole('dialog').locator('input[type=time]');
  await expect(times.first()).toHaveValue('14:00');
  await expect(times.nth(1)).toHaveValue('15:30');
});

test('posting a job sends the class plan with the hiring details', async ({ page, context, baseURL }) => {
  await signIn(context, ADMIN, baseURL as string);
  const api = mockBuilder(new MockApi()).on('POST', /^\/api\/v1\/classes\/jobs$/, { uuid: JOB, title: 'Music — Piano' });
  await api.install(page);
  await page.goto('/dashboard/organisation/jobs/new?courseUuid=' + COURSE);

  await expect(page).toHaveURL(/jobs\?modal=post-job/);
  await expect(page.getByRole('dialog', { name: 'Post a job' })).toBeVisible();
  await expect(page.getByLabel(/Select Course/)).toContainText('Piano Foundations');
  await expect(page.getByLabel('Instructor *')).toHaveCount(0);

  await page.getByRole('radio', { name: /Group session/ }).click();
  await page.getByLabel(/Compensation/).fill('900');
  await fillPlaceAndRegistration(page);
  await page.getByLabel('Requirements').fill('ABRSM Grade 8');
  await page.getByRole('radio', { name: /Our organisation’s instructors only/ }).click();

  await page.getByRole('button', { name: 'Post job' }).click();
  const posts = api.callsTo('POST', /^\/api\/v1\/classes\/jobs$/);
  await expect.poll(() => posts.length).toBe(1);
  expect(posts[0]?.body).toMatchObject({
    organisation_uuid: ORG,
    branch_uuid: BRANCH,
    course_uuid: COURSE,
    sale_price: 1200,
    instructor_pay: 900,
    requirements: 'ABRSM Grade 8',
    membership_preference: 'ORGANISATION_ONLY',
    resources: [{ resource_uuid: STUDIO, quantity: 1 }],
  });
  await expect(page.getByRole('heading', { name: 'Job posted successfully' })).toBeVisible();
});
