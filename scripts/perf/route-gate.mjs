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
const baselinePath = flag('--baseline') ?? 'docs/perf/route-gate-baseline.json';
const jsonPath = flag('--json');
const domain = flag('--domain');
const runs = Math.max(1, Number(flag('--runs') ?? 3));
const defaultBudget = Number(flag('--budget') ?? 12);
const maxRegression = Number(flag('--max-regression') ?? 0.15);
const minDeltaMs = Number(flag('--min-delta-ms') ?? 0);
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
  storageState = `.perf/route-gate-auth-${domain}.json`;
  fs.writeFileSync(storageState, JSON.stringify(state));
}

/** Routes come from a JSON array (strings or { path, budget }), a text file, or a comma list. */
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
  return entries.map(e => (typeof e === 'string' ? { path: e } : e)).map(e => ({
    path: e.path,
    budget: Number(e.budget ?? defaultBudget),
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
      requests.push({ key: `${req.method()} ${req.url()}`, url: req.url(), end: null, status: null });
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
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded', timeout: HARD_CAP_MS });
    while (Date.now() - lastActivity < QUIET_MS && Date.now() - navStart < HARD_CAP_MS) {
      await page.waitForTimeout(250);
    }
    const finalUrl = page.url();
    const settled = requests.filter(r => r.end !== null);
    // A retried 4xx: the same method + URL requested again after a 4xx response.
    const retried = new Set();
    requests.forEach((r, i) => {
      if (r.status >= 400 && r.status < 500 && requests.slice(i + 1).some(n => n.key === r.key)) {
        retried.add(`${r.status} ${label(r.key)}`);
      }
    });
    return {
      finalUrl,
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
  }
  const requests = Math.max(...samples.map(s => s.requests));
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
