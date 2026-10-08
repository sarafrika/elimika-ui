#!/usr/bin/env node
// CI performance gate: request budget, retried 4xx, %7B placeholders, time-to-data P95.
// Needs a session from scripts/perf/login.mjs. Usage and flags: docs/perf/route-gate.md.
import fs from 'node:fs';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const flag = name => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const baseUrl = (args.find(a => a.startsWith('http')) ?? 'http://localhost:3000').replace(/\/$/, '');
const routesArg = flag('--routes') ?? 'scripts/perf/route-gate.routes.json';
const jsonPath = flag('--json');
const domain = flag('--domain');
const baselinePath =
  flag('--baseline') ?? `docs/perf/route-gate-baseline${domain ? `-${domain}` : ''}.json`;
const runs = Math.max(1, Number(flag('--runs') ?? 5));
const defaultBudget = Number(flag('--budget') ?? 12);
const maxRegression = Number(flag('--max-regression') ?? 0.15);
const minDeltaMs = Number(flag('--min-delta-ms') ?? 250);
const updateBaseline = args.includes('--update-baseline');
let storageState = flag('--storage-state') ?? '.perf/auth.json';

const QUIET_MS = Number(process.env.GATE_QUIET_MS ?? 2500);
const HARD_CAP_MS = 45_000;

if (!fs.existsSync(storageState)) {
  console.error(`route-gate: missing ${storageState} — run scripts/perf/login.mjs first.`);
  process.exit(1);
}

if (domain) {
  // The saved session carries its own active-dashboard cookie and localStorage; pin the domain.
  const state = JSON.parse(fs.readFileSync(storageState, 'utf8'));
  const host = new URL(baseUrl).hostname;
  state.cookies = (state.cookies ?? []).filter(c => c.name !== 'elimika-active-dashboard');
  state.cookies.push({
    name: 'elimika-active-dashboard',
    value: domain,
    domain: host,
    path: '/',
    expires: Math.floor(Date.now() / 1000) + 86_400,
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  });
  state.origins = (state.origins ?? []).filter(o => !o.origin.includes(host));
  fs.mkdirSync('.perf', { recursive: true });
  storageState = `.perf/route-gate-auth-${domain}-${process.pid}.json`;
  fs.writeFileSync(storageState, JSON.stringify(state));
}

// Mirrors DOMAIN_TO_SEGMENT in src/features/dashboard/lib/dashboard-url.ts.
const DOMAIN_SEGMENT = {
  student: 'student',
  instructor: 'instructor',
  admin: 'admin',
  parent: 'parent',
  course_creator: 'course-creator',
  organisation: 'organisation',
  organisation_user: 'organisation',
};
const gateDomain = domain ?? 'instructor';
const toPath = p => (p.startsWith('/') ? p : `/dashboard/${DOMAIN_SEGMENT[gateDomain]}/${p}`);

/** Routes: JSON array or { <domain>: [...] } map, a text file, or a comma list; bare paths are role-scoped. */
function loadRoutes(source) {
  let entries;
  if (fs.existsSync(source)) {
    const text = fs.readFileSync(source, 'utf8');
    entries = source.endsWith('.json')
      ? JSON.parse(text)
      : text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  } else {
    entries = source.split(',').map(p => p.trim()).filter(Boolean);
  }
  if (!Array.isArray(entries)) {
    if (!DOMAIN_SEGMENT[gateDomain] || !entries[gateDomain]) {
      console.error(`route-gate: no route list for domain "${gateDomain}" in ${source}.`);
      process.exit(1);
    }
    entries = entries[gateDomain];
  }
  return entries.map(e => (typeof e === 'string' ? { path: e } : e)).map(e => ({
    path: toPath(e.path),
    budget: Number(e.budget ?? defaultBudget),
    allowRedirect: Boolean(e.allowRedirect),
  }));
}

const isApiRequest = url =>
  !url.includes('/api/auth/') &&
  (url.includes('/api/proxy/') || url.includes('api.elimika') || url.includes('/api/v1/'));
const hasPlaceholder = url => /%7B|%7D|[{}]/i.test(url);
const label = url => url.replace(/^.*\/api\/proxy/, '').replace(/^https?:\/\/[^/]+/, '');

const percentile = (values, p) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
};

async function measure(browser, path) {
  // Fresh context per run: the persisted query cache would otherwise measure a warm visit.
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();
  const requests = [];
  let lastActivity = Date.now();

  page.on('request', req => {
    lastActivity = Date.now();
    if (isApiRequest(req.url())) {
      requests.push({
        key: `${req.method()} ${req.url()}`,
        url: req.url(),
        start: Date.now(),
        end: null,
        status: null,
      });
    }
  });
  page.on('response', res => {
    lastActivity = Date.now();
    const key = `${res.request().method()} ${res.url()}`;
    const entry = requests.find(r => r.key === key && r.end === null);
    if (entry) {
      entry.end = Date.now();
      entry.status = res.status();
    }
  });
  page.on('requestfailed', () => {
    lastActivity = Date.now();
  });

  const navStart = Date.now();
  try {
    const doc = await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded', timeout: HARD_CAP_MS });
    while (Date.now() - lastActivity < QUIET_MS && Date.now() - navStart < HARD_CAP_MS) {
      await page.waitForTimeout(250);
    }
    const finalUrl = page.url();
    const settled = requests.filter(r => r.end !== null);
    // A retried 4xx: the same method + URL started again after the 4xx response arrived.
    const retried = new Set();
    requests.forEach(r => {
      if (r.status >= 400 && r.status < 500 && requests.some(n => n !== r && n.key === r.key && n.start >= r.end)) {
        retried.add(`${r.status} ${label(r.key)}`);
      }
    });
    return {
      finalUrl,
      status: doc?.status() ?? null,
      requests: requests.length,
      timeToDataMs: settled.length ? Math.max(...settled.map(r => r.end)) - navStart : null,
      retried4xx: [...retried],
      placeholders: [...new Set(requests.filter(r => hasPlaceholder(r.url)).map(r => label(r.key)))],
    };
  } finally {
    await context.close();
  }
}

const routes = loadRoutes(routesArg);
const baseline = fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, 'utf8')) : null;
if (!baseline) console.error(`route-gate: no baseline at ${baselinePath}; P95 regression is not checked.`);
const browser = await chromium.launch({ headless: true });
const failures = [];
const results = [];
const allSamples = [];

for (const route of routes) {
  const samples = [];
  process.stderr.write(`gating ${route.path} `);
  for (let i = 0; i < runs; i++) {
    try {
      samples.push(await measure(browser, route.path));
      process.stderr.write('.');
    } catch (error) {
      failures.push(`${route.path}: failed to load — ${String(error).slice(0, 160)}`);
      break;
    }
  }
  process.stderr.write('\n');
  if (!samples.length) continue;

  const finalPath = new URL(samples[0].finalUrl).pathname;
  if (!samples[0].finalUrl.startsWith(baseUrl)) {
    failures.push(`${route.path}: left the app (${samples[0].finalUrl}) — is the session still valid?`);
  } else if (finalPath !== route.path && !route.allowRedirect) {
    failures.push(`${route.path}: redirected to ${finalPath} (set "allowRedirect": true if expected)`);
  }
  const badStatus = samples.find(s => s.status !== null && s.status >= 400);
  if (badStatus) failures.push(`${route.path}: document returned HTTP ${badStatus.status}`);
  const requests = Math.max(...samples.map(s => s.requests));
  if (requests === 0) {
    failures.push(`${route.path}: 0 API requests — the page likely did not render real data`);
  }
  const ttd = samples.map(s => s.timeToDataMs).filter(v => v !== null);
  const p95 = percentile(ttd, 95);
  allSamples.push(...ttd);
  const retried4xx = [...new Set(samples.flatMap(s => s.retried4xx))];
  const placeholders = [...new Set(samples.flatMap(s => s.placeholders))];

  if (requests > route.budget) {
    failures.push(`${route.path}: ${requests} API requests > budget ${route.budget}`);
  }
  for (const r of retried4xx) failures.push(`${route.path}: 4xx retried — ${r}`);
  for (const u of placeholders) failures.push(`${route.path}: unfilled path placeholder — ${u}`);

  const baseP95 = baseline?.routes?.[route.path]?.p95TimeToDataMs ?? null;
  let regression = null;
  if (!updateBaseline && baseP95 && p95 !== null) {
    regression = (p95 - baseP95) / baseP95;
    if (regression > maxRegression && p95 - baseP95 > minDeltaMs) {
      failures.push(
        `${route.path}: time-to-data P95 ${p95} ms vs baseline ${baseP95} ms (+${Math.round(regression * 100)}%)`
      );
    }
  }

  results.push({
    path: route.path,
    finalPath,
    budget: route.budget,
    requests,
    p95TimeToDataMs: p95,
    baselineP95Ms: baseP95,
    regression,
    retried4xx,
    placeholders,
  });
}

await browser.close();
if (domain) fs.rmSync(storageState, { force: true });

const overallP95 = percentile(allSamples, 95);
const baseOverall = baseline?.overallP95TimeToDataMs ?? null;
if (!updateBaseline && baseOverall && overallP95 !== null && overallP95 > baseOverall * (1 + maxRegression)) {
  if (overallP95 - baseOverall > minDeltaMs) {
    failures.push(`overall time-to-data P95 ${overallP95} ms vs baseline ${baseOverall} ms`);
  }
}

const fmt = v => (v === null || v === undefined ? '—' : v);
const pct = v => (v === null ? '—' : `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`);
console.log(`\n| Route | Requests / budget | TTD P95 | Baseline | Δ | 4xx retried | %7B |`);
console.log('|---|---|---|---|---|---|---|');
for (const r of results) {
  const redirect = r.finalPath !== r.path ? ` → ${r.finalPath}` : '';
  console.log(
    `| ${r.path}${redirect} | ${r.requests} / ${r.budget} | ${fmt(r.p95TimeToDataMs)} ms | ${fmt(r.baselineP95Ms)} ms | ${pct(r.regression)} | ${r.retried4xx.length} | ${r.placeholders.length} |`
  );
}
console.log(`\nOverall time-to-data P95: ${fmt(overallP95)} ms (baseline ${fmt(baseOverall)} ms), ${runs} run(s) per route`);

const report = { baseUrl, runs, generatedAt: new Date().toISOString(), overallP95, results, failures };
if (jsonPath) fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

if (updateBaseline) {
  const next = {
    generatedAt: report.generatedAt,
    runs,
    overallP95TimeToDataMs: overallP95,
    routes: Object.fromEntries(
      results.map(r => [r.path, { p95TimeToDataMs: r.p95TimeToDataMs, requests: r.requests }])
    ),
  };
  fs.writeFileSync(baselinePath, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`Baseline written to ${baselinePath}`);
}

if (failures.length) {
  console.error(`\n✗ route-gate: ${failures.length} failure(s)`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('\n✓ route-gate: all routes within budget');
