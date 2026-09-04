import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const APP_DIR = resolve(ROOT, 'app');

const ROLE_SEGMENTS = new Set([
  'student',
  'instructor',
  'admin',
  'parent',
  'course-creator',
  'organisation',
]);

const ALIAS_HELPERS = ['roleScopedDashboardPath', 'dashboardUrl', 'buildDashboardSwitchPath'];

const EXCLUDED_PREFIXES = [
  'node_modules',
  '.next',
  'services/client',
  'src/features/dashboard/lib',
  'scripts',
];

const INCLUDED_DIRS = ['app', 'components', 'src', 'context', 'lib', 'hooks'];

function collectRoutes(dir, segments = []) {
  const routes = new Set();
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return routes;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const name = entry.name;
      if (name.startsWith('_')) continue;
      const next =
        name.startsWith('(') && name.endsWith(')') ? segments : [...segments, name];
      for (const route of collectRoutes(resolve(dir, name), next)) routes.add(route);
    } else if (/^page\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      routes.add(`/${segments.join('/')}`);
    }
  }

  return routes;
}

function routeMatches(routes, pathname) {
  const target = pathname.split('/').filter(Boolean);

  for (const route of routes) {
    const parts = route.split('/').filter(Boolean);
    const catchAllAt = parts.findIndex(p => p.startsWith('[...') || p.startsWith('[[...'));

    if (catchAllAt === -1) {
      if (parts.length !== target.length) continue;
    } else if (target.length < catchAllAt) {
      continue;
    }

    let ok = true;
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      if (part.startsWith('[...') || part.startsWith('[[...')) {
        ok = true;
        break;
      }
      if (part.startsWith('[') && part.endsWith(']')) continue;
      if (target[i] === '*') continue;
      if (part !== target[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }

  return false;
}

function collectFiles(dir) {
  const absDir = resolve(ROOT, dir);
  let entries;
  try {
    entries = readdirSync(absDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];

  for (const entry of entries) {
    const entryPath = resolve(absDir, entry.name);
    const relPath = relative(ROOT, entryPath);
    if (EXCLUDED_PREFIXES.some(prefix => relPath.startsWith(prefix))) continue;

    if (entry.isDirectory()) {
      files.push(...collectFiles(relPath));
    } else if (['.ts', '.tsx'].includes(extname(entry.name))) {
      files.push(relPath);
    }
  }

  return files;
}

function isAliasWrapped(contents, index) {
  const before = contents.slice(Math.max(0, index - 200), index);
  return ALIAS_HELPERS.some(helper => before.includes(`${helper}(`));
}

function lineOf(contents, index) {
  return contents.slice(0, index).split('\n').length;
}

function scan(files, routes) {
  const missingRoute = [];
  const barePath = [];

  const nav =
    '(?:[A-Za-z]*[Hh]ref\\s*=\\s*\\{?\\s*|(?:router|Router)\\.(?:push|replace|prefetch)\\(\\s*|\\bredirect\\(\\s*|\\bpermanentRedirect\\(\\s*)';
  const navigation = new RegExp(
    `${nav}(?:'(\\/dashboard[^']*)'|"(\\/dashboard[^"]*)"|\`(\\/dashboard(?:[^\`$]|\\$\\{[^}]*\\})*)\`)`,
    'g'
  );

  for (const file of files) {
    const contents = readFileSync(resolve(ROOT, file), 'utf8')
      .split('\n')
      .map(line => (/^\s*(\/\/|\*|\/\*)/.test(line) ? '' : line))
      .join('\n');

    for (const match of contents.matchAll(navigation)) {
      const raw = match[1] ?? match[2] ?? match[3];
      const pathname = raw.split('?')[0].replace(/\$\{[^}]*\}/g, '*');
      const segments = pathname.split('/').filter(Boolean).slice(1);
      const first = segments[0];
      const line = lineOf(contents, match.index);

      if (!first) continue;

      if (ROLE_SEGMENTS.has(first)) {
        if (!routeMatches(routes, pathname)) {
          missingRoute.push({ file, line, path: raw });
        }
        continue;
      }

      if (isAliasWrapped(contents, match.index)) continue;
      if (routeMatches(routes, pathname)) continue;

      barePath.push({ file, line, path: raw });
    }
  }

  return { missingRoute, barePath };
}

function report(label, rows) {
  const lines = rows
    .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
    .map(r => `  ${r.file}:${r.line}  ${r.path}`);
  return `${label}\n${lines.join('\n')}\n`;
}

async function main() {
  if (!statSync(APP_DIR, { throwIfNoEntry: false })?.isDirectory()) {
    process.stderr.write('check-dashboard-links: no app/ directory found\n');
    process.exit(1);
  }

  const routes = collectRoutes(APP_DIR);
  const files = INCLUDED_DIRS.flatMap(dir => collectFiles(dir));
  const { missingRoute, barePath } = scan(files, routes);

  const failures = [...missingRoute, ...barePath];

  if (missingRoute.length) {
    process.stderr.write(
      report(
        `\ncheck-dashboard-links: ${missingRoute.length} link(s) to a route that does not exist:`,
        missingRoute
      )
    );
  }

  if (barePath.length) {
    process.stderr.write(
      report(
        `\ncheck-dashboard-links: ${barePath.length} bare /dashboard/... path(s) not wrapped in ${ALIAS_HELPERS[0]}():`,
        barePath
      )
    );
  }

  if (failures.length) {
    process.stderr.write(
      `\ncheck-dashboard-links: ${failures.length} blocking violation(s).\n` +
        `Dashboard roles are real URL segments. A bare /dashboard/foo only resolves when passed\n` +
        `through ${ALIAS_HELPERS[0]}(activeDomain, path) — otherwise it 404s.\n`
    );
    process.exit(1);
  }
}

main().catch(error => {
  process.stderr.write(`check-dashboard-links crashed: ${error?.message ?? error}\n`);
  process.exit(1);
});
