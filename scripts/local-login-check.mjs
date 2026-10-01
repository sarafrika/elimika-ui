#!/usr/bin/env node
/**
 * Headless check that NextAuth signs in against the local Keycloak realm (elimika-local) and that the
 * session carries a Keycloak access token. Uses the Playwright already in devDependencies.
 *
 *   node scripts/local-login-check.mjs [user] [baseUrl]     # defaults: qa-student@elimika.local, http://localhost:3000
 *
 * Local stack only; the password is the shared local QA password (Passw0rd!) unless QA_PASSWORD is set.
 */
import { chromium } from 'playwright';

const user = process.argv[2] ?? 'qa-student@elimika.local';
const baseUrl = process.argv[3] ?? 'http://localhost:3000';
const password = process.env.QA_PASSWORD ?? 'Passw0rd!';

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext()).newPage();
try {
  // NextAuth's own sign-in page: one button per provider, which starts the PKCE code flow.
  await page.goto(`${baseUrl}/api/auth/signin`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.getByRole('button', { name: /sign in with/i }).first().click();
  await page.waitForSelector('#username', { timeout: 60_000 });
  await page.fill('#username', user);
  await page.fill('#password', password);
  await page.click('#kc-login');
  await page.waitForURL(url => url.origin === new URL(baseUrl).origin, { timeout: 90_000 });

  const session = await page.evaluate(async () => (await fetch('/api/auth/session')).json());
  const hasToken = typeof session?.user?.accessToken === 'string' && session.user.accessToken.length > 100;
  // One authenticated API call through the UI's own proxy, so the token is proven to work end to end.
  const apiStatus = await page.evaluate(
    async () => (await fetch('/api/proxy/api/v1/courses/recommendations?limit=3')).status
  );
  process.stdout.write(
    `landed on ${page.url()}\nsession user: ${session?.user?.email ?? session?.user?.name ?? '(none)'}\n` +
      `access token in session: ${hasToken}\nGET /api/v1/courses/recommendations via proxy: ${apiStatus}\n`
  );
  if (!session?.user || !hasToken || apiStatus !== 200) {
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
