/**
 * The small vocabulary the tab blocks share.
 *
 * Formatting and view models only — nothing here fetches, and nothing here
 * decides what a viewer may see (that is `COURSE_ACCESS_CAPABILITIES`). Keep it
 * small: anything that grows past a handful of lines belongs in its own block.
 */

import type { CourseTrainingRateCard } from '../types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

/** Rendered wherever a figure is genuinely absent. Never a zero. */
export const COURSE_PLACEHOLDER = '—';

dayjs.extend(utc);

/** Platform currency, used when a rate card or class price carries none. */
export const COURSE_DEFAULT_CURRENCY = 'KES';

/* ────────────────────────────────────────────────────────────────────────────
 * View models
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Which tint the format chip takes. Three formats, three chart hues — the one
 * exception the design mapping allows to the "brand tokens only" rule, because
 * these are categorical marks rather than brand surfaces.
 */
export type CourseClassFormatTone = 'online' | 'in-person' | 'blended';

/**
 * One class running this course, as the record's two class surfaces need it.
 *
 * `ClassDefinition` alone cannot fill this in — it carries no host name, no seat
 * take-up and no formatted schedule — so the route composes the row and the
 * blocks render it. Every field but `uuid` and `title` is optional on purpose:
 * a figure the response did not carry is left out, not defaulted to zero.
 */
export interface CourseClassRow {
  uuid: string;
  title: string;
  /** The organisation or instructor delivering it. */
  host?: string;
  /** Where it runs — "Westlands, Nairobi", or "Live online". */
  place?: string;
  /** Chip copy: "Blended", "Online · live", "In-person". */
  format?: string;
  formatTone?: CourseClassFormatTone;
  seatsTaken?: number;
  seatsTotal?: number;
  /** Pre-formatted run window, e.g. "6 Oct – 19 Dec 2026". */
  dates?: string;
  /** Pre-formatted recurrence, e.g. "Tue & Thu, 18:00–20:30". */
  schedule?: string;
  price?: number;
  /** ISO currency for {@link CourseClassRow.price}. */
  currency?: string;
  /** The line under the price, e.g. "full course". */
  priceNote?: string;
  /** True for the one class the signed-in learner is enrolled on. */
  enrolled?: boolean;
  /** False once registration has closed — listed, but not joinable. */
  openForEnrolment?: boolean;
}

/** One line of the "Before you can be enrolled" checklist. */
export interface CourseEligibilityCheck {
  id: string;
  label: string;
  /** True when the viewer already satisfies it. */
  met: boolean;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Formatting
 * ────────────────────────────────────────────────────────────────────────── */

export function formatCourseCount(value: number | undefined): string {
  return value === undefined ? COURSE_PLACEHOLDER : new Intl.NumberFormat('en-KE').format(value);
}

export function formatCourseMoney(
  amount: number | undefined,
  currency: string = COURSE_DEFAULT_CURRENCY
): string | undefined {
  if (amount === undefined) return undefined;
  return `${currency} ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(amount)}`;
}

/**
 * ISO date → "12 Mar 2026". `undefined` for anything unparseable.
 *
 * Parsed with `dayjs.utc` rather than `new Date` + `Intl`, for the reason `lib/date` exists: these
 * are bare calendar days, and rendering one in the viewer's own zone is how a registration window
 * that closes on the 12th starts reading as the 11th to anyone west of GMT. The day-first format
 * is the design's, and differs from `lib/date`'s month-first `formatDate` only in ordering.
 */
export function formatCourseDate(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = dayjs.utc(value instanceof Date ? value.toISOString() : value);
  return date.isValid() ? date.format('D MMM YYYY') : undefined;
}

export function clampCoursePercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/** Seats taken as a 0–100 percentage, or `undefined` when either side is absent. */
export function courseSeatFill(
  taken: number | undefined,
  total: number | undefined
): number | undefined {
  if (taken === undefined || total === undefined || total <= 0) return undefined;
  return clampCoursePercent((taken / total) * 100);
}

/** "Nairobi Skills Institute" → "NS". */
export function courseInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}

/* ────────────────────────────────────────────────────────────────────────────
 * Rate cards
 * ────────────────────────────────────────────────────────────────────────── */

/** The four hourly rates, in the order the commercials table lists them. */
const RATE_CARD_HOURLY = [
  { field: 'private_online_hourly_rate', label: 'private online' },
  { field: 'private_inperson_hourly_rate', label: 'private in-person' },
  { field: 'group_online_hourly_rate', label: 'group online' },
  { field: 'group_inperson_hourly_rate', label: 'group in-person' },
] as const satisfies ReadonlyArray<{ field: keyof CourseTrainingRateCard; label: string }>;

/**
 * The delivery table's "Rate card (from)" cell — the cheapest hourly rate on the
 * card and the format it buys: `KES 620/hr group online`.
 *
 * The card itself is only present for viewers the API sends one to. Callers pass
 * `trainer.rate_card` straight through; there is no fuller object to pick from.
 */
export function formatRateCardFrom(card: CourseTrainingRateCard): string | undefined {
  let cheapest: { rate: number; label: string } | undefined;

  for (const { field, label } of RATE_CARD_HOURLY) {
    const rate = card[field];
    if (typeof rate !== 'number' || !Number.isFinite(rate)) continue;
    if (!cheapest || rate < cheapest.rate) cheapest = { rate, label };
  }

  if (!cheapest) return undefined;
  const money = formatCourseMoney(cheapest.rate, card.currency ?? COURSE_DEFAULT_CURRENCY);
  return money === undefined ? undefined : `${money}/hr ${cheapest.label}`;
}
