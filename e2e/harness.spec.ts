import { expect, test } from '@playwright/test';
import { MockApi } from './support/api';
import { signIn } from './support/session';

// Guards the harness itself: a minted session gets past the sign-in guard and API calls are mocked.
test('a signed-in instructor reaches the dashboard with the API mocked', async ({ page, context, baseURL }) => {
  await signIn(
    context,
    { uuid: '00000000-0000-4000-8000-000000000001', name: 'E2E Instructor', email: 'instructor@e2e.test', domains: ['instructor'] },
    baseURL ?? ''
  );
  const api = new MockApi();
  await api.install(page);
  await page.goto('/dashboard/instructor/training-hub');
  await expect(page).toHaveURL(/\/dashboard\/instructor\/training-hub/);
  await expect.poll(() => api.calls.length).toBeGreaterThan(0);
});
