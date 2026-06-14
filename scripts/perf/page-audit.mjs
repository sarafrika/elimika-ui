#!/usr/bin/env node
/**
 * Authenticated per-page performance audit.
 *
 * For every page in the audit list, measures against a running server:
 *   - API request count (everything through /api/proxy + direct API hosts)
 *   - time-to-data: last API response settled before the network went quiet
 *   - JS transferred (bytes over the wire, all script responses)
 *   - DOMContentLoaded / load timings, long tasks (main-thread blocking)
 *   - console errors
 *
 * Usage:
 *   node scripts/perf/login.mjs                       # once, saves .perf/auth.json
 *   node scripts/perf/page-audit.mjs [baseUrl]        # audit, prints table
 *   node scripts/perf/page-audit.mjs --json out.json  # also write JSON
 *
 * Each page is visited twice: cold (fresh context cache) and warm (client-side
 * re-navigation), since React Query caching makes the two very different.
 */
import fs from 'node:fs';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const baseUrl = args.find(a => a.startsWith('http')) ?? 'http://localhost:3000';
const jsonIdx = args.indexOf('--json');
const jsonPath = jsonIdx >= 0 ? args[jsonIdx + 1] : null;
const domainIdx = args.indexOf('--domain');
const domain = domainIdx >= 0 ? args[domainIdx + 1] : null;
const pagesIdx = args.indexOf('--pages');
const pagesArg = pagesIdx >= 0 ? args[pagesIdx + 1] : null;

let AUTH_STATE = '.perf/auth.json';
if (!fs.existsSync(AUTH_STATE)) {
  console.error(`Missing ${AUTH_STATE} — run scripts/perf/login.mjs first.`);
  process.exit(1);
}

if (domain) {
  // The captured session contains its own elimika-active-dashboard cookie,
  // which wins over context.addCookies — rewrite it in the storage state.
  const state = JSON.parse(fs.readFileSync(AUTH_STATE, 'utf8'));
  state.cookies = (state.cookies ?? []).filter(c => c.name !== 'elimika-active-dashboard');
  state.cookies.push({
    name: 'elimika-active-dashboard',
    value: domain,
    domain: 'localhost',
    path: '/',
    expires: Math.floor(Date.now() / 1000) + 86_400,
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  });
  // The app's own localStorage (dashboard view/domain memory) can override
  // the cookie during bootstrap — drop it, keep only the auth cookies.
  state.origins = (state.origins ?? []).filter(o => !o.origin.includes('localhost'));
  AUTH_STATE = `.perf/auth-${domain}.json`;
  fs.writeFileSync(AUTH_STATE, JSON.stringify(state));
}

/** Default pages; override with --pages <file-with-one-path-per-line | comma list>. */
let PAGES = [
  '/dashboard/overview',
  '/dashboard/students',
  '/dashboard/training-hub',
  '/dashboard/classes',
  '/dashboard/trainings',
  '/dashboard/calendar',
  '/dashboard/profile/general',
  '/dashboard/reviews',
];
if (pagesArg) {
  PAGES = fs.existsSync(pagesArg)
    ? fs.readFileSync(pagesArg, 'utf8').split('\n').map(l => l.trim()).filter(Boolean)
    : pagesArg.split(',').map(p => p.trim()).filter(Boolean);
}

const QUIET_MS = Number(process.env.AUDIT_QUIET_MS ?? 2500); // network considered settled after this much silence
const HARD_CAP_MS = 45_000;

const isApiRequest = url =>
  url.includes('/api/proxy/') || url.includes('api.elimika') || url.includes('/api/v1/');

async function auditPage(context, path) {
  const page = await context.newPage();
  const apiRequests = [];
  const consoleErrors = [];
  let jsBytes = 0;
  let jsCount = 0;
  let lastActivity = Date.now();

  page.on('request', req => {
    lastActivity = Date.now();
    if (isApiRequest(req.url())) {
      apiRequests.push({ url: req.url(), start: Date.now(), end: null, status: null });
    }
  });
  page.on('response', async res => {
    lastActivity = Date.now();
    const entry = apiRequests.findLast(r => r.url === res.url() && r.end === null);
    if (entry) {
      entry.end = Date.now();
      entry.status = res.status();
    }
    const type = res.headers()['content-type'] ?? '';
    if (type.includes('javascript')) {
      jsCount += 1;
      try {
        const sizes = await res.request().sizes();
        jsBytes += sizes.responseBodySize > 0 ? sizes.responseBodySize : (await res.body()).length;
      } catch {
        /* response may be unavailable after navigation */
      }
    }
  });
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200));
  });

  const navStart = Date.now();
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded', timeout: HARD_CAP_MS });

  // Wait until the network has been quiet for QUIET_MS (or hard cap)
  while (Date.now() - lastActivity < QUIET_MS && Date.now() - navStart < HARD_CAP_MS) {
    await page.waitForTimeout(250);
  }

  const navTiming = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const longTasks = performance
      .getEntriesByType('longtask')
      .reduce((s, t) => s + t.duration, 0);
    return {
      domContentLoaded: Math.round(nav?.domContentLoadedEventEnd ?? 0),
      load: Math.round(nav?.loadEventEnd ?? 0),
      longTaskMs: Math.round(longTasks),
    };
  });

  const settled = apiRequests.filter(r => r.end);
  const timeToData = settled.length
    ? Math.max(...settled.map(r => r.end)) - navStart
    : null;
  const failed = settled.filter(r => r.status >= 400);
  const finalUrl = page.url();

  await page.close();

  return {
    path,
    finalUrl: finalUrl.replace(baseUrl, ''),
    apiRequests: apiRequests.length,
    failedRequests: failed.length,
    timeToDataMs: timeToData,
    jsTransferredKB: Math.round(jsBytes / 1024),
    jsFiles: jsCount,
    domContentLoadedMs: navTiming.domContentLoaded,
    longTaskMs: navTiming.longTaskMs,
    consoleErrors: consoleErrors.length,
    consoleErrorSamples: consoleErrors.slice(0, 3),
    apiUrls: apiRequests.map(r => r.url.replace(/^.*\/api\/proxy/, '').split('?')[0]),
    slowestRequests: settled
      .map(r => ({
        url: r.url.replace(/^.*\/api\/proxy/, '').split('?')[0],
        ms: r.end - r.start,
        status: r.status,
      }))
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 5),
  };
}

const browser = await chromium.launch({ headless: true });
const results = [];

for (const path of PAGES) {
  // Cold: fresh context per page (no HTTP cache, no React Query cache)
  const context = await browser.newContext({ storageState: AUTH_STATE });
  try {
    process.stderr.write(`auditing ${path} ...\n`);
    results.push(await auditPage(context, path));
  } catch (error) {
    results.push({ path, error: String(error).slice(0, 200) });
  } finally {
    await context.close();
  }
}

await browser.close();

const fmt = v => (v === null || v === undefined ? '—' : v);
console.log('\n| Page | API reqs | Failed | Time-to-data | JS (KB) | Long tasks | Console errors |');
console.log('|---|---|---|---|---|---|---|');
for (const r of results) {
  if (r.error) {
    console.log(`| ${r.path} | ERROR: ${r.error} ||||||`);
    continue;
  }
  const redirected = r.finalUrl.split('?')[0] !== r.path ? ` → ${r.finalUrl.split('?')[0]}` : '';
  console.log(
    `| ${r.path}${redirected} | ${r.apiRequests} | ${r.failedRequests} | ${fmt(r.timeToDataMs)} ms | ${r.jsTransferredKB} | ${r.longTaskMs} ms | ${r.consoleErrors} |`
  );
}

if (jsonPath) {
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\nDetails written to ${jsonPath}`);
}
