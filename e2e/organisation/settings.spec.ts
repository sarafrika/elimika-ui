import { expect, type Request, test } from '@playwright/test';
import { ADMIN, mockOrganisationSession, ORG } from '../fixtures/organisation';
import { MockApi } from '../support/api';
import { signIn } from '../support/session';

test('the school sets how long submitted session reports stay editable', async ({ page, context, baseURL }) => {
  await signIn(context, ADMIN, baseURL as string);
  const api = mockOrganisationSession(new MockApi())
    .get(new RegExp(`^/api/v1/organisations/${ORG}/settings$`), { organisation_uuid: ORG, session_report_grace_hours: 48 })
    .on('PUT', new RegExp(`^/api/v1/organisations/${ORG}/settings$`), (request: Request) => ({
      organisation_uuid: ORG,
      session_report_grace_hours: (request.postDataJSON() as { session_report_grace_hours: number }).session_report_grace_hours,
    }));
  await api.install(page);
  await page.goto('/dashboard/organisation/settings?tab=session-reports');

  const input = page.getByLabel('Trainers can edit a submitted report for');
  await expect(input).toHaveValue('48');
  await page.getByRole('button', { name: '3 days' }).click();
  await expect(input).toHaveValue('72');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'stay editable for 72 hours' })).toBeVisible();
  const puts = api.callsTo('PUT', new RegExp(`/organisations/${ORG}/settings$`));
  expect(puts).toHaveLength(1);
  expect(puts[0]?.body).toEqual({ session_report_grace_hours: 72 });

  await input.fill('900');
  await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
});
