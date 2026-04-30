import { readdirSync, readFileSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';

const ROOT = resolve(process.cwd());

// Two-tier policy:
//  - `fail`: legacy violations that the codebase was previously already clean of. New regressions
//    fail CI immediately.
//  - `warn`: extended palette + hardcoded white/black detection. Pre-existing debt — surfaced for
//    incremental cleanup; emits to stderr but does not fail.
//
// Promoting an entry from `warn` to `fail` is the goal as the codebase is migrated.

const FAIL_PATTERNS = [
  {
    name: 'legacy-tailwind',
    regex:
      /(?:^|[\s'"`{(])(?:text|bg|border|shadow|from|via|to|ring|fill|stroke)-(?:blue|slate|gray|stone|zinc|purple|red|emerald|indigo|cyan|amber|rose)-[0-9]{2,3}(?:\/[0-9]{1,3})?/g,
    message: 'Legacy Tailwind color utility — use design tokens (bg-primary, bg-success, …)',
    hint: 'Replace with bg-primary / bg-success / bg-warning / bg-destructive / bg-card / bg-muted etc.',
  },
  {
    name: 'raw-hex',
    regex: /#[0-9a-fA-F]{3,6}\b/g,
    message: 'Raw hex color — use a CSS variable / token instead',
    allowFiles: new Set([
      'app/globals.css',
      'styles/_variables.scss',
      'components/tiptap-ui/color-highlight-button/use-color-highlight.ts',
      // Dynamic-color render paths — accept a hex fallback so dyed CMS data still renders
      // when the lib/color-themes palette is empty.
      'src/features/profile/landing/course-creator-tab.tsx',
      'src/features/profile/landing/instructors-tab.tsx',
    ]),
  },
];

const WARN_PATTERNS = [
  {
    name: 'palette-extended',
    regex:
      /(?:^|[\s'"`{(])(?:text|bg|border|shadow|from|via|to|ring|fill|stroke)-(?:green|sky|yellow|orange|pink|fuchsia|violet|teal|lime)-[0-9]{2,3}(?:\/[0-9]{1,3})?/g,
    message: 'Extended palette utility — prefer tokens (bg-success, bg-warning, …)',
  },
  {
    name: 'hardcoded-white-black',
    regex: /(?:^|[\s'"`{])(?:text-white|bg-white|bg-black)(?=[\s'"`}]|$)/g,
    message:
      'Hardcoded white/black without a paired dark variant — use text-foreground / bg-card / bg-background, or pair with `dark:` if intentional.',
  },
];

const INCLUDED_DIRS = ['components', 'app', 'src'];
const EXCLUDED_PREFIXES = [
  'app/api',
  'components/ui',
  'components/tiptap-ui',
  'components/tiptap-ui-primitive',
  'components/tiptap-node',
  'src/services',
];

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

function scan(files, patterns) {
  const violations = [];
  for (const file of files) {
    const absPath = resolve(ROOT, file);
    const contents = readFileSync(absPath, 'utf8');

    for (const { name, regex, message, hint, allowFiles } of patterns) {
      if (allowFiles?.has(file)) continue;
      const matches = contents.match(regex);
      if (!matches) continue;
      const samples = Array.from(new Set(matches.map(m => m.trim()))).slice(0, 5);
      violations.push({ rule: name, file, message, ...(hint ? { hint } : {}), samples });
    }
  }
  return violations;
}

async function main() {
  const files = INCLUDED_DIRS.flatMap(dir => collectFiles(dir));

  const failures = scan(files, FAIL_PATTERNS);
  const warnings = scan(files, WARN_PATTERNS);

  if (warnings.length) {
    process.stderr.write(`brand-colors: ${warnings.length} warning(s) (non-blocking):\n`);
    process.stderr.write(`${JSON.stringify(warnings, null, 2)}\n`);
  }

  if (failures.length) {
    process.stderr.write(`\nbrand-colors: ${failures.length} blocking violation(s):\n`);
    process.stderr.write(`${JSON.stringify(failures, null, 2)}\n`);
    process.exit(1);
  }
}

main().catch(error => {
  process.stderr.write(`check-brand-colors crashed: ${error?.message ?? error}\n`);
  process.exit(1);
});
