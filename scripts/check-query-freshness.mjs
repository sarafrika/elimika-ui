import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, isAbsolute, relative, resolve } from 'node:path';

const ROOT = resolve(process.cwd());

// A cached answer may be painted INSTEAD OF waiting for a request, never INSTEAD OF making one.
// Workflow state (moderation, verification, applications, enrolments, reviews) is changed by
// somebody else on the server, so a persisted copy of it is untrustworthy the moment it is rehydrated.

const WORKFLOW_MODULE = 'src/features/dashboard/workflow-query-invalidation.ts';
const VOLATILE_EXPORT = 'VOLATILE_GENERATED_QUERY_IDS';
const VOLATILE_SOURCE = 'workflowQueryIds';

// Options that make a query unable to ever revalidate itself, however stale the persisted entry is.
const ABSOLUTE_OPTIONS = [
  {
    name: 'never-refetch-on-mount',
    regex: /\brefetchOnMount\s*:\s*false\b/,
    message:
      'refetchOnMount: false is the setting that ignores staleness, so neither the restore-time ' +
      'invalidation nor an expired staleTime can get this re-asked: the stored answer is replayed ' +
      'on reload and on every client-side return to the screen.',
    hint:
      'Drop refetchOnMount and let staleTime be the throttle — the default only re-asks a mount ' +
      'whose entry has already expired. Not `refetchOnMount: "always"`: that re-asks on every ' +
      'mount and multiplies a per-id fan-out. Keep refetchOnWindowFocus/Reconnect false if the churn was the concern.',
  },
  {
    name: 'infinite-stale-time',
    regex: /\bstaleTime\s*:\s*(?:Infinity|Number\.POSITIVE_INFINITY)\b/,
    message:
      'staleTime: Infinity marks workflow state permanently fresh, so React Query never issues the request behind the paint.',
    hint: 'Give it a finite staleTime — the cached value still paints instantly, it just revalidates underneath.',
  },
];

const INCLUDED_DIRS = ['app', 'components', 'src', 'hooks', 'lib', 'context'];
const EXCLUDED_PREFIXES = ['node_modules', '.next', 'app/api', 'services/client', 'src/services'];
const ALLOW_COMMENT = 'query-freshness-ok';

/**
 * Derived from the workflow module's own per-workflow arrays so the guard and the
 * invalidation lists cannot drift apart.
 */
function readVolatileQueryIds() {
  const source = readFileSync(resolve(ROOT, WORKFLOW_MODULE), 'utf8');

  const exportLine = source.match(new RegExp(`export const ${VOLATILE_EXPORT}[\\s\\S]*?;`));
  if (!exportLine || !exportLine[0].includes(VOLATILE_SOURCE)) {
    throw new Error(
      `${WORKFLOW_MODULE} no longer exports ${VOLATILE_EXPORT} built from ${VOLATILE_SOURCE} — ` +
        'update check-query-freshness.mjs to match, do not let the two drift.'
    );
  }

  const start = source.indexOf(`const ${VOLATILE_SOURCE} = {`);
  const end = source.indexOf('} as const;', start);
  if (start === -1 || end === -1) {
    throw new Error(`${WORKFLOW_MODULE}: could not read the ${VOLATILE_SOURCE} object literal.`);
  }

  const ids = new Set(
    Array.from(source.slice(start, end).matchAll(/'([A-Za-z][A-Za-z0-9_]*)'/g), m => m[1])
  );
  if (!ids.size) {
    throw new Error(`${WORKFLOW_MODULE}: ${VOLATILE_SOURCE} yielded no query ids.`);
  }

  return ids;
}

function collectFiles(target) {
  const absTarget = isAbsolute(target) ? target : resolve(ROOT, target);
  const relTarget = relative(ROOT, absTarget);

  if (EXCLUDED_PREFIXES.some(prefix => relTarget.startsWith(prefix))) return [];

  const stat = statSync(absTarget, { throwIfNoEntry: false });
  if (!stat) return [];
  if (stat.isFile()) {
    return ['.ts', '.tsx'].includes(extname(absTarget)) ? [relTarget] : [];
  }

  return readdirSync(absTarget, { withFileTypes: true }).flatMap(entry =>
    collectFiles(resolve(absTarget, entry.name))
  );
}

// Blanks out strings, template literals and comments so brace counting sees only real syntax.
function maskLiterals(source) {
  const out = source.split('');
  let i = 0;

  while (i < source.length) {
    const char = source[i];
    const next = source[i + 1];

    if (char === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') out[i++] = ' ';
      continue;
    }

    if (char === '/' && next === '*') {
      const close = source.indexOf('*/', i + 2);
      const stop = close === -1 ? source.length : close + 2;
      for (; i < stop; i++) if (source[i] !== '\n') out[i] = ' ';
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      out[i++] = ' ';
      while (i < source.length) {
        if (source[i] === '\\') {
          out[i] = ' ';
          if (source[i + 1] !== '\n') out[i + 1] = ' ';
          i += 2;
          continue;
        }
        const done = source[i] === char;
        if (source[i] !== '\n') out[i] = ' ';
        i++;
        if (done) break;
      }
      continue;
    }

    i++;
  }

  return out.join('');
}

// The object literal the offending property sits directly in, or null when braces do not resolve.
function enclosingObject(masked, index) {
  let depth = 0;
  let start = -1;

  for (let i = index; i >= 0; i--) {
    if (masked[i] === '}') depth++;
    else if (masked[i] === '{') {
      if (depth === 0) {
        start = i;
        break;
      }
      depth--;
    }
  }

  if (start === -1) return null;

  depth = 0;
  for (let i = start; i < masked.length; i++) {
    if (masked[i] === '{') depth++;
    else if (masked[i] === '}') {
      depth--;
      if (depth === 0) return { start, end: i };
    }
  }

  return null;
}

// Only a spread sitting directly in this object counts — a nested query's options are not ours.
function directVolatileSpread(source, masked, object, spreadRegex) {
  const body = source.slice(object.start + 1, object.end);
  const maskedBody = masked.slice(object.start + 1, object.end);

  let depth = 0;
  const depths = new Array(maskedBody.length);
  for (let i = 0; i < maskedBody.length; i++) {
    if (maskedBody[i] === '}' || maskedBody[i] === ')' || maskedBody[i] === ']') depth--;
    depths[i] = depth;
    if (maskedBody[i] === '{' || maskedBody[i] === '(' || maskedBody[i] === '[') depth++;
  }

  spreadRegex.lastIndex = 0;
  for (const match of body.matchAll(spreadRegex)) {
    if (depths[match.index] === 0) return match[1];
  }

  return null;
}

function scan(files, volatileIds) {
  const spreadRegex = new RegExp(
    `\\.\\.\\.\\s*((?:${[...volatileIds].join('|')})(?:Infinite)?Options)\\s*\\(`,
    'g'
  );
  const violations = [];

  for (const file of files) {
    const contents = readFileSync(resolve(ROOT, file), 'utf8');
    if (!/refetchOnMount|staleTime/.test(contents)) continue;

    const masked = maskLiterals(contents);
    const lineStarts = [0];
    for (let i = 0; i < contents.length; i++) if (contents[i] === '\n') lineStarts.push(i + 1);

    for (const { name, regex, message, hint } of ABSOLUTE_OPTIONS) {
      const scanner = new RegExp(regex.source, 'g');
      for (const match of masked.matchAll(scanner)) {
        const lineIndex = lineStarts.findLastIndex(start => start <= match.index);
        const lineText = contents.slice(
          lineStarts[lineIndex],
          lineStarts[lineIndex + 1] ?? contents.length
        );
        if (lineText.includes(ALLOW_COMMENT)) continue;

        const object = enclosingObject(masked, match.index);
        if (!object) continue;

        const helper = directVolatileSpread(contents, masked, object, spreadRegex);
        if (!helper) continue;

        violations.push({
          rule: name,
          file,
          line: lineIndex + 1,
          query: helper,
          option: match[0].trim(),
          message,
          hint,
        });
      }
    }
  }

  return violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

async function main() {
  const targets = process.argv.slice(2);
  const volatileIds = readVolatileQueryIds();
  const files = (targets.length ? targets : INCLUDED_DIRS).flatMap(dir => collectFiles(dir));
  const violations = scan(files, volatileIds);

  if (!violations.length) {
    process.stdout.write(
      `check-query-freshness: clean — every workflow query still revalidates behind its cached paint ` +
        `(${volatileIds.size} volatile query ids, ${files.length} files).\n`
    );
    return;
  }

  const byFile = new Set(violations.map(v => v.file));
  process.stderr.write(
    `\ncheck-query-freshness: ${violations.length} blocking violation(s) across ${byFile.size} file(s):\n`
  );
  process.stderr.write(`${JSON.stringify(violations, null, 2)}\n`);
  process.stderr.write(
    `\nThese queries carry state somebody on the other side of a moderation, verification,\n` +
      `application, enrolment or review decision is waiting on. Restoring the persisted cache marks\n` +
      `them stale and a finite staleTime expires them, but an observer wired never to re-ask paints\n` +
      `that answer for the rest of the session — after a reload and on every navigation back to it.\n` +
      `The staleTime is not the fault and does not need loosening: it is the dead trigger.\n` +
      `Add \`// ${ALLOW_COMMENT}\` on the line for a read that genuinely cannot change underneath\n` +
      `it, or for a fan-out whose staleness you are deliberately buying — with the reason beside it.\n`
  );
  process.exit(1);
}

main().catch(error => {
  process.stderr.write(`check-query-freshness crashed: ${error?.message ?? error}\n`);
  process.exit(1);
});
