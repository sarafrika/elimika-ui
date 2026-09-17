#!/usr/bin/env node
/**
 * Admin boundary guard.
 *
 * The admin console was rebuilt from scratch. These rules keep the old shape from
 * creeping back:
 *   1. Nothing outside the admin console imports admin code — shared parts live in
 *      components/ or src/features/<domain>/ instead.
 *   2. Retired route names never return (they were merged into the new sections).
 *   3. Every file under the admin console is reachable from a route.
 *   4. No @ts-nocheck under admin paths.
 *   5. Every admin route ships a loading.tsx.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const ROUTE_DIR = 'app/dashboard/admin';
const FEATURE_DIR = 'src/features/admin';
const SCAN_DIRS = ['app', 'components', 'src', 'hooks', 'lib', 'services', 'context'];
const CODE = /\.(ts|tsx)$/;

/** Routes the rebuild retired. Their work moved into the sections named alongside. */
const RETIRED_ROUTES = {
  'pending-approvals': 'inbox',
  verifications: 'inbox',
  moderation: 'inbox',
  users: 'people',
  students: 'people',
  instructors: 'people',
  'course-creators': 'people',
  administrators: 'access',
  organizations: 'organisations',
  'manage-courses': 'courses',
  'manage-programs': 'programs',
  'course-management': 'courses',
  'all-courses': 'courses',
  calendar: 'classes',
  'financial-overview': 'revenue',
  transactions: 'sales',
  'system-config': 'platform/rules',
  'messaging-notifications': 'notifications',
  opportunities: 'marketplace',
  support: 'help in the sidebar',
  branches: 'organisations/[uuid]',
};

const problems = [];

function walk(dir, files = []) {
  let entries;
  try {
    entries = readdirSync(join(ROOT, dir));
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const rel = join(dir, entry);
    const stats = statSync(join(ROOT, rel));
    if (stats.isDirectory()) walk(rel, files);
    else if (CODE.test(entry)) files.push(rel);
  }
  return files;
}

const allFiles = SCAN_DIRS.flatMap(dir => walk(dir));
const adminFiles = allFiles.filter(file => file.startsWith(ROUTE_DIR) || file.startsWith(FEATURE_DIR));
const outsideFiles = allFiles.filter(file => !adminFiles.includes(file));
const read = file => readFileSync(join(ROOT, file), 'utf8');

// 1. Nothing outside imports admin code.
const ADMIN_IMPORT = /from\s+['"]([^'"]*(?:dashboard\/admin|features\/admin)[^'"]*)['"]/g;
for (const file of outsideFiles) {
  const source = read(file);
  for (const match of source.matchAll(ADMIN_IMPORT)) {
    problems.push(`${file}: imports admin code (${match[1]}) — move the shared part out instead`);
  }
}

// 2. Retired route names never return.
const adminDirs = new Set();
(function collect(dir) {
  let entries;
  try {
    entries = readdirSync(join(ROOT, dir), { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    adminDirs.add(entry.name);
    collect(join(dir, entry.name));
  }
})(ROUTE_DIR);

for (const [name, replacement] of Object.entries(RETIRED_ROUTES)) {
  if (adminDirs.has(name)) {
    problems.push(`${ROUTE_DIR}/${name}: retired route name — this section is now "${replacement}"`);
  }
}

const RETIRED_LINK = new RegExp(
  `/dashboard/admin/(${Object.keys(RETIRED_ROUTES).join('|')})(?![\\w-])`,
  'g'
);
for (const file of allFiles) {
  if (file === relative(ROOT, import.meta.filename)) continue;
  for (const match of read(file).matchAll(RETIRED_LINK)) {
    problems.push(
      `${file}: links to retired route ${match[0]} — use /dashboard/admin/${RETIRED_ROUTES[match[1]]}`
    );
  }
}

// 3. Every admin file is reachable from a route.
const ENTRY = /(page|layout|loading|error|not-found|route|template|default)\.tsx?$/;
/** A unit test counts as a reason for a file to exist while its screen is still being built. */
const TEST_FILE = /\.test\.tsx?$/;
/** Foundation modules may wait for the screen that uses them; they say so in a comment. */
const FOUNDATION = '// admin-boundary: foundation';
const entries = adminFiles.filter(file => ENTRY.test(file) || TEST_FILE.test(file));
const reachable = new Set(entries);
const queue = [...entries];

const resolveImport = (fromFile, spec) => {
  let base;
  if (spec.startsWith('@/')) base = spec.slice(2);
  else if (spec.startsWith('./') || spec.startsWith('../'))
    base = relative(ROOT, resolve(ROOT, fromFile, '..', spec));
  else return null;

  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ]) {
    if (adminFiles.includes(candidate)) return candidate;
  }
  return null;
};

while (queue.length) {
  const file = queue.pop();
  const source = read(file);
  for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const target = resolveImport(file, match[1]);
    if (target && !reachable.has(target)) {
      reachable.add(target);
      queue.push(target);
    }
  }
  for (const match of source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    const target = resolveImport(file, match[1]);
    if (target && !reachable.has(target)) {
      reachable.add(target);
      queue.push(target);
    }
  }
}

for (const file of adminFiles) {
  if (reachable.has(file)) continue;
  if (read(file).includes(FOUNDATION)) continue;
  problems.push(
    `${file}: not reachable from a route or a test — wire it up, delete it, or mark it "${FOUNDATION}"`
  );
}

// 4. No @ts-nocheck under admin paths.
for (const file of adminFiles) {
  if (read(file).includes('@ts-nocheck')) {
    problems.push(`${file}: @ts-nocheck is not allowed in the admin console`);
  }
}

// 5. Every admin route ships a loading.tsx.
for (const file of adminFiles) {
  if (!file.startsWith(ROUTE_DIR) || !/\/page\.tsx?$/.test(file)) continue;
  const dir = file.replace(/\/page\.tsx?$/, '');
  const hasLoading = adminFiles.some(candidate => candidate === `${dir}/loading.tsx`);
  const isRedirectOnly = /redirect\(/.test(read(file)) && !/return\s*\(/.test(read(file));
  if (!hasLoading && !isRedirectOnly) {
    problems.push(`${dir}: route has no loading.tsx — every admin route needs its skeleton`);
  }
}

if (problems.length) {
  console.error(`check-admin-boundary: ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(
    '\nThe admin console owns its own code. Shared parts belong in components/data-display\n' +
      'or the feature that uses them, and retired route names stay retired.'
  );
  process.exit(1);
}

console.log(
  `check-admin-boundary: clean — ${adminFiles.length} admin file(s), no outside imports, no retired routes.`
);
