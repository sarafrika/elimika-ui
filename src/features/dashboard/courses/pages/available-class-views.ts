import { parseApiDate } from '@/lib/date';
import { classCardFacts } from '@/src/features/find-classes/class-card-facts';
import {
  CLASS_VIEWS,
  type ClassView,
  classViewCounts,
  classViewPage,
  paginateClassMatches,
} from '@/src/features/find-classes/class-views';
import type { BundledClass } from '../types';

export type AvailableClassView = ClassView | 'enrolled';
export const AVAILABLE_CLASS_VIEWS: readonly { id: AvailableClassView; label: string }[] = [
  ...CLASS_VIEWS.filter(view => view.id !== 'closed'),
  { id: 'enrolled', label: 'Enrolled' },
  { id: 'closed', label: 'Closed' },
];

type StatusSource = Parameters<typeof classCardFacts>[0] &
  Pick<
    BundledClass,
    | 'schedule'
    | 'scheduleLoaded'
    | 'academic_period_end_date'
    | 'scheduled_session_count'
    | 'completed_session_count'
    | 'isStudentEnrolled'
  >;

/** Dated course listings carry an academic end; undated ones carry a batched timetable. */
export function availableClassStatus(cls: StatusSource, now = new Date()) {
  const facts = classCardFacts(cls, cls.schedule, undefined, now);
  const academicEnd = parseApiDate(cls.academic_period_end_date)?.toDate();
  const sessionCount = Number(cls.scheduled_session_count ?? 0);
  const endedWithoutSchedule =
    !cls.scheduleLoaded &&
    (Boolean(academicEnd && academicEnd.getTime() <= now.getTime()) ||
      (sessionCount > 0 && Number(cls.completed_session_count ?? 0) >= sessionCount));
  return {
    facts: endedWithoutSchedule
      ? {
          ...facts,
          closed: true,
          closedReason: 'ended' as const,
          closingSoon: false,
          startsThisWeek: false,
        }
      : facts,
    enrolled: cls.isStudentEnrolled === true,
  };
}

type StatusCard = ReturnType<typeof availableClassStatus>;

export function availableClassCounts(cards: readonly StatusCard[]) {
  return { ...classViewCounts(cards), enrolled: cards.filter(card => card.enrolled).length };
}

export function availableClassPage<T extends StatusCard>(
  cards: readonly T[],
  view: AvailableClassView,
  page: number,
  pageSize: number
) {
  return view === 'enrolled'
    ? paginateClassMatches(
        cards.filter(card => card.enrolled),
        page,
        pageSize
      )
    : classViewPage(cards, view, page, pageSize);
}
