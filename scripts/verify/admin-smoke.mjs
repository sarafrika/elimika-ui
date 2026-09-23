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
/** How long the shared shell may take to resolve identity before a section can mount. */
const SHELL_GRACE_MS = 30_000;

if (!fs.existsSync(storageStatePath)) {
  console.error(
    `admin-smoke: no signed-in session at ${storageStatePath}.\n` +
      'Run scripts/perf/login.mjs as an admin first, then copy .perf/auth.json there.'
  );
  process.exit(1);
}

const failures = [];
const warnings = [];
const steps = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storageStatePath });
const page = await context.newPage();

/**
 * The shared shell (identity, the domain probes, notifications, wallet) runs before any
 * dashboard page mounts and its media requests are not the section's doing. Both are kept
 * out of the section's own settle window, which is what this walk is judging.
 */
const SHELL_CALLS = /\/users\/me|\/notifications|\/wallets\//;
const PROFILE_PROBE = /\/(students|instructors|course-creators|organisations)\/search\?[^#]*user_uuid_eq=/;
const MEDIA_CALLS = /\/files\/|\/media\//;
const isPageCall = url =>
  url.includes('/api/') &&
  !url.includes('/api/auth/') &&
  !MEDIA_CALLS.test(url) &&
  !SHELL_CALLS.test(url) &&
  !PROFILE_PROBE.test(url);

let pageStartedAt = null;
let inFlight = 0;

page.on('request', request => {
  if (!isPageCall(request.url())) return;
  if (pageStartedAt === null) pageStartedAt = Date.now();
  inFlight += 1;
});
const requestDone = request => {
  if (isPageCall(request.url())) inFlight = Math.max(0, inFlight - 1);
};
page.on('requestfinished', requestDone);
page.on('requestfailed', requestDone);

const consoleErrors = [];
/** A failing API and a missing upload are reported, but they are not this console's bug. */
const backendErrors = [];
const mediaErrors = [];
// The dev server serves devtools chunks lazily and 404s the ones it has not built;
// that is a dev artifact, not something an admin would ever see.
// Resource errors arrive without a URL, so they are caught by the response listener
// below instead; the dev server also 404s devtools chunks it has not built.
const IGNORED_CONSOLE = /Failed to load resource|_next\/static\/chunks/;

page.on('console', message => {
  if (message.type() !== 'error') return;
  const text = message.text().slice(0, 200);
  if (IGNORED_CONSOLE.test(text)) return;
  consoleErrors.push(text);
});

page.on('response', response => {
  const url = response.url();
  if (response.status() < 400 || !url.includes('/api/proxy')) return;
  const label = `${response.status()} ${url.replace(/^https?:\/\/[^/]+\/api\/proxy/, '')}`;
  if (MEDIA_CALLS.test(url)) mediaErrors.push(label);
  else if (response.status() >= 500) backendErrors.push(label);
  else consoleErrors.push(label);
});

async function visit(name, path, expect) {
  const startedAt = Date.now();
  consoleErrors.length = 0;
  backendErrors.length = 0;
  mediaErrors.length = 0;
  pageStartedAt = null;
  inFlight = 0;
  try {
    await page.goto(baseUrl + path, { waitUntil: 'domcontentloaded', timeout: 45_000 });

    // Wait for the shell to let the section mount; a warm cache may serve it with no
    // call at all, so this is a grace period rather than a requirement.
    const startDeadline = Date.now() + SHELL_GRACE_MS;
    while (pageStartedAt === null && Date.now() < startDeadline) {
      await page.waitForTimeout(250);
    }

    // Settled means the section's own calls are in and nothing is shimmering.
    const settleDeadline = (pageStartedAt ?? Date.now()) + SETTLE_MS;
    let settled = false;
    while (Date.now() < settleDeadline) {
      const shimmering = await page.locator('[class*="animate-pulse"]').count().catch(() => 0);
      if (inFlight === 0 && shimmering === 0) {
        settled = true;
        break;
      }
      await page.waitForTimeout(250);
    }
    if (!settled) failures.push(`${name}: still loading ${SETTLE_MS / 1000}s after its first call`);
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
  for (const error of new Set(backendErrors)) warnings.push(`${name}: server error — ${error}`);
  for (const error of new Set(mediaErrors)) warnings.push(`${name}: missing file — ${error}`);

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
await visit('Courses', '/dashboard/admin/courses', 'Course');
await visit('Programs', '/dashboard/admin/programs', 'Program');
await visit('Classes', '/dashboard/admin/classes', 'Class');
await visit('Catalogue', '/dashboard/admin/catalogue', 'Catalogue');
await visit('Rubrics', '/dashboard/admin/rubrics', 'Rubric');
await visit('Marketplace', '/dashboard/admin/marketplace', 'Marketplace');
await visit('Revenue', '/dashboard/admin/revenue', 'Revenue');
await visit('Sales', '/dashboard/admin/sales', 'Sales');
await visit('Currencies', '/dashboard/admin/currencies', 'Currenc');
await visit('Categories', '/dashboard/admin/platform/categories', 'Categor');
await visit('System rules', '/dashboard/admin/platform/rules', 'rule');
await visit('Config lists', '/dashboard/admin/platform/config', 'Content type');

// The route that matters most: a queue item must open the person's own record.
await page.goto(`${baseUrl}/dashboard/admin/inbox?type=documents`, {
  waitUntil: 'domcontentloaded',
});
await page.waitForLoadState('networkidle', { timeout: SETTLE_MS }).catch(() => {});
const firstRow = page.getByTestId('inbox-row').first();
await firstRow.waitFor({ state: 'visible', timeout: SETTLE_MS }).catch(() => {});
if ((await firstRow.count()) > 0) {
  await firstRow.click();
  const recordLink = page.locator('a[href*="/dashboard/admin/people/"]').first();
  await recordLink.waitFor({ state: 'visible', timeout: SETTLE_MS }).catch(() => {});
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

if (warnings.length) {
  console.warn(`admin-smoke: ${warnings.length} upstream warning(s) — the console handled these:`);
  for (const warning of warnings) console.warn(`  ${warning}`);
}

if (failures.length) {
  console.error(`admin-smoke: ${failures.length} failure(s):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(`admin-smoke: clean — ${steps.length} step(s) walked with no errors.`);
