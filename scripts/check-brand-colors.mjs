import { readdirSync, readFileSync, } from 'node:fs';
import { extname, relative, resolve } from 'node:path';

const ROOT = resolve(process.cwd());

const patterns = [
  {
    regex: /(?:^|\s)(?:text|bg|border|shadow|from|via|to)-(?:blue|slate|gray|stone|zinc|purple|red|emerald|indigo|cyan|amber|rose)-[0-9]{2,3}(?:\/[0-9]{2})?/g,
    message: 'Legacy Tailwind color utility',
  },
  {
    regex: /#[0-9a-fA-F]{3,6}\b/g,
    message: 'Raw hex color',
  },
];

const ALLOW_HEX_FILES = new Set([
  'app/globals.css',
  'styles/_variables.scss',
  'components/tiptap-ui/color-highlight-button/use-color-highlight.ts',
]);

const INCLUDED_DIRS = ['components', 'app'];
const EXCLUDED_PATHS = new Set();
const EXCLUDED_PREFIXES = ['app/dashboard', 'app/auth', 'app/onboarding', 'app/api'];

function collectFiles(dir) {
  const absDir = resolve(ROOT, dir);
  const entries = readdirSync(absDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = resolve(absDir, entry.name);
    const relPath = relative(ROOT, entryPath);

    if (EXCLUDED_PATHS.has(relPath)) continue;
    if (EXCLUDED_PREFIXES.some(prefix => relPath.startsWith(prefix))) continue;

    if (entry.isDirectory()) {
      files.push(...collectFiles(relPath));
    } else if (['.ts', '.tsx'].includes(extname(entry.name))) {
      files.push(relPath);
    }
  }

  return files;
}

async function main() {
  const files = INCLUDED_DIRS.flatMap(dir => collectFiles(dir));

  const violations = [];

  for (const file of files) {
    const absPath = resolve(ROOT, file);
    const contents = readFileSync(absPath, 'utf8');

    for (const { regex, message } of patterns) {
      const matches = contents.match(regex);
      if (!matches) continue;

      if (regex === patterns[1].regex && ALLOW_HEX_FILES.has(file)) {
        continue;
      }

      violations.push({
        file,
        message,
        samples: Array.from(new Set(matches)).slice(0, 3),
      });
    }
  }

  if (violations.length) {
    for (const _violation of violations) {
    }
    process.exit(1);
  }
}

main().catch(_error => {
  process.exit(1);
});
