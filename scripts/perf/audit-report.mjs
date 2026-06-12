#!/usr/bin/env node
/**
 * Merge per-domain page-audit JSON files into one ranked findings report.
 *
 * Usage: node scripts/perf/audit-report.mjs docs/perf/audit-*-<date>.json
 */
import fs from 'node:fs';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/perf/audit-report.mjs <audit-json...>');
  process.exit(1);
}

const rows = [];
for (const file of files) {
  const domain = file.match(/audit-([a-z_]+)-/)?.[1] ?? file;
  for (const r of JSON.parse(fs.readFileSync(file, 'utf8'))) {
    rows.push({ domain, ...r });
  }
}

const ok = rows.filter(r => !r.error);
const broken = rows.filter(r => r.error);

const fmtMs = v => (v === null || v === undefined ? '—' : `${(v / 1000).toFixed(1)}s`);

console.log(`# Full dashboard audit — ${new Date().toISOString().slice(0, 10)}`);
console.log(`\nPages audited: ${rows.length} (${broken.length} failed to load)\n`);

const med = arr => [...arr].sort((a, b) => a - b)[Math.floor(arr.length / 2)];
console.log('## Summary by domain\n');
console.log('| Domain | Pages | Median time-to-data | Median API reqs | Pages > 5s | Pages > 20 reqs | Pages w/ failed reqs |');
console.log('|---|---|---|---|---|---|---|');
for (const domain of [...new Set(ok.map(r => r.domain))]) {
  const d = ok.filter(r => r.domain === domain);
  const ttd = d.filter(r => r.timeToDataMs !== null).map(r => r.timeToDataMs);
  console.log(
    `| ${domain} | ${d.length} | ${fmtMs(med(ttd))} | ${med(d.map(r => r.apiRequests))} | ${d.filter(r => (r.timeToDataMs ?? 0) > 5000).length} | ${d.filter(r => r.apiRequests > 20).length} | ${d.filter(r => r.failedRequests > 0).length} |`
  );
}

console.log('\n## Slowest pages (time-to-data)\n');
console.log('| Domain | Page | Time-to-data | API reqs | Failed |');
console.log('|---|---|---|---|---|');
for (const r of [...ok].sort((a, b) => (b.timeToDataMs ?? 0) - (a.timeToDataMs ?? 0)).slice(0, 20)) {
  console.log(`| ${r.domain} | ${r.path} | ${fmtMs(r.timeToDataMs)} | ${r.apiRequests} | ${r.failedRequests} |`);
}

console.log('\n## Request storms (most API requests)\n');
console.log('| Domain | Page | API reqs | Dominant repeated endpoint |');
console.log('|---|---|---|---|');
for (const r of [...ok].sort((a, b) => b.apiRequests - a.apiRequests).slice(0, 20)) {
  const counts = {};
  for (const u of r.apiUrls ?? []) {
    const generic = u.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/g, '{id}');
    counts[generic] = (counts[generic] ?? 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  console.log(`| ${r.domain} | ${r.path} | ${r.apiRequests} | ${top ? `${top[1]}× ${top[0]}` : '—'} |`);
}

console.log('\n## Slowest individual endpoints (p-worst observed)\n');
const endpointWorst = new Map();
for (const r of ok) {
  for (const s of r.slowestRequests ?? []) {
    const generic = s.url.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/g, '{id}');
    if (!endpointWorst.has(generic) || endpointWorst.get(generic).ms < s.ms) {
      endpointWorst.set(generic, { ...s, page: `${r.domain} ${r.path}` });
    }
  }
}
console.log('| Endpoint | Worst observed | Status | Seen on |');
console.log('|---|---|---|---|');
for (const [url, s] of [...endpointWorst.entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 15)) {
  console.log(`| ${url} | ${fmtMs(s.ms)} | ${s.status} | ${s.page} |`);
}

console.log('\n## Failing requests / console errors\n');
console.log('| Domain | Page | Failed reqs | Console errors | Sample |');
console.log('|---|---|---|---|---|');
for (const r of ok.filter(r => r.failedRequests > 0 || r.consoleErrors > 0).sort((a, b) => b.consoleErrors - a.consoleErrors).slice(0, 20)) {
  console.log(
    `| ${r.domain} | ${r.path} | ${r.failedRequests} | ${r.consoleErrors} | ${(r.consoleErrorSamples?.[0] ?? '').replace(/\|/g, '\\|').slice(0, 90)} |`
  );
}

if (broken.length) {
  console.log('\n## Pages that failed to load\n');
  for (const r of broken) console.log(`- ${r.domain} ${r.path}: ${r.error}`);
}
