import { useCallback, useState } from 'react';
import { dayjs } from '@/lib/date';

export type CalendarRangeView = 'day' | 'week' | 'month' | 'year';

/** Inclusive `YYYY-MM-DD` bounds a calendar fetches for what is on screen. */
export type CalendarFetchRange = { start: string; end: string; focus: string };

const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Day, week and month views share the focused month padded by a week either side, so paging
 * through weeks reuses one cached request; year view asks for that calendar year only.
 */
export function calendarFetchRange(focus: Date, view: CalendarRangeView): CalendarFetchRange {
  const anchor = dayjs(focus);
  const [start, end] =
    view === 'year'
      ? [anchor.startOf('year'), anchor.endOf('year')]
      : [anchor.startOf('month').subtract(7, 'day'), anchor.endOf('month').add(7, 'day')];

  return {
    start: start.format(DATE_FORMAT),
    end: end.format(DATE_FORMAT),
    focus: anchor.format(DATE_FORMAT),
  };
}

/** Holds the fetch range for a calendar; the setter is stable and ignores no-op updates. */
export function useCalendarFetchRange(initialView: CalendarRangeView = 'week') {
  const [range, setRange] = useState(() => calendarFetchRange(new Date(), initialView));

  const updateRange = useCallback((focus: Date, view: CalendarRangeView) => {
    const next = calendarFetchRange(focus, view);
    setRange(prev =>
      prev.start === next.start && prev.end === next.end && prev.focus === next.focus ? prev : next
    );
  }, []);

  return [range, updateRange] as const;
}
