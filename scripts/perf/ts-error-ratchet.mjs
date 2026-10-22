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
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const CEILING_FILE = new URL('./ts-error-ceiling.txt', import.meta.url);
const require = createRequire(import.meta.url);
const TSC_PATH = require.resolve('typescript/bin/tsc');

let output = '';
try {
  // This project exceeds Node's default heap. Apply the larger limit directly to
  // the compiler process so both pnpm and direct script invocations use it.
  output = execFileSync(
    process.execPath,
    ['--max-old-space-size=6144', TSC_PATH, '--noEmit', '--pretty', 'false', '-p', 'tsconfig.json'],
    {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
} catch (error) {
  output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
  if (error.signal || !/error TS\d+/.test(output)) {
    console.error(output || error.message);
    console.error('✖ TypeScript did not complete; the error ceiling was not checked.');
    process.exit(1);
  }
}

// Generated route types under .next drift with the last build, so a repo with a warm
// .next counts differently from a fresh checkout. Count source errors only.
const sourceLines = output
  .split('\n')
  .filter(line => /error TS\d+/.test(line) && !line.startsWith('.next/'));
const count = sourceLines.length;
// The file keeps the number on the first line and the story behind it underneath, so a
// raised ceiling always says which merge raised it.
const ceilingFile = fs.readFileSync(CEILING_FILE, 'utf8');
const ceiling = Number(ceilingFile.split('\n')[0].trim());

if (process.argv.includes('--update')) {
  const note = ceilingFile.split('\n').slice(1).join('\n');
  fs.writeFileSync(CEILING_FILE, `${count}\n${note}`);
  console.log(`Ceiling updated: ${ceiling} → ${count}`);
  process.exit(0);
}

if (count > ceiling) {
  console.error(sourceLines.join('\n'));
  console.error(`✖ tsc errors: ${count} (ceiling ${ceiling}) — new type errors were introduced.`);
  process.exit(1);
}

console.log(`✓ tsc errors: ${count} (ceiling ${ceiling})`);
if (count < ceiling) {
  console.log(`  You reduced the count — lock it in: node scripts/perf/ts-error-ratchet.mjs --update`);
}
