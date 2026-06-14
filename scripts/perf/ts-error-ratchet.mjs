#!/usr/bin/env node
/**
 * TypeScript error ratchet. `typescript.ignoreBuildErrors` is enabled in
 * next.config.ts, so nothing stops new type errors from landing. This script
 * fails if the error count rises above the recorded ceiling, and invites you
 * to lower the ceiling when you reduce the count. Goal: ceiling reaches 0,
 * then flip ignoreBuildErrors to false and delete this script.
 *
 * Usage:  node scripts/perf/ts-error-ratchet.mjs           # check
 *         node scripts/perf/ts-error-ratchet.mjs --update  # lower ceiling
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const CEILING_FILE = new URL('./ts-error-ceiling.txt', import.meta.url);

let output = '';
try {
  output = execSync('pnpm exec tsc --noEmit -p tsconfig.json', {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
} catch (error) {
  output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
}

const count = (output.match(/error TS\d+/g) ?? []).length;
const ceiling = Number(fs.readFileSync(CEILING_FILE, 'utf8').trim());

if (process.argv.includes('--update')) {
  fs.writeFileSync(CEILING_FILE, `${count}\n`);
  console.log(`Ceiling updated: ${ceiling} → ${count}`);
  process.exit(0);
}

if (count > ceiling) {
  console.error(`✖ tsc errors: ${count} (ceiling ${ceiling}) — new type errors were introduced.`);
  process.exit(1);
}

console.log(`✓ tsc errors: ${count} (ceiling ${ceiling})`);
if (count < ceiling) {
  console.log(`  You reduced the count — lock it in: node scripts/perf/ts-error-ratchet.mjs --update`);
}
