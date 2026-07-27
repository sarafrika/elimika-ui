export type InstructorAnalyticsFilters = {
  dateFrom: string;
  dateTo: string;
  program: string;
  location: string;
  statuses: string[];
};

export const ANALYTICS_STATUS_OPTIONS = ['Completed', 'Ongoing', 'Upcoming', 'Cancelled'] as const;

export const DEFAULT_ANALYTICS_FILTERS: InstructorAnalyticsFilters = {
  dateFrom: '',
  dateTo: '',
  program: 'all',
  location: 'all',
  statuses: [...ANALYTICS_STATUS_OPTIONS],
};
