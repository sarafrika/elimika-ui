/**
 * Pure helpers behind the course-record shell's header and section tabs. Kept
 * out of the component so the tab resolution and the key-fact strip can be unit
 * tested without rendering.
 */

import type { CourseRecordTabId } from './types';

/**
 * The tabs the row shows: the capability map's allowed tabs, in its order, less
 * any the caller passed no panel for, so the row never advertises an empty page.
 */
export function visibleCourseRecordTabs(
  allowed: readonly CourseRecordTabId[],
  panels: Partial<Record<CourseRecordTabId, unknown>> | undefined
): CourseRecordTabId[] {
  return allowed.filter(tab => Boolean(panels?.[tab]));
}

/**
 * The open tab: the requested one when this viewer has it, else the first tab the
 * row shows. A `?tab=` left over from another viewer (say `commercials` on a
 * learner's screen) lands on the first tab rather than on nothing.
 */
export function resolveCourseRecordTab(
  requested: CourseRecordTabId | undefined,
  tabs: readonly CourseRecordTabId[]
): CourseRecordTabId | undefined {
  return requested && tabs.includes(requested) ? requested : tabs[0];
}

export type CourseHeaderFactKey = 'lessons' | 'content' | 'level' | 'enrolled' | 'rating';

export interface CourseHeaderFact {
  key: CourseHeaderFactKey;
  /** The bolded figure; omitted for a fact that is a phrase. */
  value?: string;
  label: string;
}

export interface CourseHeaderFactInput {
  lessonCount?: number;
  contentItemCount?: number;
  /** The capability map's `content.countNote`, e.g. `locked`. */
  contentCountNote?: string;
  level?: string;
  enrolledCount?: number;
  averageRating?: number;
  totalReviews?: number;
}

const count = (value: number) => new Intl.NumberFormat('en-KE').format(value);
const plural = (value: number, one: string, many: string) => (value === 1 ? one : many);

/**
 * The header card's key-fact strip. Only facts the response carried are listed:
 * an absent figure is left out rather than shown as a dash or a zero.
 */
export function courseHeaderFacts(input: CourseHeaderFactInput): CourseHeaderFact[] {
  const facts: CourseHeaderFact[] = [];

  if (typeof input.lessonCount === 'number') {
    facts.push({
      key: 'lessons',
      value: count(input.lessonCount),
      label: plural(input.lessonCount, 'lesson', 'lessons'),
    });
  }
  if (typeof input.contentItemCount === 'number') {
    const noun = plural(input.contentItemCount, 'content item', 'content items');
    facts.push({
      key: 'content',
      value: count(input.contentItemCount),
      label: input.contentCountNote ? `${noun} (${input.contentCountNote})` : noun,
    });
  }
  if (input.level) {
    facts.push({ key: 'level', label: input.level });
  }
  if (typeof input.enrolledCount === 'number') {
    facts.push({ key: 'enrolled', value: count(input.enrolledCount), label: 'enrolled' });
  }
  if (typeof input.averageRating === 'number' && (input.totalReviews ?? 0) > 0) {
    const reviews = input.totalReviews ?? 0;
    facts.push({
      key: 'rating',
      value: input.averageRating.toFixed(1),
      label: `(${count(reviews)} ${plural(reviews, 'review', 'reviews')})`,
    });
  }

  return facts;
}
