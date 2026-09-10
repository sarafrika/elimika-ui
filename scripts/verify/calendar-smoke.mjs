#!/usr/bin/env node
/**
 * Anchoring, roster honesty, clock-to-position agreement and console health of
 * the scheduler grid — none of which a build can see. Usage and env vars live
 * in scripts/verify/README.md.
 */
import fs from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const storageStatePath = process.env.CALENDAR_STORAGE_STATE ?? '.perf/auth-instructor.json';
const domain = process.env.CALENDAR_DOMAIN ?? 'instructor';
const screenshotPath = '.perf/calendar-smoke.png';

// Access to a calendar is decided by the URL segment, not by the active-dashboard
// cookie, so the domain has to steer the path or it steers nothing at all. Only
// these four segments ship a calendar route.
const CALENDAR_SEGMENTS = {
  admin: 'admin',
  instructor: 'instructor',
  organisation: 'organisation',
  organisation_user: 'organisation',
  student: 'student',
};

const calendarSegment = CALENDAR_SEGMENTS[domain] ?? null;
const calendarPath = `/dashboard/${calendarSegment ?? domain}/calendar`;

const NAV_TIMEOUT_MS = 45_000;
const RENDER_TIMEOUT_MS = 30_000;
const SETTLE_MS = 2500;
const WATCHDOG_MS = 120_000;

const baseOrigin = new URL(baseUrl).origin;
const results = [];

let activePage = null;
let screenshotTaken = false;

function pass(name, detail) {
  results.push({ name, ok: true });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail) {
  results.push({ name, ok: false });
  console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function capture() {
  if (screenshotTaken || !activePage) return;
  screenshotTaken = true;
  await activePage.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
}

/** Unrecoverable setup problem: report it the same way and stop, never hang. */
async function abort(message) {
  console.log(`FAIL  harness — ${message}`);
  await capture();
  process.exit(2);
}

const SIGN_IN_PATH = /\/(auth\/realms|auth\/signin|api\/auth\/signin)/;
const EXPIRED_SESSION =
  `the session in ${storageStatePath} is expired — the app bounced away from ${calendarPath}. ` +
  'Refresh it with PERF_USER=… PERF_PASS=… node scripts/perf/login.mjs and retry.';

/**
 * The dashboard guards never bounce to Keycloak: an anonymous identity lands on the
 * app's own `/` and a half-onboarded one on `/onboarding` (entry-target.ts), so an
 * origin check alone reads a dead session as a render failure.
 */
function landingProblem(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return `the app navigated to an unreadable URL (${url}).`;
  }

  if (parsed.origin !== baseOrigin || SIGN_IN_PATH.test(parsed.pathname)) return EXPIRED_SESSION;

  const path = parsed.pathname.replace(/\/+$/, '') || '/';

  if (path === '/') return EXPIRED_SESSION;
  if (path === '/onboarding' || path === '/onboarding/organisation') {
    return (
      `the account in ${storageStatePath} was redirected to ${path} — it has no completed ` +
      'profile, so it has no dashboard to open. Capture a session for an onboarded account.'
    );
  }
  if (!path.startsWith(calendarPath)) {
    return (
      `the app redirected to ${path} instead of ${calendarPath} — the account in ` +
      `${storageStatePath} holds no ${domain} domain. Capture a session for one that does.`
    );
  }

  return null;
}

async function requireCalendarLanding(url) {
  const problem = landingProblem(url);
  if (problem) await abort(problem);
}

// The captured session carries its own elimika-active-dashboard cookie; the URL
// segment decides which calendar opens, so rewriting it only keeps the acting-domain
// header and the persisted view in step with the path being probed.
async function loadStorageState() {
  if (!fs.existsSync(storageStatePath)) {
    await abort(`missing ${storageStatePath} — run scripts/perf/login.mjs first.`);
  }

  const state = JSON.parse(fs.readFileSync(storageStatePath, 'utf8'));
  const hostname = new URL(baseUrl).hostname;

  state.cookies = (state.cookies ?? []).filter(
    cookie => cookie.name !== 'elimika-active-dashboard'
  );
  state.cookies.push({
    name: 'elimika-active-dashboard',
    value: domain,
    domain: hostname,
    path: '/',
    expires: Math.floor(Date.now() / 1000) + 86_400,
    httpOnly: false,
    secure: baseUrl.startsWith('https:'),
    sameSite: 'Lax',
  });
  state.origins = (state.origins ?? []).filter(origin => !origin.origin.includes(hostname));

  return state;
}

function parseClockLabel(label) {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(label).trim());
  if (!match) return null;

  const rawHour = Number(match[1]) % 12;
  const hour = match[3].toUpperCase() === 'PM' ? rawHour + 12 : rawHour;

  return { hour, minute: Number(match[2]) };
}

/**
 * Reads the grid straight out of the DOM: the scroll offset, the hour rows and
 * every absolutely positioned event card with its rendered top.
 */
function probeGrid() {
  const HOUR_LABEL = /^\d{1,2}:00\s(AM|PM)$/;
  const TIME_RANGE = /^(\d{1,2}:\d{2}\s(?:AM|PM))\s+-\s+(\d{1,2}:\d{2}\s(?:AM|PM))$/;

  const text = node => (node?.textContent ?? '').trim();

  const scroller = element => {
    let node = element.parentElement;
    while (node && node.scrollHeight - node.clientHeight <= 4) node = node.parentElement;
    return node;
  };

  const hourCells = Array.from(document.querySelectorAll('div')).filter(
    element => !element.firstElementChild && HOUR_LABEL.test(text(element))
  );
  if (!hourCells.length) return { found: false };

  // A right-rail or KPI label can read "9:00 AM" too, so the grid is whichever
  // scrollable element owns the most hour cells, not whichever came first.
  const owners = new Map();
  for (const cell of hourCells) {
    const owner = scroller(cell);
    if (owner) owners.set(owner, [...(owners.get(owner) ?? []), cell]);
  }

  const [container, gridCells] =
    [...owners.entries()].sort((a, b) => b[1].length - a[1].length)[0] ?? [];
  if (!container || gridCells.length < 12) {
    return { found: false, hourCount: hourCells.length };
  }

  const containerRect = container.getBoundingClientRect();
  const rows = gridCells.map(cell => {
    const rect = cell.parentElement.getBoundingClientRect();
    return { label: text(cell), top: rect.top, bottom: rect.bottom };
  });

  // Event blocks and overflow chips are the only nodes carrying both an inline
  // top and an inline height; the current-time needle carries top alone.
  const cardWrappers = Array.from(container.querySelectorAll('div[style*="top:"]')).filter(
    element => {
      const style = element.getAttribute('style') ?? '';
      return /top:\s*[\d.-]+px/.test(style) && /height:\s*[\d.]+px/.test(style);
    }
  );

  const cards = cardWrappers.map(wrapper => {
    const paragraphs = Array.from(wrapper.querySelectorAll('p')).map(text);
    const rect = wrapper.getBoundingClientRect();

    return {
      title: paragraphs[0] ?? '',
      range: paragraphs.find(value => TIME_RANGE.test(value)) ?? null,
      top: rect.top,
      avatars: Array.from(wrapper.querySelectorAll('[data-slot="avatar-fallback"]')).map(text),
      overflowBadges: Array.from(wrapper.querySelectorAll('span'))
        .map(text)
        .filter(value => /^\+\d+$/.test(value)),
    };
  });

  return {
    found: true,
    scrollTop: container.scrollTop,
    firstVisibleHour: (rows.find(row => row.bottom > containerRect.top + 1) ?? rows[0]).label,
    viewport: { top: containerRect.top, bottom: containerRect.bottom },
    rows,
    cards,
  };
}

async function openCalendar(page) {
  await page.goto(`${baseUrl}${calendarPath}`, {
    waitUntil: 'domcontentloaded',
    timeout: NAV_TIMEOUT_MS,
  });
  await requireCalendarLanding(page.url());

  try {
    await page
      .getByText('12:00 AM', { exact: true })
      .first()
      .waitFor({ state: 'attached', timeout: RENDER_TIMEOUT_MS });
  } catch {
    await requireCalendarLanding(page.url());
    await abort(
      `the time grid never rendered at ${page.url()} within ${RENDER_TIMEOUT_MS}ms — ` +
        `check the app is running and that ${calendarPath} still renders the scheduler.`
    );
  }

  // The anchor runs in a layout effect keyed on the loaded events, so it moves
  // once more when the calendar query settles.
  await page.waitForTimeout(SETTLE_MS);
  await requireCalendarLanding(page.url());
}

/**
 * The bug was an early session sitting above the fold, so what has to hold is that
 * the first card is inside the scroll viewport: scrollTop 0 is the right answer for
 * a 00:10 start, which a bare `scrollTop > 0` read as a regression.
 */
function assertAnchoring(grid) {
  const detail = `scrollTop=${Math.round(grid.scrollTop)}px, first visible row "${grid.firstVisibleHour}"`;
  const earliest = grid.cards.reduce(
    (lowest, card) => (!lowest || card.top < lowest.top ? card : lowest),
    null
  );

  if (!earliest) {
    if (grid.scrollTop > 0 || grid.firstVisibleHour !== '12:00 AM') {
      pass('viewport anchoring', `${detail}, no cards this week — anchored on working hours`);
      return;
    }
    fail(
      'viewport anchoring',
      `${detail} — an event-less grid should open on the working day, not flush at midnight.`
    );
    return;
  }

  const offset = Math.round(earliest.top - grid.viewport.top);

  if (earliest.top >= grid.viewport.top - 1 && earliest.top < grid.viewport.bottom) {
    pass(
      'viewport anchoring',
      `${detail}; earliest card "${earliest.title}" sits ${offset}px into the viewport`
    );
    return;
  }
  fail(
    'viewport anchoring',
    `${detail} — the earliest card "${earliest.title}" is ${offset}px from the top of the ` +
      'viewport, so the first session of the day sits outside the fold.'
  );
}

// The fabricated roster was always [instructor initials, 'ST' or 'S<n>', 'EN'],
// so the whole triple is the fingerprint: a real enrollee called Sarah Tembo
// initials to 'ST' and must not fail the run on her own.
function isFabricatedRoster(avatars) {
  if (avatars.length !== 3) return false;
  return (avatars[1] === 'ST' || /^S\d+$/.test(avatars[1])) && avatars[2] === 'EN';
}

/**
 * Guards the roster markup, and only that: the pre-fix build had the avatar block
 * commented out of the JSX, so the invented students of that build reached the
 * right rail's participant count but never the grid. This is a forward guard.
 */
function assertNoInventedAttendees(cards, view) {
  const fabricated = cards.filter(card => isFabricatedRoster(card.avatars));
  const hardcodedOverflow = cards.filter(
    card => card.overflowBadges.includes('+10') && card.avatars.length === 3
  );
  const titles = list =>
    list
      .slice(0, 3)
      .map(card => `"${card.title}"`)
      .join(', ');

  if (!fabricated.length && !hardcodedOverflow.length) {
    const withRoster = cards.filter(card => card.avatars.length).length;
    pass(
      `no invented attendees (${view} view)`,
      `${cards.length} card(s), ${withRoster} showing a roster, none in the fabricated shape`
    );
    return;
  }

  if (fabricated.length) {
    fail(
      `no invented attendees (${view} view)`,
      `${fabricated.length} card(s) show a roster of exactly three ending ST/EN: ${titles(fabricated)} — ` +
        'that is the old placeholder triple, but three real enrollees can initial the same way, ' +
        'so confirm against the screenshot.'
    );
  }
  if (hardcodedOverflow.length) {
    fail(
      `no hardcoded roster overflow (${view} view)`,
      `${hardcodedOverflow.length} card(s) show a bare "+10" badge: ${titles(hardcodedOverflow)} — ` +
        'a genuine 13-student roster looks identical, so confirm against the screenshot.'
    );
  }
}

// Hour rows are flush, so containment answers on its own; the tolerance is a
// fallback for a card rendered a fraction above the first row or below the last,
// and must widen the band rather than shift it off a :59 start's own row.
function findHourRow(rows, top) {
  return (
    rows.find(row => top >= row.top && top < row.bottom) ??
    rows.find(row => top >= row.top - 1 && top < row.bottom + 1) ??
    null
  );
}

function assertTimesAgreeWithPosition(grid) {
  const timed = grid.cards.filter(card => card.range);

  if (!timed.length) {
    fail(
      'times agree with position',
      'no event card printed a clock range, so nothing could be checked — run this against a ' +
        'week the instructor actually teaches.'
    );
    return;
  }

  const mismatches = [];

  for (const card of timed) {
    const start = parseClockLabel(card.range.split(' - ')[0]);
    const row = findHourRow(grid.rows, card.top);

    if (!start || !row) {
      mismatches.push(`"${card.title}" (${card.range}) sits outside every hour row`);
      continue;
    }

    const rowStart = parseClockLabel(row.label);
    const rowFraction = (card.top - row.top) / (row.bottom - row.top);

    if (rowStart.hour !== start.hour) {
      mismatches.push(
        `"${card.title}" prints ${card.range} but is drawn against the ${row.label} row`
      );
      continue;
    }
    if (Math.abs(rowFraction - start.minute / 60) > 0.05) {
      mismatches.push(
        `"${card.title}" prints ${card.range} but sits ${Math.round(rowFraction * 60)} minutes into the ${row.label} row`
      );
    }
  }

  if (mismatches.length) {
    fail('times agree with position', mismatches.slice(0, 4).join('; '));
    return;
  }
  pass('times agree with position', `${timed.length} card(s) land on the hour row they print`);
}

function assertNoConsoleErrors(consoleErrors) {
  if (!consoleErrors.length) {
    pass('no console errors', 'nothing logged from the app');
    return;
  }
  fail(
    'no console errors',
    `${consoleErrors.length} app error(s): ${consoleErrors.slice(0, 3).join(' | ')}`
  );
}

// Anything logged against another origin is a blocked or missing third party,
// not the app failing.
function isAppConsoleError(message) {
  const source = message.location()?.url ?? '';
  if (!source) return true;
  if (source.startsWith('chrome-extension://')) return false;

  try {
    return new URL(source).origin === baseOrigin;
  } catch {
    return true;
  }
}

const watchdog = setTimeout(() => {
  console.log(`FAIL  harness — timed out after ${WATCHDOG_MS}ms without finishing.`);
  process.exit(2);
}, WATCHDOG_MS);

fs.mkdirSync('.perf', { recursive: true });

if (!calendarSegment) {
  await abort(
    `CALENDAR_DOMAIN=${domain} has no calendar route — pass one of ` +
      `${Object.keys(CALENDAR_SEGMENTS).join(', ')}.`
  );
}

const storageState = await loadStorageState();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState,
  viewport: { width: 1600, height: 1000 },
});

// Rejections never reach page.on('pageerror'), so route them through console.
await context.addInitScript(() => {
  window.addEventListener('unhandledrejection', event => {
    console.error(`unhandledrejection: ${event.reason?.message ?? String(event.reason)}`);
  });
});

const page = await context.newPage();
activePage = page;

const consoleErrors = [];

page.on('console', message => {
  if (message.type() === 'error' && isAppConsoleError(message)) {
    consoleErrors.push(message.text().slice(0, 200));
  }
});
page.on('pageerror', error => {
  consoleErrors.push(`pageerror: ${String(error?.message ?? error).slice(0, 200)}`);
});

try {
  console.log(`calendar-smoke: ${baseUrl}${calendarPath} as ${domain} (${storageStatePath})\n`);

  await openCalendar(page);

  const weekGrid = await page.evaluate(probeGrid);
  await capture();

  if (!weekGrid.found) {
    await abort('could not find the scrollable time grid — the scheduler markup has moved.');
  }

  assertAnchoring(weekGrid);
  assertTimesAgreeWithPosition(weekGrid);
  assertNoInventedAttendees(weekGrid.cards, 'week');

  // Only the day view renders attendee avatars, so the roster check has to
  // stand there too before it means anything.
  await page.getByRole('button', { name: 'Day', exact: true }).first().click({ timeout: 10_000 });
  await page.waitForTimeout(SETTLE_MS);
  await requireCalendarLanding(page.url());

  const dayGrid = await page.evaluate(probeGrid);
  if (dayGrid.found) {
    assertNoInventedAttendees(dayGrid.cards, 'day');
  } else {
    fail('no invented attendees (day view)', 'the day grid never rendered.');
  }

  assertNoConsoleErrors(consoleErrors);
} catch (error) {
  fail('harness', String(error?.message ?? error).slice(0, 300));
} finally {
  await capture();
  await browser.close();
  clearTimeout(watchdog);
}

const failed = results.filter(result => !result.ok);
console.log(
  `\n${results.length - failed.length}/${results.length} passed. Screenshot: ${screenshotPath}`
);
process.exit(failed.length ? 1 : 0);
