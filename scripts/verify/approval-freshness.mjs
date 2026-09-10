#!/usr/bin/env node
/**
 * Proof that a reload re-asks the API for approval state instead of replaying a
 * held answer — the sessionStorage cache in the browser and the per-user store
 * app/api/proxy keeps behind it both count. Usage and env vars live in
 * scripts/verify/README.md.
 */
import fs from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const storageStatePath = process.env.APPROVAL_STORAGE_STATE ?? '.perf/auth-organisation.json';
const domain = process.env.APPROVAL_DOMAIN ?? 'organisation';
const namedApplication = process.env.APPROVAL_APPLICATION ?? null;
const applicationsPath = '/dashboard/organisation/my-applications';

const QUERY_CACHE_KEY = 'elimika-query-cache-v1';
const SEARCH_ENDPOINT = 'training-applications/search';
const SKELETON_SELECTOR = '[data-slot="skeleton"]';
const ACTING_DOMAIN_HEADER = 'X-Acting-Domain';
const CACHE_STATE_HEADER = 'x-bff-cache';

// app/api/proxy stamps every GET with how it answered; only these two states mean
// the body came from the API on this hit rather than out of its own store.
const FETCHED_CACHE_STATES = new Set(['MISS', 'BYPASS']);
const PROBE_PAGE_SIZE = 100;

const NAV_TIMEOUT_MS = 45_000;
const RENDER_TIMEOUT_MS = 30_000;
const COURSE_NAME_TIMEOUT_MS = 10_000;
const PERSIST_FLUSH_MS = 2500;
const QUIET_MS = 2500;
const QUIET_CAP_MS = 20_000;
const WATCHDOG_MS = 150_000;

const baseOrigin = new URL(baseUrl).origin;
const results = [];

function pass(name, detail) {
  results.push({ name, ok: true });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail) {
  results.push({ name, ok: false });
  console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
}

/** Unrecoverable setup problem: report it the same way and stop, never hang. */
function abort(message) {
  console.log(`FAIL  harness — ${message}`);
  process.exit(2);
}

// A dashboard path that lands anywhere but the app's own origin has bounced to
// Keycloak, which means the captured cookies have expired.
function isSignInBounce(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.origin !== baseOrigin) return true;
  return /\/(auth\/realms|auth\/signin|api\/auth\/signin)/.test(parsed.pathname);
}

function requireLiveSession(url) {
  if (!isSignInBounce(url)) return;
  abort(
    `the session in ${storageStatePath} is expired — the app bounced to ${url}. ` +
      'Refresh it with PERF_USER=… PERF_PASS=… node scripts/perf/login.mjs and retry.'
  );
}

// The captured session carries its own elimika-active-dashboard cookie, which
// wins over anything added later; rewriting it in memory is how page-audit.mjs
// pins a role without re-running the whole sign-in.
function loadStorageState() {
  if (!fs.existsSync(storageStatePath)) {
    abort(
      `missing ${storageStatePath} — sign in as the organisation user with ` +
        `PERF_USER=… PERF_PASS=… node scripts/perf/login.mjs, then copy .perf/auth.json to ` +
        `${storageStatePath} (or point APPROVAL_STORAGE_STATE at the file you kept).`
    );
  }

  const state = JSON.parse(fs.readFileSync(storageStatePath, 'utf8'));
  const hostname = new URL(baseUrl).hostname;

  state.cookies = (state.cookies ?? []).filter(
    cookie => cookie.name !== 'elimika-active-dashboard'
  );
  state.cookies.push({
    name: 'elimika-active-dashboard',
    value: domain,
    domain: hostname,
    path: '/',
    expires: Math.floor(Date.now() / 1000) + 86_400,
    httpOnly: false,
    secure: baseUrl.startsWith('https:'),
    sameSite: 'Lax',
  });
  state.origins = (state.origins ?? []).filter(origin => !origin.origin.includes(hostname));

  return state;
}

// Every row in this table is an application: the loading state paints its own
// skeleton list outside the table and the empty state paints no table at all.
function readApplicationRows(page) {
  return page.evaluate(
    skeletonSelector =>
      Array.from(document.querySelectorAll('table tbody tr')).map((row, index) => {
        const cells = Array.from(row.querySelectorAll('td'));
        const read = position => (cells[position]?.innerText ?? '').trim();
        return {
          index,
          course: read(1),
          status: read(6),
          // The name arrives from a per-course lookup that settles after the list,
          // so a blank cell is a row still resolving, never a row that is absent.
          coursePending: Boolean(cells[1]?.querySelector(skeletonSelector)),
        };
      }),
    SKELETON_SELECTOR
  );
}

function describeRows(rows) {
  return rows
    .map(row => row.course || (row.coursePending ? '<name still loading>' : '<unnamed>'))
    .join(', ');
}

function labelOf(row) {
  return row.course || `row ${row.index + 1}`;
}

function selectRow(rows) {
  if (!namedApplication) return rows[0] ?? null;
  return (
    rows.find(row => row.course.toLowerCase().includes(namedApplication.toLowerCase())) ?? null
  );
}

// Course names can resolve in a different order after the reload, so fall back to
// the position the tracked row held when the name is not there to match on.
function locateAfterReload(rows, before) {
  const byName = before.course ? rows.find(row => row.course === before.course) : null;
  return byName ?? rows[before.index] ?? null;
}

async function waitForApplications(page) {
  const listOrEmptyState = page
    .locator('table tbody tr')
    .first()
    .or(page.getByText('No applications yet').first());

  try {
    await listOrEmptyState.waitFor({ state: 'attached', timeout: RENDER_TIMEOUT_MS });
  } catch {
    requireLiveSession(page.url());
    abort(
      `the applications list never rendered at ${page.url()} within ${RENDER_TIMEOUT_MS}ms — ` +
        'check the app is running and the session has an organisation dashboard.'
    );
  }
}

async function waitForCourseNames(page) {
  await page
    .waitForFunction(
      skeletonSelector =>
        Array.from(document.querySelectorAll('table tbody tr td:nth-child(2)')).every(
          cell => !cell.querySelector(skeletonSelector)
        ),
      SKELETON_SELECTOR,
      { timeout: COURSE_NAME_TIMEOUT_MS }
    )
    // Names only label and match the tracked row, so lookups that never settle
    // degrade the report instead of failing the run.
    .catch(() => {});
}

/**
 * The proxy keys its per-user store by the exact query string, and `size` is one
 * of the three params the search endpoint keeps out of its filters, so repeating
 * it buys a key nothing can already be cached under without moving the rows.
 */
function buildProbeUrl(sampleUrl) {
  const url = new URL(sampleUrl);
  const declaredSize = Array.from(url.searchParams.entries()).find(([key]) =>
    key.toLowerCase().endsWith('size')
  )?.[1];

  url.searchParams.append('size', declaredSize ?? String(PROBE_PAGE_SIZE));
  return url.toString();
}

function prettyStatus(value) {
  if (!value) return '—';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

/** What the API says right now, formatted the way the page formats it. */
async function readServerStatuses(page, sampleUrl) {
  const response = await page.request.get(buildProbeUrl(sampleUrl), {
    headers: { [ACTING_DOMAIN_HEADER]: domain },
  });

  if (!response.ok()) {
    abort(
      `the uncached read of ${SEARCH_ENDPOINT} answered HTTP ${response.status()} — without an ` +
        'answer straight from the API there is nothing to hold the painted status against.'
    );
  }

  const body = await response.json().catch(() => null);
  const content = body?.data?.content;
  if (!Array.isArray(content)) {
    abort(
      `the uncached read of ${SEARCH_ENDPOINT} carried no data.content array — the response shape ` +
        'moved and this script no longer knows where the statuses are.'
    );
  }

  return content.map(entry => prettyStatus(entry?.status));
}

async function settle(page, activity) {
  const start = Date.now();
  while (Date.now() - activity.last < QUIET_MS && Date.now() - start < QUIET_CAP_MS) {
    await page.waitForTimeout(250);
  }
}

/**
 * The org half of the proof. Kept standalone so the approver session that flips
 * the status can be layered on top without reshaping this one.
 */
async function runOrgCheck(browser) {
  const context = await browser.newContext({
    storageState: loadStorageState(),
    viewport: { width: 1600, height: 1000 },
  });
  const page = await context.newPage();

  const searchRequests = [];
  const searchResponses = [];
  const activity = { last: Date.now() };
  let lastSearchUrl = null;

  page.on('request', request => {
    activity.last = Date.now();
    if (request.url().includes(SEARCH_ENDPOINT)) {
      searchRequests.push(request.url());
      lastSearchUrl = request.url();
    }
  });
  page.on('response', response => {
    activity.last = Date.now();
    if (!response.url().includes(SEARCH_ENDPOINT)) return;
    searchResponses.push((response.headers()[CACHE_STATE_HEADER] ?? '').toUpperCase() || 'NONE');
  });

  try {
    await page.goto(`${baseUrl}${applicationsPath}`, {
      waitUntil: 'domcontentloaded',
      timeout: NAV_TIMEOUT_MS,
    });
    requireLiveSession(page.url());

    await waitForApplications(page);
    await waitForCourseNames(page);
    await settle(page, activity);
    requireLiveSession(page.url());

    const firstLoadRequests = searchRequests.length;
    const rowsBefore = await readApplicationRows(page);

    if (!rowsBefore.length) {
      abort(
        'this organisation has no training applications, so there is no status to replay — ' +
          'point the script at an org that has applied to train a course.'
      );
    }

    const before = selectRow(rowsBefore);
    if (!before) {
      abort(
        `no application row matched APPROVAL_APPLICATION="${namedApplication}". ` +
          `Rows on the page: ${describeRows(rowsBefore)}`
      );
    }

    if (firstLoadRequests > 0) {
      pass(
        'first load queries the server',
        `${firstLoadRequests} request(s) to ${SEARCH_ENDPOINT}; ${labelOf(before)} reads "${before.status}"`
      );
    } else {
      fail(
        'first load queries the server',
        `no request to ${SEARCH_ENDPOINT} on the initial navigation — the page never asked at all.`
      );
    }

    // The persister throttles writes by a second, so the cache the reload
    // restores from only exists after it has flushed.
    await page.waitForTimeout(PERSIST_FLUSH_MS);
    const persisted = await page.evaluate(
      key => (window.sessionStorage.getItem(key) ?? '').length,
      QUERY_CACHE_KEY
    );

    if (persisted > 0) {
      pass('query cache persisted before reload', `${persisted} bytes under ${QUERY_CACHE_KEY}`);
    } else {
      fail(
        'query cache persisted before reload',
        `${QUERY_CACHE_KEY} is empty, so the reload below restores nothing and proves nothing.`
      );
    }

    searchRequests.length = 0;
    searchResponses.length = 0;
    activity.last = Date.now();

    await page.reload({ waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
    requireLiveSession(page.url());
    await waitForApplications(page);
    await waitForCourseNames(page);
    await settle(page, activity);

    const reloadRequests = searchRequests.length;
    const reloadCacheStates = searchResponses.slice();
    const rowsAfter = await readApplicationRows(page);
    const after = locateAfterReload(rowsAfter, before);

    if (reloadRequests > 0) {
      pass(
        'reload re-issues the applications request',
        `${reloadRequests} browser request(s) to ${SEARCH_ENDPOINT} after the reload`
      );
    } else {
      fail(
        'reload re-issues the applications request',
        `0 requests to ${SEARCH_ENDPOINT} after the reload — the page painted purely from the ` +
          'restored cache, which is the bug this guards.'
      );
    }

    // A browser request that the proxy answers out of its own store carries the
    // same body a replayed cache would, so the count above proves nothing alone.
    const servedFromApi = reloadCacheStates.filter(state => FETCHED_CACHE_STATES.has(state));

    if (!reloadCacheStates.length) {
      fail(
        'reload reaches the API, not the proxy cache',
        `no ${SEARCH_ENDPOINT} response came back to read ${CACHE_STATE_HEADER} from.`
      );
    } else if (servedFromApi.length) {
      pass(
        'reload reaches the API, not the proxy cache',
        `${CACHE_STATE_HEADER}: ${reloadCacheStates.join(', ')}`
      );
    } else {
      fail(
        'reload reaches the API, not the proxy cache',
        `${CACHE_STATE_HEADER}: ${reloadCacheStates.join(', ')} — app/api/proxy answered the reload ` +
          'from its own per-user store. getPrivateBffCacheTtlMs in lib/api/private-bff-cache.ts ' +
          'matches this path to neither pattern list, so it holds the answer fresh for five ' +
          'minutes and an approval decided inside that window stays invisible.'
      );
    }

    if (after) {
      pass(
        'tracked application survives the reload',
        `${labelOf(before)} is still on the page as row ${after.index + 1}`
      );
    } else {
      fail(
        'tracked application survives the reload',
        `${labelOf(before)} is missing from the reloaded page.`
      );
    }

    if (after && lastSearchUrl) {
      const serverStatuses = await readServerStatuses(page, lastSearchUrl);
      const serverStatus = serverStatuses[after.index] ?? null;

      if (serverStatus === null) {
        fail(
          'reloaded status matches the API',
          `the API returned ${serverStatuses.length} application(s), so row ${after.index + 1} has ` +
            'nothing to compare against.'
        );
      } else if (after.status === serverStatus) {
        pass(
          'reloaded status matches the API',
          `${labelOf(before)} reads "${after.status}" and the API agrees ` +
            `("${before.status}" before the reload)`
        );
      } else {
        fail(
          'reloaded status matches the API',
          `${labelOf(before)} paints "${after.status}" but the API says "${serverStatus}" — the ` +
            'reload replayed a held answer instead of the decision that has since been made.'
        );
      }
    }

    console.log(
      `\nrequests to ${SEARCH_ENDPOINT}: ${firstLoadRequests} on first load, ${reloadRequests} on ` +
        `reload (${CACHE_STATE_HEADER} ${reloadCacheStates.join(', ') || 'unseen'})`
    );
  } finally {
    await context.close();
  }
}

const watchdog = setTimeout(() => {
  console.log(`FAIL  harness — timed out after ${WATCHDOG_MS}ms without finishing.`);
  process.exit(2);
}, WATCHDOG_MS);

const browser = await chromium.launch({ headless: true });

try {
  console.log(
    `approval-freshness: ${baseUrl}${applicationsPath} as ${domain} (${storageStatePath})\n`
  );
  await runOrgCheck(browser);
} catch (error) {
  fail('harness', String(error?.message ?? error).slice(0, 300));
} finally {
  await browser.close();
  clearTimeout(watchdog);
}

const failed = results.filter(result => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed.`);
process.exit(failed.length ? 1 : 0);
