// admin-boundary: foundation
import type { QueryClient } from '@tanstack/react-query';
import {
  invalidateContentModerationWorkflowQueries,
  invalidateDomainVerificationWorkflowQueries,
  invalidateGeneratedQueryIds,
} from '@/src/features/dashboard/workflow-query-invalidation';
import { ADMIN_STALE_TIME } from './admin-keys';

/**
 * Freshness presets. A queue is the only thing an admin watches change under them, so
 * it is the only thing that refetches on focus.
 */
/**
 * A failing admin read is shown, not retried into a long shimmer. The generated client
 * throws the API's error body, which carries no HTTP status, so a status-aware predicate
 * cannot tell a 500 from a dropped connection and would retry both — that retry is what
 * put a second identical request on the wire behind every failing section. One attempt,
 * then the error state with its Retry button, which is the recovery path an admin can see.
 */
const FAIL_FAST = { retry: false } as const;

export const queueQuery = {
  staleTime: ADMIN_STALE_TIME.queue,
  refetchOnWindowFocus: true,
  ...FAIL_FAST,
} as const;

export const listQuery = {
  staleTime: ADMIN_STALE_TIME.list,
  ...FAIL_FAST,
} as const;

export const configQuery = {
  staleTime: ADMIN_STALE_TIME.config,
  ...FAIL_FAST,
} as const;

/**
 * Queries the shared workflow invalidators miss. Platform counts, the activity feed and
 * a person's own record all change when an admin decides something, and none of them
 * are in the workflow id lists.
 */
const ADMIN_SIDE_EFFECT_QUERY_IDS = [
  'getDashboardStatistics',
  'getDashboardActivity',
  'getUserActivity',
  'getUserByUuid',
  'getAllUsers',
  'search',
  'search2',
  'getAdminUsers',
  'getSystemAdminUsers',
  'getOrganizationAdminUsers',
  'getUnverifiedCourseCreators',
  'getVerifiedCourseCreators',
  'countCourseCreatorsByVerificationStatus',
] as const;

/** Refresh everything a verification decision touches. */
export async function invalidateAfterVerification(queryClient: QueryClient) {
  await Promise.all([
    invalidateDomainVerificationWorkflowQueries(queryClient),
    invalidateGeneratedQueryIds(queryClient, ADMIN_SIDE_EFFECT_QUERY_IDS),
  ]);
}

/** Refresh everything a course, edit or program decision touches. */
export async function invalidateAfterModeration(queryClient: QueryClient) {
  await Promise.all([
    invalidateContentModerationWorkflowQueries(queryClient),
    invalidateGeneratedQueryIds(queryClient, ADMIN_SIDE_EFFECT_QUERY_IDS),
  ]);
}

/** Refresh the platform counts and the activity feed after any other admin write. */
export async function invalidateAdminOverview(queryClient: QueryClient) {
  await invalidateGeneratedQueryIds(queryClient, ADMIN_SIDE_EFFECT_QUERY_IDS);
}
