#!/usr/bin/env node
/**
 * Per-route First-Load JS report from a Turbopack analysis run.
 *
 * Usage:
 *   npx next experimental-analyze -o   # writes .next/diagnostics/route-bundle-stats.json
 *   node scripts/perf/route-sizes.mjs [--json] [--top N] [--compare <previous.json>]
 *   node scripts/perf/route-sizes.mjs --budget docs/perf/route-js-budget.json
 *
 * --compare diffs against a previously saved `--json` output and flags
 * regressions, so CI or a reviewer can gate on First-Load JS growth.
 * --budget checks every route and the shared shell against docs/perf/route-js-budget.json.
 * Next 16.2 writes route-bundle-stats.json during `next build`, not experimental-analyze.
 */
import fs from 'node:fs';
import zlib from 'node:zlib';

const STATS_PATH = '.next/diagnostics/route-bundle-stats.json';
if (!fs.existsSync(STATS_PATH)) {
  console.error(`Missing ${STATS_PATH} — run: npx next experimental-analyze -o`);
  process.exit(1);
}

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const topN = args.includes('--top') ? Number(args[args.indexOf('--top') + 1]) : Infinity;
const compareIdx = args.indexOf('--compare');
const comparePath = compareIdx >= 0 ? args[compareIdx + 1] : null;
const budgetIdx = args.indexOf('--budget');
const budgetPath = budgetIdx >= 0 ? args[budgetIdx + 1] : null;

const stats = JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'));
const rows = stats
  .map(r => {
    let gzip = 0;
    for (const p of r.firstLoadChunkPaths ?? []) {
      try {
        gzip += zlib.gzipSync(fs.readFileSync(p)).length;
      } catch {
        /* chunk may have been pruned; raw size still reported */
      }
    }
    return { route: r.route, raw: r.firstLoadUncompressedJsBytes, gzip };
  })
  .sort((a, b) => b.raw - a.raw);

if (asJson) {
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

const mb = b => `${(b / 1048576).toFixed(2)} MB`;
const kb = b => `${(b / 1024).toFixed(0)} KB`;

if (budgetPath) {
  const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));
  const MiB = 1048576;
  // The shell is every chunk shared by at least shell.minShare of routes.
  const seen = new Map();
  for (const r of stats) for (const p of r.firstLoadChunkPaths ?? []) seen.set(p, (seen.get(p) ?? 0) + 1);
  let shell = 0;
  for (const [p, n] of seen) {
    if (n >= stats.length * budget.shell.minShare) shell += fs.existsSync(p) ? fs.statSync(p).size : 0;
  }
  const failures = [];
  if (shell > budget.shell.budgetMB * MiB) failures.push(`shell ${mb(shell)} > ${budget.shell.budgetMB} MB`);
  const groups = budget.groups.map(g => ({ ...g, re: new RegExp(g.match) }));
  const counts = new Map();
  for (const r of rows) {
    const g = groups.find(x => x.re.test(r.route));
    counts.set(g.name, (counts.get(g.name) ?? 0) + 1);
    if (r.raw > g.budgetMB * MiB) failures.push(`${r.route} ${mb(r.raw)} > ${g.budgetMB} MB (${g.name})`);
  }
  console.log(`shell ${mb(shell)} (budget ${budget.shell.budgetMB} MB, target ${budget.shell.targetMB} MB)`);
  for (const g of groups) console.log(`${g.name}: ${counts.get(g.name) ?? 0} routes, budget ${g.budgetMB} MB`);
  for (const f of failures) console.log(`  ✖ ${f}`);
  console.log(failures.length ? `${failures.length} over budget` : 'all routes within budget');
  process.exit(failures.length ? 1 : 0);
}

if (comparePath) {
  const prev = new Map(JSON.parse(fs.readFileSync(comparePath, 'utf8')).map(r => [r.route, r]));
  let regressions = 0;
  for (const r of rows.slice(0, topN)) {
    const old = prev.get(r.route);
    if (!old) continue;
    const delta = r.raw - old.raw;
    const pct = (delta / old.raw) * 100;
    if (Math.abs(pct) < 1) continue;
    const flag = pct > 5 ? '  ⚠ REGRESSION' : '';
    if (pct > 5) regressions++;
    console.log(
      `${mb(old.raw)} → ${mb(r.raw)} (${pct > 0 ? '+' : ''}${pct.toFixed(1)}%)  ${r.route}${flag}`
    );
  }
  process.exit(regressions > 0 ? 1 : 0);
}

console.log('First-Load JS per route (raw / gzip):');
for (const r of rows.slice(0, topN)) {
  console.log(`${mb(r.raw).padStart(9)}  ${kb(r.gzip).padStart(8)}  ${r.route}`);
}
const median = rows[Math.floor(rows.length / 2)];
console.log(`\n${rows.length} routes — median ${mb(median.raw)} (${median.route})`);
