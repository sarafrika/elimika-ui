#!/usr/bin/env node
// Runs `biome lint .` once; .biome-plugins guardrails are errors, and pre-programme debt keeps a
// per-file allowance in lint-guardrail-allowlist.json that may only shrink. Any extra diagnostic fails.
// Usage: node scripts/perf/lint-guardrails.mjs [--update]   (--update lowers allowances after a cleanup)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ALLOWLIST_FILE = new URL('./lint-guardrail-allowlist.json', import.meta.url);
const PLUGIN_DIR = '.biome-plugins';

// Map each plugin's diagnostic message back to its rule name (the .grit file name).
const ruleByMessage = new Map();
for (const file of fs.readdirSync(PLUGIN_DIR).filter(f => f.endsWith('.grit'))) {
  const source = fs.readFileSync(path.join(PLUGIN_DIR, file), 'utf8');
  for (const match of source.matchAll(/message\s*=\s*"((?:[^"\\]|\\.)*)"/g)) {
    ruleByMessage.set(JSON.parse(`"${match[1]}"`), file.replace(/\.grit$/, ''));
  }
}

const run = spawnSync('pnpm', ['exec', 'biome', 'lint', '.', '--reporter=json', '--max-diagnostics=none'], {
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 1024,
});
let report;
try {
  report = JSON.parse(run.stdout);
} catch {
  console.error('✖ lint-guardrails: biome did not return a JSON report.');
  console.error(run.stderr || run.stdout);
  process.exit(1);
}

const lineOf = d => {
  const offset = d.location?.span?.[0];
  const source = d.location?.sourceCode;
  if (offset === undefined || !source) return 1;
  return Buffer.from(source).subarray(0, offset).toString().split('\n').length;
};
const where = d => `${d.location?.path?.file ?? '?'}:${lineOf(d)}`;

const counts = {};
const byRuleFile = {};
const otherErrors = [];
const otherWarnings = [];
for (const d of report.diagnostics ?? []) {
  const rule = d.category === 'plugin' ? ruleByMessage.get(d.description) : undefined;
  if (!rule) {
    (d.severity === 'error' || d.severity === 'fatal' ? otherErrors : otherWarnings).push(d);
    continue;
  }
  const file = d.location?.path?.file ?? '?';
  counts[rule] ??= {};
  counts[rule][file] = (counts[rule][file] ?? 0) + 1;
  byRuleFile[`${rule}\u0000${file}`] ??= [];
  byRuleFile[`${rule}\u0000${file}`].push(d);
}

const sorted = obj => Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
const allowlistExists = fs.existsSync(ALLOWLIST_FILE);
const allowlist = allowlistExists ? JSON.parse(fs.readFileSync(ALLOWLIST_FILE, 'utf8')) : {};

if (process.argv.includes('--update') || !allowlistExists) {
  // Allowances only go down: a file never gains headroom, and new files never get any.
  const next = {};
  for (const [rule, files] of Object.entries(counts)) {
    for (const [file, count] of Object.entries(files)) {
      const allowed = allowlistExists ? Math.min(allowlist[rule]?.[file] ?? 0, count) : count;
      if (allowed > 0) {
        next[rule] ??= {};
        next[rule][file] = allowed;
      }
    }
  }
  const out = sorted(Object.fromEntries(Object.entries(next).map(([r, f]) => [r, sorted(f)])));
  fs.writeFileSync(ALLOWLIST_FILE, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`Allowlist written to ${new URL(ALLOWLIST_FILE).pathname}`);
  process.exit(0);
}

const failures = [];
for (const [rule, files] of Object.entries(counts)) {
  for (const [file, count] of Object.entries(files)) {
    const allowed = allowlist[rule]?.[file] ?? 0;
    if (count > allowed) {
      failures.push(`${rule}: ${file} has ${count} (allowed ${allowed})`);
      for (const d of byRuleFile[`${rule}\u0000${file}`]) failures.push(`    ${where(d)}  ${d.description}`);
    }
  }
}

for (const d of otherWarnings) console.warn(`⚠ ${where(d)}  ${d.category}: ${d.description}`);
for (const d of otherErrors) console.error(`✖ ${where(d)}  ${d.category}: ${d.description}`);

const ruleNames = [...new Set([...ruleByMessage.values()])].sort();
let reducible = false;
for (const rule of ruleNames) {
  const total = Object.values(counts[rule] ?? {}).reduce((a, b) => a + b, 0);
  const ceiling = Object.values(allowlist[rule] ?? {}).reduce((a, b) => a + b, 0);
  if (total < ceiling) reducible = true;
  console.log(`  ${rule}: ${total} legacy (ceiling ${ceiling})`);
}

if (failures.length) {
  console.error(`\n✖ lint-guardrails: new guardrail violations (see docs/perf/route-gate.md)`);
  for (const f of failures) console.error(`  ${f}`);
}
if (failures.length || otherErrors.length || (run.status !== 0 && !report.diagnostics?.length)) {
  process.exit(1);
}
console.log(`✓ biome lint: ${otherErrors.length} errors, guardrails within their allowances`);
if (reducible) {
  console.log('  You paid debt down — lock it in: node scripts/perf/lint-guardrails.mjs --update');
}
