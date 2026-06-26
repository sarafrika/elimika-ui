import { DEFAULT_ANALYTICS_FILTERS, type InstructorAnalyticsFilters } from './analytics-filters';

export type AnalyticsTab =
  | 'Overview'
  | 'Session Report'
  | 'Program Report'
  | 'Instructor Report'
  | 'Participant Report'
  | 'Location Report'
  | 'Trend Report'
  | 'Custom Report';

type SearchParamsLike = {
  get(name: string): string | null;
};

export const DEFAULT_ANALYTICS_TAB: AnalyticsTab = 'Overview';

const VALID_TABS: AnalyticsTab[] = [
  'Overview',
  'Session Report',
  'Program Report',
  'Instructor Report',
  'Participant Report',
  'Location Report',
  'Trend Report',
  'Custom Report',
];

const normalizeStatuses = (statuses?: string[]) => {
  if (!statuses || statuses.length === 0) {
    return [...DEFAULT_ANALYTICS_FILTERS.statuses];
  }

  return statuses;
};

export const normalizeAnalyticsFilters = (
  filters?: Partial<InstructorAnalyticsFilters>
): InstructorAnalyticsFilters => ({
  ...DEFAULT_ANALYTICS_FILTERS,
  ...filters,
  statuses: normalizeStatuses(filters?.statuses),
});

export const parseAnalyticsFiltersFromSearchParams = (
  searchParams: SearchParamsLike
): InstructorAnalyticsFilters => {
  const rawStatuses = searchParams.get('status');
  const statuses =
    rawStatuses === null
      ? DEFAULT_ANALYTICS_FILTERS.statuses
      : rawStatuses === ''
        ? []
        : rawStatuses.split(',').map((value) => value.trim()).filter(Boolean);

  return normalizeAnalyticsFilters({
    dateFrom: searchParams.get('dateFrom') ?? '',
    dateTo: searchParams.get('dateTo') ?? '',
    program: searchParams.get('program') ?? DEFAULT_ANALYTICS_FILTERS.program,
    location: searchParams.get('location') ?? DEFAULT_ANALYTICS_FILTERS.location,
    statuses,
  });
};

export const parseAnalyticsTabFromSearchParams = (
  searchParams: SearchParamsLike
): AnalyticsTab => {
  const rawTab = searchParams.get('tab');

  if (!rawTab) {
    return DEFAULT_ANALYTICS_TAB;
  }

  return VALID_TABS.includes(rawTab as AnalyticsTab)
    ? (rawTab as AnalyticsTab)
    : DEFAULT_ANALYTICS_TAB;
};

export const buildAnalyticsSearchParams = (params: {
  filters: InstructorAnalyticsFilters;
  tab: AnalyticsTab;
}) => {
  const searchParams = new URLSearchParams();
  const { filters, tab } = params;

  if (filters.dateFrom) {
    searchParams.set('dateFrom', filters.dateFrom);
  }

  if (filters.dateTo) {
    searchParams.set('dateTo', filters.dateTo);
  }

  if (filters.program !== DEFAULT_ANALYTICS_FILTERS.program) {
    searchParams.set('program', filters.program);
  }

  if (filters.location !== DEFAULT_ANALYTICS_FILTERS.location) {
    searchParams.set('location', filters.location);
  }

  if (filters.statuses.length !== DEFAULT_ANALYTICS_FILTERS.statuses.length) {
    searchParams.set('status', filters.statuses.join(','));
  }

  if (tab !== DEFAULT_ANALYTICS_TAB) {
    searchParams.set('tab', tab);
  }

  return searchParams;
};
