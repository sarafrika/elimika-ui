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
export const queueQuery = {
  staleTime: ADMIN_STALE_TIME.queue,
  refetchOnWindowFocus: true,
} as const;

export const listQuery = {
  staleTime: ADMIN_STALE_TIME.list,
} as const;

export const configQuery = {
  staleTime: ADMIN_STALE_TIME.config,
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
