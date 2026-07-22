import { formatDateOnly } from '@/lib/date';

/**
 * Format a course calendar date (start/end day). These are date-only values and
 * must not be shifted across time zones, so they are rendered in UTC via
 * {@link formatDateOnly} rather than `new Date(...).toLocaleDateString()`, which
 * misreads a zone-less timestamp as browser-local time.
 */
export const formatCourseDate = (dateString: string | undefined) =>
  formatDateOnly(dateString, 'Not specified');
