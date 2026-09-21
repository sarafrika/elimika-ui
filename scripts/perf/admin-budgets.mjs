#!/usr/bin/env node
/**
 * Admin route budgets.
 *
 * Every admin route must paint from a handful of calls, never repeat a call, and settle
 * within ten seconds. This is what stops the N+1 patterns the old console had (one
 * enrolment call per class, the revenue dashboard six times) from coming back.
 *
 * Usage:
 *   PERF_USER=… PERF_PASS=… node scripts/perf/login.mjs http://localhost:3000
 *   cp .perf/auth.json .perf/auth-admin.json
 *   node scripts/perf/admin-budgets.mjs [baseUrl]
 *
 * Exit code 1 if any route breaks a budget.
 */
import fs from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const storageStatePath = process.env.ADMIN_STORAGE_STATE ?? '.perf/auth-admin.json';

/** Routes to measure. Add each section as it ships. */
const ROUTES = [
  '/dashboard/admin/overview',
  '/dashboard/admin/inbox',
  '/dashboard/admin/activity',
  '/dashboard/admin/people',
  '/dashboard/admin/organisations',
  '/dashboard/admin/access',
  '/dashboard/admin/courses',
  '/dashboard/admin/programs',
  '/dashboard/admin/classes',
  '/dashboard/admin/catalogue',
  '/dashboard/admin/rubrics',
  '/dashboard/admin/marketplace',
  '/dashboard/admin/revenue',
  '/dashboard/admin/sales',
  '/dashboard/admin/currencies',
  '/dashboard/admin/platform/categories',
  '/dashboard/admin/platform/rules',
  '/dashboard/admin/platform/config',
];

const BUDGET = {
  /** API calls before the page settles. */
  calls: 6,
  /** The same method + path twice is always a mistake. */
  duplicates: 0,
  /** Time for every section to reach data, empty or error. */
  settleMs: 10_000,
  /** Nothing may still be shimmering at this point. */
  skeletonDeadlineMs: 12_000,
};

if (!fs.existsSync(storageStatePath)) {
  console.error(
    `admin-budgets: no signed-in session at ${storageStatePath}.\n` +
      'Run scripts/perf/login.mjs as an admin first, then copy .perf/auth.json there.'
  );
  process.exit(1);
}

const normalise = url =>
  url
    .replace(/^https?:\/\/[^/]+/, '')
    .split('?')[0]
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storageStatePath });
const failures = [];
const rows = [];

for (const route of ROUTES) {
  const page = await context.newPage();
  const calls = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/') && !url.includes('/api/auth/')) {
      calls.push(`${request.method()} ${normalise(url)}`);
    }
  });

  const startedAt = Date.now();
  let settled = true;
  try {
    await page.goto(baseUrl + route, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page
      .waitForLoadState('networkidle', { timeout: BUDGET.settleMs })
      .catch(() => {
        settled = false;
      });
  } catch (error) {
    failures.push(`${route}: failed to load — ${String(error).slice(0, 120)}`);
    await page.close();
    continue;
  }
  const elapsed = Date.now() - startedAt;

  if (page.url().includes('/dashboard/admin') === false) {
    failures.push(`${route}: redirected to ${page.url()} — is the session an admin?`);
    await page.close();
    continue;
  }

  await page.waitForTimeout(Math.max(0, BUDGET.skeletonDeadlineMs - elapsed));
  const skeletons = await page
    .locator('[class*="animate-pulse"], [class*="animate-shimmer"]')
    .count()
    .catch(() => 0);

  const counted = new Map();
  for (const call of calls) counted.set(call, (counted.get(call) ?? 0) + 1);
  const duplicates = [...counted.entries()].filter(([, count]) => count > 1);

  rows.push({ route, calls: calls.length, unique: counted.size, skeletons, ms: elapsed, settled });

  if (calls.length > BUDGET.calls) {
    failures.push(`${route}: ${calls.length} API calls on first load (budget ${BUDGET.calls})`);
  }
  if (duplicates.length > BUDGET.duplicates) {
    failures.push(
      `${route}: repeated calls — ${duplicates.map(([call, count]) => `${count}× ${call}`).join(', ')}`
    );
  }
  if (!settled) {
    failures.push(`${route}: still loading after ${BUDGET.settleMs / 1000}s`);
  }
  if (skeletons > 0) {
    failures.push(
      `${route}: ${skeletons} skeleton(s) still showing at ${BUDGET.skeletonDeadlineMs / 1000}s`
    );
  }

  await page.close();
}

await browser.close();

console.table(rows);

if (failures.length) {
  console.error(`admin-budgets: ${failures.length} budget failure(s):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(`admin-budgets: clean — ${ROUTES.length} route(s) within budget.`);
