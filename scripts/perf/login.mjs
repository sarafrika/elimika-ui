#!/usr/bin/env node
/**
 * One-time authenticated session capture for the perf harness.
 * Drives the real sign-in flow (landing → Keycloak form → dashboard) and
 * saves the session cookies to .perf/auth.json (gitignored).
 *
 * Usage:
 *   PERF_USER=<email> PERF_PASS=<password> node scripts/perf/login.mjs [baseUrl]
 */
import fs from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] ?? 'http://localhost:3000';
const user = process.env.PERF_USER;
const pass = process.env.PERF_PASS;

if (!user || !pass) {
  console.error('Set PERF_USER and PERF_PASS environment variables.');
  process.exit(1);
}

fs.mkdirSync('.perf', { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

try {
  console.log(`Opening ${baseUrl} ...`);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });

  console.log('Clicking Sign In ...');
  await page.getByRole('button', { name: /sign in/i }).first().click();

  console.log('Waiting for Keycloak login form ...');
  await page.waitForSelector('#username', { timeout: 60_000 });
  await page.fill('#username', user);

  // Two-step theme: password may appear only after submitting the username.
  if (!(await page.locator('#password').isVisible().catch(() => false))) {
    await page.click('#kc-login, input[type=submit], button[type=submit]');
    await page.waitForSelector('#password', { timeout: 30_000 });
  }
  await page.fill('#password', pass);
  await page.click('#kc-login, input[type=submit], button[type=submit]');

  console.log('Waiting for dashboard redirect ...');
  await page.waitForURL(url => url.origin === new URL(baseUrl).origin, { timeout: 90_000 });
  // Give next-auth a moment to finalize the session cookie set
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  const kcError = await page.locator('#input-error, .kc-feedback-text').first().textContent().catch(() => null);
  if (page.url().includes('auth/realms') || page.url().includes('openid-connect')) {
    console.error(`Still on Keycloak — login likely failed${kcError ? `: ${kcError.trim()}` : ''}`);
    process.exit(1);
  }

  await context.storageState({ path: '.perf/auth.json' });
  console.log(`✓ Logged in, landed on ${page.url()}`);
  console.log('✓ Session saved to .perf/auth.json');
} finally {
  await browser.close();
}
