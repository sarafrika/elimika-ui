import { expect, test } from '@playwright/test';
import { INSTRUCTOR, mockInstructorWorkbook } from '../fixtures/session-report';
import { MockApi, paged } from '../support/api';
import { signIn } from '../support/session';

const COURSE = '00000000-0000-4000-8000-000000009001';

test('card details and keyboard access preserve selection; Choose enables continuing', async ({
  page,
  context,
  baseURL,
}) => {
  await signIn(context, INSTRUCTOR, baseURL as string);
  const api = mockInstructorWorkbook(new MockApi())
    .get(/^\/api\/v1\/catalogue\/apply-to-train$/, {
      content: [
        {
          type: 'course',
          uuid: COURSE,
          title: 'Piano foundations',
          creator_name: 'Music Academy',
          lesson_count: 1,
          requirement_count: 0,
          matches_skills: true,
        },
      ],
      metadata: { totalPages: 1, totalElements: 1 },
    })
    .get(
      new RegExp(`^/api/v1/courses/${COURSE}/lessons$`),
      paged([
        {
          uuid: 'lesson',
          course_uuid: COURSE,
          lesson_number: 1,
          title: 'Keyboard orientation',
          active: true,
        },
      ])
    )
    .get(new RegExp(`^/api/v1/courses/${COURSE}/training-requirements$`), paged([]));
  await api.install(page);
  await page.goto('/dashboard/instructor/skills-matches?tab=apply-to-train');

  const openDetails = page.getByRole('button', {
    name: 'Open details for Piano foundations',
    exact: true,
  });
  const choose = page.getByRole('button', { name: 'Choose', exact: true });
  await expect(openDetails).toBeVisible();
  await expect(page.getByRole('button', { name: 'Details', exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Choose a course first', exact: true })
  ).toBeDisabled();

  // A click in the card's image area opens the existing details sheet.
  await openDetails.click({ position: { x: 30, y: 30 } });
  const details = page.getByRole('dialog', { name: 'Piano foundations', exact: true });
  await expect(details).toBeVisible();
  await expect(
    details.getByRole('listitem').filter({ hasText: 'Keyboard orientation' })
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(details).toHaveCount(0);
  await expect(choose).toHaveAttribute('aria-pressed', 'false');

  await openDetails.focus();
  await page.keyboard.press('Enter');
  await expect(details).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(details).toHaveCount(0);

  await choose.click();
  await expect(page.getByRole('button', { name: 'Selected', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await expect(details).toHaveCount(0);
  const next = page.getByRole('button', { name: 'Continue to age groups', exact: true });
  await expect(next).toBeEnabled();
  await next.click();
  await expect(
    page.getByRole('button', { name: 'Continue to delivery & rates', exact: true })
  ).toBeVisible();
});
