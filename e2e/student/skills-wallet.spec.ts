import { expect, test } from '@playwright/test';
import { mockShell, STUDENT_USER, STUDENT_UUID } from '../fixtures/grades';
import { mockProgrammeReport, PROGRAM_UUID } from '../fixtures/programme';
import { MockApi, paged } from '../support/api';
import { signIn } from '../support/session';

test.describe('Student · Skills Wallet › My Skills', () => {
  test('lists program-verified skills apart from self-added ones, with evidence in a Sheet', async ({
    page,
    context,
    baseURL,
  }) => {
    await signIn(context, STUDENT_USER, baseURL as string);
    const api = new MockApi();
    mockShell(api, STUDENT_USER);
    api.get(
      /^\/api\/v1\/students\/search/,
      paged([{ uuid: STUDENT_UUID, user_uuid: STUDENT_USER.uuid, full_name: 'Amani Wekesa' }])
    );
    api.get(/^\/api\/v1\/me\/profile\/skills$/, [
      {
        uuid: 'us1',
        skill_name: 'Performance technique',
        skill_uuid: 's1',
        verification_status: 'VERIFIED',
        verified_at: '2026-10-14T09:00:00Z',
        source_program_uuid: PROGRAM_UUID,
        source_program_title: 'Foundation Music Certificate',
      },
      {
        uuid: 'us2',
        skill_name: 'Sight reading',
        verification_status: 'PENDING',
        created_date: '2026-02-03T09:00:00Z',
      },
    ]);
    mockProgrammeReport(api);
    await api.install(page);
    await page.goto('/dashboard/student/skills-wallet?tab=skills');

    const wallet = page.getByTestId('wallet-skills');
    const verified = wallet
      .getByTestId('wallet-skill')
      .filter({ hasText: 'Performance technique' });
    await expect(verified).toContainText('Verified · from Foundation Music Certificate');
    const own = wallet.getByTestId('wallet-skill').filter({ hasText: 'Sight reading' });
    await expect(own).toContainText('Added by you');
    await expect(own.getByRole('button', { name: /Evidence/ })).toHaveCount(0);

    await verified.getByRole('button', { name: 'Evidence for Performance technique' }).click();
    const sheet = page.getByTestId('skill-evidence-sheet');
    await expect(
      sheet.getByText('Verified from Foundation Music Certificate', { exact: false })
    ).toBeVisible();
    await expect(sheet.getByTestId('evidence-table')).toContainText('Grace Njeri');
    await expect(sheet.locator('tr[data-superseded="true"]')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Open program report' })).toHaveAttribute(
      'href',
      `/dashboard/student/programs/${PROGRAM_UUID}?tab=assessment`
    );
  });
});
