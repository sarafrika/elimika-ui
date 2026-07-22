import { readdirSync, readFileSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';

const ROOT = resolve(process.cwd());

// Guards against ad-hoc timestamp rendering. Every API instant must go through
// the `<DateTime>` component or the `lib/date` formatters (parseApiDate, format*),
// which interpret zone-less UTC strings correctly and localize to the viewer's
// zone. `new Date(apiValue).toLocaleString()` misreads a zone-less UTC timestamp
// as browser-local time — the exact bug this codebase is being migrated away from.
//
// Pre-existing debt is surfaced as warnings (non-blocking). Add `// datetime-ok`
// on the offending line for legitimate exceptions (durations, non-API dates,
// currency Intl.NumberFormat is not matched here). The goal is to shrink this to
// zero, then promote the rules to blocking.

const WARN_PATTERNS = [
  {
    name: 'new-date-tolocale',
    regex: /new Date\([^)]*\)\s*\.\s*toLocale(?:Date|Time)?String/g,
    message:
      'new Date(apiValue).toLocale…() misreads zone-less UTC as local time — use <DateTime> or lib/date format helpers.',
  },
  {
    name: 'tolocale-string',
    regex: /\.toLocale(?:Date|Time)?String\s*\(/g,
    message:
      'toLocale…String on a timestamp localizes an already-mis-parsed Date — format via lib/date instead.',
  },
  {
    name: 'intl-datetimeformat',
    regex: /new Intl\.DateTimeFormat\b/g,
    message:
      'Intl.DateTimeFormat for timestamps bypasses UTC-aware parsing — use <DateTime> or lib/date.',
  },
];

const INCLUDED_DIRS = ['components', 'app', 'src', 'hooks', 'lib'];
const EXCLUDED_PREFIXES = ['app/api', 'src/services'];
// The sanctioned formatting utilities and component are exempt.
const EXCLUDED_FILES = new Set([
  'lib/date.ts',
  'lib/format-course-date.ts',
  'components/ui/date-time.tsx',
]);
const ALLOW_COMMENT = 'datetime-ok';

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

function scan(files) {
  const violations = [];
  for (const file of files) {
    if (EXCLUDED_FILES.has(file)) continue;
    const contents = readFileSync(resolve(ROOT, file), 'utf8');
    const lines = contents.split('\n');

    for (const { name, regex, message } of WARN_PATTERNS) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(ALLOW_COMMENT)) continue;
        regex.lastIndex = 0;
        if (regex.test(line)) {
          violations.push({ rule: name, file, line: i + 1, message });
        }
      }
    }
  }
  return violations;
}

async function main() {
  const files = INCLUDED_DIRS.flatMap(dir => collectFiles(dir));
  const warnings = scan(files);

  if (warnings.length) {
    const byFile = new Set(warnings.map(w => w.file));
    process.stderr.write(
      `check-datetime: ${warnings.length} warning(s) across ${byFile.size} file(s) (non-blocking):\n`
    );
    process.stderr.write(`${JSON.stringify(warnings, null, 2)}\n`);
  } else {
    process.stdout.write('check-datetime: clean — no ad-hoc timestamp rendering found.\n');
  }
}

main().catch(error => {
  process.stderr.write(`check-datetime crashed: ${error?.message ?? error}\n`);
  process.exit(1);
});
