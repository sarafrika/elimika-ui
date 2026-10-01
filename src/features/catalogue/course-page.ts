import { enumParam } from '@/lib/search-state';
import { stripRichText, toBulletLines } from '@/src/features/catalogue/format';
import type { CourseOpenClasses, OpenClassSummary } from '@/src/features/catalogue/open-classes';

/**
 * Pure helpers for the public course page (`/courses/[courseId]`). No React, no fetching:
 * the page's components read their copy and their decisions from here, and the unit tests
 * pin them.
 */

/* Tabs ------------------------------------------------------------------------------- */

export const COURSE_TABS = ['overview', 'requirements', 'syllabus', 'classes', 'similar'] as const;
export type CourseTab = (typeof COURSE_TABS)[number];

export const COURSE_TAB_LABELS: Record<CourseTab, string> = {
  overview: 'Overview',
  requirements: 'Requirements',
  syllabus: 'Syllabus',
  classes: 'Classes',
  similar: 'Similar courses',
};

/** `?tab=` on the course page. Anything unknown opens the overview. */
export const courseTabParam = enumParam(COURSE_TABS, 'overview');

/* Price ------------------------------------------------------------------------------ */

const AMOUNT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export const formatMoney = (amount: number, currencyCode?: string | null) =>
  `${currencyCode || 'KES'} ${AMOUNT.format(amount)}`;

/**
 * The "From …" figure: the lowest fee across the open classes, or null when there is no
 * open class to quote from. "Free" only when a real open class charges nothing; a course's
 * own `price` of 0 is not a fee and never reaches this label.
 */
export function priceFromLabel(
  offer: Pick<CourseOpenClasses, 'price_from' | 'currency_code' | 'open_class_count' | 'classes'>
): string | null {
  if (offer.open_class_count <= 0 || offer.classes.length === 0) return null;
  if (typeof offer.price_from !== 'number' || offer.price_from < 0) return null;
  if (offer.price_from === 0) {
    const freeClass = offer.classes.some(item => item.fee === 0 && item.availability !== 'FULL');
    return freeClass ? 'Free' : null;
  }
  return formatMoney(offer.price_from, offer.currency_code);
}

/** One class's fee, or null when the class states none. */
export function classFeeLabel(item: Pick<OpenClassSummary, 'fee' | 'currency_code'>) {
  if (typeof item.fee !== 'number' || item.fee < 0) return null;
  return item.fee === 0 ? 'Free' : formatMoney(item.fee, item.currency_code);
}

export const openClassesSentence = (count: number) =>
  `The lowest fee across ${count} open ${count === 1 ? 'class' : 'classes'}. Each class sets its own fee, place and schedule.`;

/* Classes ---------------------------------------------------------------------------- */

export const CLASS_FILTERS = ['all', 'in-person', 'online'] as const;
export type ClassFilter = (typeof CLASS_FILTERS)[number];

export const CLASS_FILTER_LABELS: Record<ClassFilter, string> = {
  all: 'All',
  'in-person': 'In person',
  online: 'Online',
};

/** A hybrid class meets in person and online, so it is listed under both. */
export function matchesClassFilter(
  item: Pick<OpenClassSummary, 'location_type'>,
  filter: ClassFilter
) {
  if (filter === 'all') return true;
  if (item.location_type === 'HYBRID') return true;
  return filter === 'online' ? item.location_type === 'ONLINE' : item.location_type === 'IN_PERSON';
}

/**
 * Cheapest first; a class without a stated fee after those, and full classes last of all.
 * Stable for equal fees.
 */
export function sortClassesByFee<T extends Pick<OpenClassSummary, 'fee' | 'availability'>>(
  items: readonly T[]
): T[] {
  const full = (item: T) => (item.availability === 'FULL' ? 1 : 0);
  const rank = (item: T) => (typeof item.fee === 'number' ? item.fee : Number.POSITIVE_INFINITY);
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => full(a.item) - full(b.item) || rank(a.item) - rank(b.item) || a.index - b.index)
    .map(entry => entry.item);
}

export function filterOpenClasses<
  T extends Pick<OpenClassSummary, 'location_type' | 'fee' | 'availability'>,
>(items: readonly T[], filter: ClassFilter): T[] {
  return sortClassesByFee(items.filter(item => matchesClassFilter(item, filter)));
}

export function classFilterCounts(
  items: readonly Pick<OpenClassSummary, 'location_type'>[]
): Record<ClassFilter, number> {
  return {
    all: items.length,
    'in-person': items.filter(item => matchesClassFilter(item, 'in-person')).length,
    online: items.filter(item => matchesClassFilter(item, 'online')).length,
  };
}

export const LOCATION_TYPE_LABELS = {
  IN_PERSON: 'In person',
  ONLINE: 'Online',
  HYBRID: 'Hybrid',
} as const;

export const SESSION_FORMAT_LABELS = {
  GROUP: 'Group',
  INDIVIDUAL: 'One-to-one',
} as const;

/** The card's heading: where the class meets. */
export function classPlace(item: OpenClassSummary) {
  return (
    item.place_name ||
    item.branch_name ||
    (item.location_type === 'ONLINE' ? 'Online class' : null) ||
    item.title ||
    'Class'
  );
}

export type AvailabilityChip = { label: string; tone: 'neutral' | 'warning' | 'muted' };

/** The availability band as a chip; seat numbers are never shown publicly. */
export function availabilityChip(
  item: Pick<OpenClassSummary, 'availability'>
): AvailabilityChip | null {
  switch (item.availability) {
    case 'OPEN':
      return { label: 'Open', tone: 'neutral' };
    case 'FEW_LEFT':
      return { label: 'Few seats left', tone: 'warning' };
    case 'FULL':
      return { label: 'Full', tone: 'muted' };
    default:
      return null;
  }
}

const DAY = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const DAY_YEAR = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const toDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDay = (value?: string | null) => {
  const date = toDate(value);
  return date ? DAY_YEAR.format(date) : null;
};

/** "12 Oct – 20 Dec 2026", "From 12 Oct 2026", or the announced-later line. */
export function classDatesLabel(item: Pick<OpenClassSummary, 'starts_on' | 'ends_on'>) {
  const start = toDate(item.starts_on);
  const end = toDate(item.ends_on);
  if (start && end) {
    const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
    return `${(sameYear ? DAY : DAY_YEAR).format(start)} – ${DAY_YEAR.format(end)}`;
  }
  if (start) return `From ${DAY_YEAR.format(start)}`;
  if (end) return `Until ${DAY_YEAR.format(end)}`;
  return 'Dates to be announced';
}

/* Requirements ----------------------------------------------------------------------- */

export type RequirementRow = {
  name?: string | null;
  description?: string | null;
  quantity?: number | null;
  unit?: string | null;
  requirement_type?: string | null;
  provided_by?: string | null;
  is_mandatory?: boolean | null;
};

const normalise = (value?: string | number | null) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Drops rows that repeat an earlier one exactly (same name, provider, type, quantity and
 * unit, ignoring case and spacing). A safety net: the course builder has been saving some
 * requirements twice.
 */
export function dedupeRequirements<T extends RequirementRow>(rows: readonly T[]): T[] {
  const seen = new Set<string>();
  return rows.filter(row => {
    if (!normalise(row.name)) return false;
    const key = [row.name, row.provided_by, row.requirement_type, row.quantity, row.unit]
      .map(normalise)
      .join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** The two cards: what the training provider has ready, and what the learner brings. */
export function splitRequirements<T extends RequirementRow>(rows: readonly T[]) {
  const unique = dedupeRequirements(rows);
  return {
    provided: unique.filter(row => normalise(row.provided_by) !== 'student'),
    bring: unique.filter(row => normalise(row.provided_by) === 'student'),
  };
}

const REQUIREMENT_TYPE_LABELS: Record<string, string> = {
  material: 'Material',
  equipment: 'Equipment',
  facility: 'Facility',
  other: 'Other',
};

/** "Equipment · 50 sets"; a unit of "other" says nothing, so it is left off. */
export function requirementMeta(row: RequirementRow) {
  const type = REQUIREMENT_TYPE_LABELS[normalise(row.requirement_type)];
  const unit = normalise(row.unit) === 'other' ? '' : (row.unit ?? '').trim();
  const quantity =
    typeof row.quantity === 'number' ? [row.quantity, unit].filter(Boolean).join(' ') : unit;
  return [type, quantity].filter(Boolean).join(' · ');
}

/* Rich text -------------------------------------------------------------------------- */

const withoutHeadings = (value?: string | null) =>
  (value ?? '').replace(/<\s*(h[1-6])[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, ' ');

/**
 * A rich-text description as one plain paragraph for the header. The builder's editor
 * often opens with a heading ("Course Description"), which says nothing in a summary, so
 * headings are left out unless they are all there is.
 */
export function toPlainSummary(value?: string | null) {
  const text = stripRichText(withoutHeadings(value)) || stripRichText(value);
  return text.replace(/\s*\n\s*/g, ' ').trim();
}

/**
 * Drops the empty paragraphs and the one heading that open a builder description ("Course
 * Description"): the page already titles the card. Headings further down stay.
 */
export function withoutLeadingHeading(html: string) {
  return html
    .replace(/^(?:\s|<p>\s*(?:<br\s*\/?>)?\s*<\/p>)*<\s*(h[1-6])[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/i, '')
    .replace(/^(?:\s|<p>\s*(?:<br\s*\/?>)?\s*<\/p>)+/i, '');
}

/**
 * Rich-text objectives or prerequisites as bullets: headings and lead-in lines that end
 * in a colon ("Learners should have:") are dropped, the rest kept in order.
 */
export function richTextBullets(value?: string | null) {
  return toBulletLines(withoutHeadings(value)).filter(line => !/:\s*$/.test(line));
}

/**
 * "Propagation materials set – Seed trays, …" → a short name and its detail. The builder
 * collects one free-text field, and most creators write "name – what it includes".
 */
export function splitRequirementName(name?: string | null) {
  const text = (name ?? '').replace(/\s+/g, ' ').trim();
  const match = /^(.{2,80}?)\s+[–—-]\s+(.+)$/.exec(text);
  return match ? { title: match[1] ?? text, detail: match[2] ?? '' } : { title: text, detail: '' };
}

/* Page model ------------------------------------------------------------------------- */

export type CoursePageLesson = { number: number; title: string; objective: string };

/** What the server hands the client page: plain, serialisable, already shaped. */
export type CoursePageModel = {
  uuid: string;
  title: string;
  /** Plain text for the header. */
  summary: string;
  /** Rich text for "About this course", already sanitised. */
  descriptionHtml: string;
  categories: string[];
  creatorName?: string;
  thumbnailUrl?: string;
  introVideoUrl?: string;
  difficultyUuid?: string;
  durationHours?: number;
  durationLabel?: string;
  objectives: string[];
  prerequisites: string[];
  requirements: RequirementRow[];
  lessons: CoursePageLesson[];
};
