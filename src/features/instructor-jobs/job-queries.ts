import type {
  listJobsOptions,
  listMyApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';

/** Every application in one page, so badges and counts across the Jobs area share one cache entry. */
export const myApplicationsQueryArgs: Parameters<typeof listMyApplicationsOptions>[0] = {
  query: { pageable: { page: 0, size: 200 } },
};

/** One row is enough: only `metadata.totalElements` is read. */
export const openJobsCountQueryArgs: Parameters<typeof listJobsOptions>[0] = {
  query: { status: 'open', pageable: { page: 0, size: 1 } },
};
