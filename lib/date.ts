import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(advancedFormat);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

export { dayjs };

/**
 * Format a value as the `YYYY-MM-DD` string that the API's LocalDate
 * parameters require (e.g. timetable start/end). The generated client types
 * these as `Date`, but serializing a real Date produces a full ISO datetime,
 * which the backend rejects as a type mismatch.
 */
export function localDate(value: Date | string): Date {
  return dayjs(value).format('YYYY-MM-DD') as unknown as Date;
}
