/**
 * Query keys for admin-owned reads that are composed in the console rather than taken
 * straight from a generated hook (queues, dossiers, joined lists). Generated queries keep
 * their own keys — never re-key those here, or invalidation stops matching.
 */
export const adminKeys = {
  all: ['admin'] as const,

  dashboard: () => [...adminKeys.all, 'dashboard'] as const,

  reviewQueue: () => [...adminKeys.all, 'review-queue'] as const,
  reviewQueueList: (filters: { type?: string; page?: number; size?: number }) =>
    [...adminKeys.reviewQueue(), 'list', filters] as const,

  people: () => [...adminKeys.all, 'people'] as const,
  peopleList: (filters: Record<string, string | number | undefined>) =>
    [...adminKeys.people(), 'list', filters] as const,
  person: (userUuid: string) => [...adminKeys.people(), 'detail', userUuid] as const,
  personTab: (userUuid: string, tab: string) => [...adminKeys.person(userUuid), tab] as const,

  organisations: () => [...adminKeys.all, 'organisations'] as const,
  organisationsList: (filters: Record<string, string | number | undefined>) =>
    [...adminKeys.organisations(), 'list', filters] as const,
  organisation: (uuid: string) => [...adminKeys.organisations(), 'detail', uuid] as const,
  organisationTab: (uuid: string, tab: string) => [...adminKeys.organisation(uuid), tab] as const,

  content: () => [...adminKeys.all, 'content'] as const,
  courseList: (filters: Record<string, string | number | undefined>) =>
    [...adminKeys.content(), 'courses', filters] as const,
  courseReview: (uuid: string) => [...adminKeys.content(), 'course', uuid] as const,
  programList: (filters: Record<string, string | number | undefined>) =>
    [...adminKeys.content(), 'programs', filters] as const,

  finance: () => [...adminKeys.all, 'finance'] as const,
  revenue: (range: string) => [...adminKeys.finance(), 'revenue', range] as const,
  sales: (filters: Record<string, string | number | undefined>) =>
    [...adminKeys.finance(), 'sales', filters] as const,

  platform: () => [...adminKeys.all, 'platform'] as const,
} as const;

/**
 * How fresh each kind of admin read needs to be. Queues are the only thing an admin
 * watches change under them, so they alone refetch on focus.
 */
export const ADMIN_STALE_TIME = {
  /** Review queues and their counts. */
  queue: 15_000,
  /** Lists and records. */
  list: 60_000,
  /** Currencies, categories, rules, config lists. */
  config: 10 * 60_000,
} as const;
