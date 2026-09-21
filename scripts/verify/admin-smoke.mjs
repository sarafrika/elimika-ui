#!/usr/bin/env node
/**
 * Admin console smoke test.
 *
 * Walks the shipped sections as a signed-in admin and fails if a screen errors, hangs,
 * or loses its data. It only reads: no decision is ever confirmed, so it is safe to run
 * against staging.
 *
 * Usage:
 *   PERF_USER=… PERF_PASS=… node scripts/perf/login.mjs http://localhost:3000
 *   cp .perf/auth.json .perf/auth-admin.json
 *   node scripts/verify/admin-smoke.mjs [baseUrl]
 */
import fs from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const storageStatePath = process.env.ADMIN_STORAGE_STATE ?? '.perf/auth-admin.json';
const SETTLE_MS = 12_000;

if (!fs.existsSync(storageStatePath)) {
  console.error(
    `admin-smoke: no signed-in session at ${storageStatePath}.\n` +
      'Run scripts/perf/login.mjs as an admin first, then copy .perf/auth.json there.'
  );
  process.exit(1);
}

const failures = [];
const steps = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storageStatePath });
const page = await context.newPage();

const consoleErrors = [];
page.on('console', message => {
  if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 160));
});

async function visit(name, path, expect) {
  const startedAt = Date.now();
  consoleErrors.length = 0;
  try {
    await page.goto(baseUrl + path, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('networkidle', { timeout: SETTLE_MS }).catch(() => {
      failures.push(`${name}: still loading after ${SETTLE_MS / 1000}s`);
    });
  } catch (error) {
    failures.push(`${name}: failed to load — ${String(error).slice(0, 120)}`);
    return null;
  }

  if (!page.url().includes('/dashboard/admin')) {
    failures.push(`${name}: bounced to ${page.url()} — is this session an admin?`);
    return null;
  }

  const text = await page.locator('body').innerText();
  if (expect && !text.includes(expect)) {
    failures.push(`${name}: expected to see “${expect}”`);
  }

  const brokenSections = await page.getByText(/Couldn’t load|Couldn't load/).count();
  if (brokenSections > 0) failures.push(`${name}: ${brokenSections} section(s) failed to load`);

  const stuck = await page.locator('[class*="animate-pulse"]').count();
  if (stuck > 0) failures.push(`${name}: ${stuck} skeleton(s) still showing after settle`);

  if (consoleErrors.length) {
    failures.push(`${name}: console error — ${consoleErrors[0]}`);
  }

  steps.push({ step: name, ms: Date.now() - startedAt, sections: brokenSections, stuck });
  return text;
}

// The sections that have shipped. Add each one as its phase lands.
await visit('Home', '/dashboard/admin/overview', 'Admin console');
await visit('Review inbox', '/dashboard/admin/inbox', 'decision');
await visit('Activity log', '/dashboard/admin/activity', 'Activity');
await visit('People', '/dashboard/admin/people', 'People');
await visit('Organisations', '/dashboard/admin/organisations', 'Organisation');
await visit('Admins & access', '/dashboard/admin/access', 'access');

// The route that matters most: a queue item must open the person's own record.
await page.goto(`${baseUrl}/dashboard/admin/inbox?type=documents`, {
  waitUntil: 'domcontentloaded',
});
await page.waitForLoadState('networkidle', { timeout: SETTLE_MS }).catch(() => {});
const firstRow = page.locator('li button').first();
if ((await firstRow.count()) > 0) {
  await firstRow.click();
  await page.waitForTimeout(2500);
  const recordLink = page.locator('a[href*="/dashboard/admin/people/"]').first();
  if ((await recordLink.count()) === 0) {
    failures.push('Inbox: selecting an item offered no link into the record');
  } else {
    const href = await recordLink.getAttribute('href');
    if (!href?.includes('tab=verification')) {
      failures.push('Inbox: the record link does not open the verification tab');
    }
    await visit('Verify in record', href, 'Records on file');
  }
} else {
  steps.push({ step: 'Inbox: queue empty, routing not exercised', ms: 0 });
}

await browser.close();

console.table(steps);

if (failures.length) {
  console.error(`admin-smoke: ${failures.length} failure(s):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(`admin-smoke: clean — ${steps.length} step(s) walked with no errors.`);
