/**
 * The prospect's copy and formatting for the public course record.
 *
 * The public catalogue route is the one page in the course-record migration that
 * keeps its own server-rendered body (see
 * `src/features/course-record/ADOPTION.md`, "Server rendering and SEO"), so it
 * cannot mount `CourseRecordPage`. It still has to *read* as the record view, and
 * the record feature owns one direction of that: `src/features/course-record/`
 * must not depend on the catalogue, and the catalogue must not depend on it.
 *
 * So the prospect row of `COURSE_ACCESS_CAPABILITIES` is transcribed here — copy
 * only, no logic — for the one viewer this route ever has. Access is not derived:
 * an unauthenticated crawler or a signed-out visitor on a public listing *is* the
 * prospect, the least-privileged of the eight states, and this page never widens
 * it. Nothing here decides what may be shown; it is the words for the one state
 * that is shown.
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

/** Rendered wherever a figure is genuinely absent. Never a zero. */
export const CATALOGUE_PLACEHOLDER = '—';

/* ────────────────────────────────────────────────────────────────────────────
 * Chrome
 * ────────────────────────────────────────────────────────────────────────── */

export const PROSPECT_BREADCRUMB_ROOT = 'Catalogue';
export const PROSPECT_ACCESS_LABEL = 'Not enrolled — public listing';
export const PROSPECT_ACCESS_SOURCE = 'public catalogue · no enrollment on file';
export const PROSPECT_ACCESS_BLURB =
  'You are browsing before enrolling. The syllabus, the intro video, the price and every class running this course are open. Lesson material opens the moment your enrolment is paid and confirmed.';

/* ────────────────────────────────────────────────────────────────────────────
 * Grants
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * What one grant line says about a capability: `granted` is yours now, `locked`
 * is yours once a payment lands, `absent` is never part of a learner's world.
 */
export type CatalogueGrantTone = 'granted' | 'locked' | 'absent';

export interface CatalogueGrant {
  label: string;
  tone: CatalogueGrantTone;
}

export const PROSPECT_GRANTS: readonly CatalogueGrant[] = [
  { label: 'Full syllabus, durations and objectives', tone: 'granted' },
  { label: 'Intro video, price and every class running', tone: 'granted' },
  { label: 'Lesson items — open on paid enrolment', tone: 'locked' },
  { label: 'Commercial terms between creator and trainer', tone: 'absent' },
];

/* ────────────────────────────────────────────────────────────────────────────
 * Gate
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * The prospect's gate copy. The capability map's body counts the sealed lesson
 * items (`The {contentItems} lesson items …`); the public detail response does
 * not carry that count, so the sentence is the same one with the figure left
 * out rather than a number this route would have to invent.
 */
export const PROSPECT_GATE = {
  title: 'Watch the intro, read the syllabus — lessons open when you enroll',
  body: 'Every lesson title, objective and duration is listed so you know exactly what you are buying, and the intro video is free to watch. The lesson items are the creator’s work and unlock on your first paid enrolment.',
  cta: 'Watch intro',
} as const;

/* ────────────────────────────────────────────────────────────────────────────
 * Content
 * ────────────────────────────────────────────────────────────────────────── */

export const PROSPECT_CONTENT = {
  badge: 'Syllabus only',
  readonlyNote: 'Syllabus only — lessons open when your enrolment is confirmed.',
  /** Tail of the per-lesson locked notice, after "N content items — ". */
  lockedNote: 'locked until your enrolment is confirmed.',
} as const;

/** The line under the enrol panel. Names no payment rail this route cannot promise. */
export const PROSPECT_ENROL_NOTE =
  'Lessons open as soon as your enrolment is confirmed. Your certificate is issued by the platform on completion.';

/* ────────────────────────────────────────────────────────────────────────────
 * Formatting
 * ────────────────────────────────────────────────────────────────────────── */

export function formatCatalogueCount(value: number | undefined | null): string {
  return typeof value === 'number' ? new Intl.NumberFormat('en-KE').format(value) : CATALOGUE_PLACEHOLDER;
}

/**
 * ISO date or `Date` → "12 Mar 2026", `undefined` for anything unparseable.
 *
 * Parsed as UTC on purpose: these are bare calendar days, and rendering one in
 * the reader's own zone is how a course updated on the 12th starts reading as
 * the 11th to anyone west of GMT. The generated client types this as a `Date`
 * but a server response that never went through a transform hands over a
 * string, so both are accepted.
 */
export function formatCatalogueDate(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = dayjs.utc(value instanceof Date ? value.toISOString() : value);
  return date.isValid() ? date.format('D MMM YYYY') : undefined;
}

/** "18 – 45", "18 and over", "Up to 16" — or nothing when neither limit is set. */
export function formatAgeRange(
  lower: number | null | undefined,
  upper: number | null | undefined
): string | undefined {
  if (typeof lower === 'number' && typeof upper === 'number') return `${lower} – ${upper}`;
  if (typeof lower === 'number') return `${lower} and over`;
  if (typeof upper === 'number') return `Up to ${upper}`;
  return undefined;
}

/** "Nairobi Skills Institute" → "NS". */
export function catalogueInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}
