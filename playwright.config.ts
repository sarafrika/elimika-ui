import { defineConfig, devices } from '@playwright/test';

// Behaviour specs run against `next dev` with every API call answered from fixtures:
// browser calls are intercepted with page.route, server-side calls hit the mock API below.
const APP_PORT = 3100;
const MOCK_API_PORT = 4010;

export const E2E_AUTH_SECRET = 'e2e-only-secret-not-used-anywhere-else-0123456789';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    {
      command: `node e2e/support/mock-api.mjs ${MOCK_API_PORT}`,
      port: MOCK_API_PORT,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm exec next dev -p ${APP_PORT}`,
      port: APP_PORT,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
      env: {
        API_BASE_URL: `http://localhost:${MOCK_API_PORT}`,
        AUTH_URL: `http://localhost:${APP_PORT}`,
        AUTH_SECRET: E2E_AUTH_SECRET,
        AUTH_TRUST_HOST: 'true',
        KEYCLOAK_ISSUER: `http://localhost:${MOCK_API_PORT}/realms/e2e`,
        KEYCLOAK_CLIENT_ID: 'e2e',
        KEYCLOAK_CLIENT_SECRET: 'e2e',
        KEYCLOAK_REALM: 'e2e',
        NEXT_PUBLIC_SITE_URL: `http://localhost:${APP_PORT}`,
      },
    },
  ],
});
