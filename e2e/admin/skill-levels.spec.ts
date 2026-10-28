import { expect, test } from '@playwright/test';
import { mockShell } from '../fixtures/grades';
import { MockApi } from '../support/api';
import { type E2eUser, signIn } from '../support/session';

const ADMIN_USER: E2eUser = {
  uuid: '00000000-0000-4000-8000-0000000000d1',
  name: 'Platform Admin',
  email: 'admin@e2e.test',
  domains: ['admin'],
};

const DEFAULT_SCALE = [
  { uuid: 'l1', name: 'Not achieved', min_percentage: 0, counts_as_achieved: false },
  { uuid: 'l2', name: 'Developing', min_percentage: 50, counts_as_achieved: false },
  { uuid: 'l3', name: 'Achieved', min_percentage: 70, counts_as_achieved: true },
];

test.describe('System admin · Skill levels', () => {
  test('previews a score, switches to the 4-level scale and saves it after the re-level warning', async ({
    page,
    context,
    baseURL,
  }) => {
    await signIn(context, ADMIN_USER, baseURL as string);
    const api = new MockApi();
    mockShell(api, ADMIN_USER);
    api.get(/^\/api\/v1\/skill-levels$/, DEFAULT_SCALE);
    api.on('PUT', /^\/api\/v1\/admin\/skill-levels$/, request => request.postDataJSON());
    await api.install(page);
    await page.goto('/dashboard/admin/platform/skill-levels');

    await expect(page.getByTestId('level-row')).toHaveCount(3);
    await expect(page.getByTestId('level-preview')).toContainText('64% lands on');
    await expect(page.getByTestId('level-preview')).toContainText('Developing');
    await page.getByRole('button', { name: '72%' }).click();
    await expect(page.getByTestId('level-preview')).toContainText('Achieved');
    await expect(page.getByTestId('level-preview')).toContainText('Skills Wallet as verified');

    await page.getByRole('button', { name: 'Use 4-level proficiency scale' }).click();
    await page.getByRole('button', { name: '85%' }).click();
    await expect(page.getByTestId('level-preview')).toContainText('Advanced');
    await page.getByRole('button', { name: 'Save levels' }).click();

    const warning = page.getByRole('region', { name: 'Skill levels' }).getByRole('alert');
    await expect(warning).toContainText('Re-level every learner?');
    await expect(warning).toContainText('Achieved will start at 70%.');
    expect(api.callsTo('PUT', /skill-levels$/)).toHaveLength(0);
    await warning.getByRole('button', { name: 'Go back and check' }).click();
    await expect(warning).toHaveCount(0);
    expect(api.callsTo('PUT', /skill-levels$/)).toHaveLength(0);

    await page.getByRole('button', { name: 'Save levels' }).click();
    await page.getByRole('button', { name: 'Yes, save and re-level' }).click();
    await expect(page.getByText('Levels saved. Current levels are being updated')).toBeVisible();

    await expect.poll(() => api.callsTo('PUT', /skill-levels$/).length).toBe(1);
    expect(api.callsTo('PUT', /skill-levels$/)[0]?.body).toEqual([
      { name: 'Foundation', min_percentage: 0, counts_as_achieved: false },
      { name: 'Developing', min_percentage: 50, counts_as_achieved: false },
      { name: 'Proficient', min_percentage: 70, counts_as_achieved: true },
      { name: 'Advanced', min_percentage: 85, counts_as_achieved: true },
    ]);
  });

  test('blocks a scale whose achieved levels are not the top levels', async ({
    page,
    context,
    baseURL,
  }) => {
    await signIn(context, ADMIN_USER, baseURL as string);
    const api = new MockApi();
    mockShell(api, ADMIN_USER);
    api.get(/^\/api\/v1\/skill-levels$/, DEFAULT_SCALE);
    await api.install(page);
    await page.goto('/dashboard/admin/platform/skill-levels');

    await page.getByRole('combobox', { name: 'Counts as achieved for Developing' }).click();
    await page.getByRole('option', { name: 'Yes' }).click();
    await page.getByRole('combobox', { name: 'Counts as achieved for Achieved' }).click();
    await page.getByRole('option', { name: 'No' }).click();
    await expect(
      page.getByRole('region', { name: 'Skill levels' }).getByRole('alert')
    ).toContainText('Achieved levels must be the top levels.');
    await expect(page.getByRole('button', { name: 'Save levels' })).toBeDisabled();
  });
});
