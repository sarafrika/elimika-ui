import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

const ROOT = resolve(process.cwd());

// The bell is the only way another person's action reaches an already-open page, and the dispatcher
// it feeds matches by substring and falls through to a silent no-op — a backend type nobody wired
// leaves the recipient reading stale state with no error anywhere. Route it, or declare it inert.

const TYPES_MODULE = 'services/client/types.gen.ts';
const WORKFLOW_MODULE = 'src/features/dashboard/workflow-query-invalidation.ts';
const DISPATCHER = 'invalidateWorkflowQueriesForNotification';

// Located by content, not by name: the generator numbers these enums positionally, so a regenerated
// client can rename `TypeEnum` to `TypeEnum4` without a single notification type having changed.
const ENUM_SENTINELS = ['COURSE_ENROLLMENT_WELCOME', 'SECURITY_ALERT', 'ORGANISATION_ANNOUNCEMENT'];

// Types that legitimately invalidate nothing: they carry their whole payload in the bell itself and
// no screen behind them goes stale. Anything absent from here and unrouted is a finding.
const INERT_TYPES = new Map([
  ['ACCOUNT_CREATED', 'Sent at signup, before any dashboard query exists to be stale.'],
  ['ASSIGNMENT_DEADLINE_REMINDER', 'A clock nudge — the assignment it points at has not changed.'],
  ['ASSIGNMENT_DUE_REMINDER', 'A clock nudge — the assignment it points at has not changed.'],
  ['GRADING_REMINDER', 'Nags the instructor about the queue it already shows; nothing was graded.'],
  ['LEARNING_MILESTONE_ACHIEVED', 'Progress applause; the progress write already invalidated its own reads.'],
  ['LEARNING_STREAK_ACHIEVEMENT', 'Streak applause, derived from data the recipient already has.'],
  ['PASSWORD_RESET_REQUEST', 'Account security flow, entirely outside the dashboard query cache.'],
  ['PEER_ACHIEVEMENT_CELEBRATION', "Someone else's applause; no screen of the recipient's shows it."],
  ['PROFILE_COMPLETION_REMINDER', 'Nags about fields the recipient owns and has not edited.'],
  ['SECURITY_ALERT', 'Account security notice, entirely outside the dashboard query cache.'],
  ['ORGANISATION_ANNOUNCEMENT', 'Free-text broadcast; it stands for no server-side state change.'],
  ['WEEKLY_PROGRESS_SUMMARY', 'A digest of a week already spent — nothing changed when it arrived.'],
]);

function readModule(path) {
  return readFileSync(isAbsolute(path) ? path : resolve(ROOT, path), 'utf8');
}

// Balanced slice from the first `open` at or after `from`, skipping quoted spans and comments so a
// delimiter inside a string cannot close the block early.
function balanced(source, from, open, close) {
  const start = source.indexOf(open, from);
  if (start === -1) return null;
  let depth = 0;

  for (let i = start; i < source.length; i++) {
    const char = source[i];
    const next = source[i + 1];

    if (char === '/' && next === '/') {
      const eol = source.indexOf('\n', i);
      if (eol === -1) break;
      i = eol;
      continue;
    }
    if (char === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 1;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      i++;
      while (i < source.length && source[i] !== char) i += source[i] === '\\' ? 2 : 1;
      continue;
    }

    if (char === open) depth++;
    else if (char === close && --depth === 0) return { start, end: i, text: source.slice(start, i + 1) };
  }

  return null;
}

/** Union of every `as const` enum object carrying the sentinels, so the two generated copies agree. */
function readNotificationTypes(source, path) {
  const types = new Set();

  for (const match of source.matchAll(/export const (\w+) = \{/g)) {
    const block = balanced(source, match.index, '{', '}');
    if (!block) continue;

    const names = Array.from(block.text.matchAll(/^\s*([A-Z][A-Z0-9_]*)\s*:/gm), m => m[1]);
    if (!ENUM_SENTINELS.every(sentinel => names.includes(sentinel))) continue;
    for (const name of names) types.add(name);
  }

  if (!types.size) {
    throw new Error(
      `${path}: found no notification-type enum containing ${ENUM_SENTINELS.join(', ')}. ` +
        'Either the client no longer publishes it or the sentinels were renamed — fix this guard ' +
        'rather than letting it pass on an empty list.'
    );
  }

  return types;
}

/**
 * Runs the real dispatcher instead of restating its rules, because a guard that re-lists
 * `type.includes(...)` clauses by hand starts lying the day one of them is edited.
 */
function buildDispatcher(source, path) {
  const at = source.indexOf(`export function ${DISPATCHER}`);
  if (at === -1) throw new Error(`${path}: ${DISPATCHER} is gone — this guard has nothing to check.`);

  const signature = balanced(source, at, '(', ')');
  const body = balanced(source, signature.end, '{', '}');
  if (!signature || !body) throw new Error(`${path}: could not delimit ${DISPATCHER}.`);

  const params = signature.text
    .slice(1, -1)
    .split(',')
    .map(part => part.trim().split(/[:\s]/)[0])
    .filter(part => /^[A-Za-z_$][\w$]*$/.test(part));

  if (params.length !== 2) {
    throw new Error(
      `${path}: ${DISPATCHER} now takes ${params.length} parameter(s); this guard calls it as ` +
        '(queryClient, notification). Update the call below to match.'
    );
  }

  const invalidators = new Set(
    Array.from(body.text.matchAll(/\b(invalidate[A-Za-z0-9_]*)\s*\(/g), m => m[1])
  );
  invalidators.delete(DISPATCHER);

  // Only the module-scope lookup tables the body actually reads, so the clauses evaluate for real.
  const prelude = Array.from(
    source.matchAll(/\bconst\s+([A-Z][A-Z0-9_]*)\s*=\s*(?:new Set\()?\[[\s\S]*?\]\)?(?:\s+as const)?;/g)
  )
    .filter(match => new RegExp(`\\b${match[1]}\\b`).test(body.text))
    .map(match => match[0].replace(/\s+as const;$/, ';'));

  const stubs = Array.from(invalidators, name =>
    `const ${name} = (...args) => { __hit(${JSON.stringify(name)}); return Promise.resolve(); };`
  );

  const hits = [];
  let dispatch;
  try {
    dispatch = new Function(
      '__hit',
      `${stubs.join('\n')}\n${prelude.join('\n')}\n` +
        `return function (${params.join(', ')}) ${body.text};`
    )(name => hits.push(name));
  } catch (error) {
    throw new Error(
      `${path}: ${DISPATCHER} grew syntax this guard cannot evaluate (${error?.message ?? error}). ` +
        'Teach the guard the new shape — do not delete it.'
    );
  }

  return type => {
    hits.length = 0;
    dispatch(undefined, { type });
    return hits.filter(name => name.endsWith('WorkflowQueries'));
  };
}

/** `invalidateTrainingApplicationWorkflowQueries` reads back as `trainingApplication`. */
function familyOf(invalidator) {
  const stem = invalidator.replace(/^invalidate/, '').replace(/WorkflowQueries$/, '');
  return stem.charAt(0).toLowerCase() + stem.slice(1);
}

async function main() {
  const [typesPath = TYPES_MODULE, workflowPath = WORKFLOW_MODULE] = process.argv.slice(2);

  const types = readNotificationTypes(readModule(typesPath), typesPath);
  const route = buildDispatcher(readModule(workflowPath), workflowPath);

  const routed = new Map();
  const unrouted = [];

  for (const type of [...types].sort()) {
    const invalidators = route(type);
    if (invalidators.length) {
      routed.set(type, invalidators.map(familyOf));
      continue;
    }
    if (!INERT_TYPES.has(type)) unrouted.push(type);
  }

  const violations = unrouted.map(type => ({
    rule: 'unrouted-notification-type',
    type,
    message: `${type} reaches the bell but ${DISPATCHER} routes it nowhere, so the recipient's open page keeps painting pre-event state.`,
    hint: `Add a clause in ${WORKFLOW_MODULE} pointing it at the invalidation family whose screens it changes, or add it to INERT_TYPES in this script with the reason it changes nothing.`,
  }));

  for (const [type, reason] of INERT_TYPES) {
    if (!types.has(type)) {
      violations.push({
        rule: 'stale-inert-entry',
        type,
        message: `${type} is declared inert here but no longer exists in ${typesPath}.`,
        hint: 'Drop the entry — a list of types nobody sends stops describing anything.',
      });
      continue;
    }
    if (routed.has(type)) {
      violations.push({
        rule: 'contradicted-inert-entry',
        type,
        message: `${type} is declared inert ("${reason}") but the dispatcher now routes it to ${routed.get(type).join(', ')}.`,
        hint: 'One of the two is wrong: remove the entry if the routing is intended, or the clause if it is not.',
      });
    }
  }

  if (!violations.length) {
    const families = new Set([...routed.values()].flat());
    process.stdout.write(
      `check-notification-coverage: clean — ${types.size} notification types, ${routed.size} routed ` +
        `across ${families.size} invalidation families, ${INERT_TYPES.size} declared inert.\n`
    );
    return;
  }

  process.stderr.write(
    `\ncheck-notification-coverage: ${violations.length} blocking violation(s) ` +
      `(${types.size} types, ${routed.size} routed, ${INERT_TYPES.size} inert):\n`
  );
  process.stderr.write(`${JSON.stringify(violations, null, 2)}\n`);
  process.stderr.write(
    `\nA notification type nobody wired is not a crash and not a test failure: it arrives, raises a\n` +
      `toast, and leaves the screen behind it showing the state from before the event — until a\n` +
      `manual reload. Every type has to be routed to an invalidation family or declared inert.\n`
  );
  process.exit(1);
}

main().catch(error => {
  process.stderr.write(`check-notification-coverage crashed: ${error?.message ?? error}\n`);
  process.exit(1);
});
