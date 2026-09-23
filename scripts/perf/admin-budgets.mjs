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
  /** Time for every section to reach data, empty or error, once the page can start. */
  settleMs: 10_000,
  /** Nothing may still be shimmering at this point. */
  skeletonDeadlineMs: 12_000,
  /**
   * The shared shell resolves identity before any dashboard page mounts: session →
   * /users/me → the domain profile probes → the organisation record. Admin owns none
   * of that, so it is measured and reported on its own rather than charged to every
   * section, and only a regression past this ceiling is called a failure.
   */
  shellMs: 20_000,
  /** How long to wait for a page to start its own work before calling it stuck. */
  pageStartMs: 45_000,
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

/**
 * The shared dashboard shell (identity, notification bell, wallet chip, and the
 * profile probes that resolve which domains the signed-in user holds) and media
 * files are not the section's doing, so they are counted separately rather than
 * charged to its budget. The profile probes are told apart from a real lookup by
 * `user_uuid_eq`: the shell asks about one user, a page asks about its rows.
 */
const SHELL_CALLS = /\/users\/me|\/notifications|\/wallets\//;
const PROFILE_PROBE = /\/(students|instructors|course-creators|organisations)\/search\?[^#]*user_uuid_eq=/;
const MEDIA_CALLS = /\/files\/|\/media\//;

const classify = url => {
  if (MEDIA_CALLS.test(url)) return 'media';
  if (SHELL_CALLS.test(url) || PROFILE_PROBE.test(url)) return 'shell';
  return 'page';
};

const browser = await chromium.launch({ headless: true });
const failures = [];
const rows = [];

for (const route of ROUTES) {
  /**
   * A fresh context per route. The app persists its query cache, so reusing one
   * would measure a warm second visit and quietly under-report the first load
   * this budget exists to protect.
   */
  const context = await browser.newContext({ storageState: storageStatePath });
  const page = await context.newPage();
  const calls = [];
  let pageStartedAt = null;
  let inFlight = 0;

  const isPageRequest = request => {
    const url = request.url();
    return url.includes('/api/') && !url.includes('/api/auth/') && classify(url) === 'page';
  };

  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/') && !url.includes('/api/auth/')) {
      const kind = classify(url);
      if (kind === 'page') {
        if (pageStartedAt === null) pageStartedAt = Date.now();
        inFlight += 1;
      }
      calls.push({ kind, label: `${request.method()} ${normalise(url)}` });
    }
  });
  const settleRequest = request => {
    if (isPageRequest(request)) inFlight = Math.max(0, inFlight - 1);
  };
  page.on('requestfinished', settleRequest);
  page.on('requestfailed', settleRequest);

  const countSkeletons = () =>
    page
      .locator('[class*="animate-pulse"], [class*="animate-shimmer"]')
      .count()
      .catch(() => 0);

  const startedAt = Date.now();
  let settled = false;
  let skeletons = 0;
  try {
    await page.goto(baseUrl + route, { waitUntil: 'domcontentloaded', timeout: 45_000 });

    // The page's own budget starts when the shell lets it mount, not at navigation.
    const startDeadline = Date.now() + BUDGET.pageStartMs;
    while (pageStartedAt === null && Date.now() < startDeadline) {
      await page.waitForTimeout(250);
    }

    /**
     * Settled means the section's own requests are all in and nothing is shimmering.
     * `networkidle` was the wrong signal here: it also waits on thumbnails and on the
     * shell's notification poll, neither of which is the section keeping an admin
     * waiting.
     */
    const settleDeadline = (pageStartedAt ?? Date.now()) + BUDGET.settleMs;
    while (Date.now() < settleDeadline) {
      skeletons = await countSkeletons();
      if (inFlight === 0 && skeletons === 0) {
        settled = true;
        break;
      }
      await page.waitForTimeout(250);
    }
  } catch (error) {
    failures.push(`${route}: failed to load — ${String(error).slice(0, 120)}`);
    await context.close();
    continue;
  }
  const shellMs = pageStartedAt ? pageStartedAt - startedAt : null;
  const elapsed = pageStartedAt ? Date.now() - pageStartedAt : Date.now() - startedAt;

  if (page.url().includes('/dashboard/admin') === false) {
    failures.push(`${route}: redirected to ${page.url()} — is the session an admin?`);
    await context.close();
    continue;
  }

  if (!settled) {
    await page.waitForTimeout(Math.max(0, BUDGET.skeletonDeadlineMs - elapsed));
    skeletons = await countSkeletons();
  }

  const pageCalls = calls.filter(call => call.kind === 'page').map(call => call.label);
  const shellCalls = calls.filter(call => call.kind === 'shell');
  const mediaCalls = calls.filter(call => call.kind === 'media');

  const counted = new Map();
  for (const call of pageCalls) counted.set(call, (counted.get(call) ?? 0) + 1);
  const duplicates = [...counted.entries()].filter(([, count]) => count > 1);

  rows.push({
    route,
    page: pageCalls.length,
    shell: shellCalls.length,
    media: mediaCalls.length,
    skeletons,
    shellMs: shellMs ?? '—',
    ms: elapsed,
    settled,
  });

  if (pageCalls.length > BUDGET.calls) {
    failures.push(
      `${route}: ${pageCalls.length} API calls on first load (budget ${BUDGET.calls})`
    );
  }
  if (duplicates.length > BUDGET.duplicates) {
    failures.push(
      `${route}: repeated calls — ${duplicates.map(([call, count]) => `${count}× ${call}`).join(', ')}`
    );
  }
  if (pageCalls.length === 0) {
    failures.push(`${route}: made no API call of its own within ${BUDGET.pageStartMs / 1000}s`);
  }
  if (!settled) {
    failures.push(`${route}: still loading ${BUDGET.settleMs / 1000}s after its first call`);
  }
  if (shellMs !== null && shellMs > BUDGET.shellMs) {
    failures.push(
      `${route}: the shared shell took ${(shellMs / 1000).toFixed(1)}s to let the page start ` +
        `(ceiling ${BUDGET.shellMs / 1000}s)`
    );
  }
  if (skeletons > 0) {
    failures.push(
      `${route}: ${skeletons} skeleton(s) still showing at ${BUDGET.skeletonDeadlineMs / 1000}s`
    );
  }

  await context.close();
}

await browser.close();

console.table(rows);

if (failures.length) {
  console.error(`admin-budgets: ${failures.length} budget failure(s):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(`admin-budgets: clean — ${ROUTES.length} route(s) within budget.`);
