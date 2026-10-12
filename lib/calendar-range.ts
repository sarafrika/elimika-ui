import { useCallback, useState } from 'react';
import { dayjs } from '@/lib/date';

export type CalendarRangeView = 'day' | 'week' | 'month' | 'year';

/** Inclusive `YYYY-MM-DD` bounds a calendar fetches for what is on screen. */
export type CalendarFetchRange = {
  start: string;
  end: string;
  /** Focused day as the grid keys it; `zone` is the IANA zone the grid displays in. */
  focus: string;
  zone?: string;
};

const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Day, week and month views share the focused month's whole grid (leading and trailing weeks)
 * plus a week of slack, so paging through weeks reuses one request; year view asks for the year.
 */
export function calendarFetchRange(
  focus: Date,
  view: CalendarRangeView,
  zone?: string
): CalendarFetchRange {
  const anchor = dayjs(focus);
  const [start, end] =
    view === 'year'
      ? [anchor.startOf('year'), anchor.endOf('year')]
      : [
          anchor.startOf('month').startOf('week').subtract(7, 'day'),
          anchor.endOf('month').endOf('week').add(7, 'day'),
        ];

  return {
    start: start.format(DATE_FORMAT),
    end: end.format(DATE_FORMAT),
    focus: anchor.format(DATE_FORMAT),
    zone,
  };
}

/** Holds the fetch range for a calendar; the setter is stable and ignores no-op updates. */
export function useCalendarFetchRange(initialView: CalendarRangeView = 'week') {
  const [range, setRange] = useState(() => calendarFetchRange(new Date(), initialView));

  const updateRange = useCallback((focus: Date, view: CalendarRangeView, zone?: string) => {
    const next = calendarFetchRange(focus, view, zone);
    setRange(prev =>
      prev.start === next.start &&
      prev.end === next.end &&
      prev.focus === next.focus &&
      prev.zone === next.zone
        ? prev
        : next
    );
  }, []);

  return [range, updateRange] as const;
}
