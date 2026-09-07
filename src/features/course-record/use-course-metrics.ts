'use client';

/**
 * The two course-record endpoints that do not exist yet.
 *
 *   GET /api/v1/courses/{uuid}/stats     → CourseStats
 *   GET /api/v1/courses/{uuid}/trainers  → CourseTrainerSummary[]
 *
 * They are written out in full — request, response shape, staleTime, query key —
 * and held behind {@link COURSE_METRICS_ENDPOINTS_LIVE}. While that flag is
 * `false` the queries are disabled, so React Query reports `isPending` with
 * `fetchStatus: 'idle'`: `isLoading` is **false** and `data` is `undefined`.
 * Every consuming block therefore renders its `<AsyncSection>` *empty* state —
 * not a skeleton that spins forever — and lights up the moment the flag flips.
 *
 * Shipping the endpoints is a one-line change here. Nothing else moves.
 */

import { useQuery } from '@tanstack/react-query';

import { STALE_TIMES } from '@/lib/query-client';
import { client } from '@/services/client/client.gen';

import type { CourseStats, CourseTrainerSummary } from './types';

/** Flip to `true` the day both routes are deployed. */
export const COURSE_METRICS_ENDPOINTS_LIVE = false;

const BEARER = [{ scheme: 'bearer', type: 'http' }] as const;

/** `client.get<T>()` unwraps `T[keyof T]`, so the status-keyed shape is what it wants. */
type StatsResponses = {
  200: { success?: boolean; data?: CourseStats; message?: string; error?: unknown };
};

/**
 * The endpoint answers with an envelope rather than a bare array: `pending_count`
 * rides alongside the list and is present only for the creator and platform
 * admins, which is what the owner's "pending your decision" rail card counts.
 */
export interface CourseTrainersEnvelope {
  trainers: CourseTrainerSummary[];
  /** Owner and admin only; absent for every other viewer. */
  pending_count?: number;
}

type TrainersResponses = {
  200: { success?: boolean; data?: CourseTrainersEnvelope; message?: string; error?: unknown };
};

export const courseStatsQueryKey = (courseUuid: string | undefined) =>
  ['course-record', 'stats', courseUuid ?? null] as const;

export const courseTrainersQueryKey = (courseUuid: string | undefined) =>
  ['course-record', 'trainers', courseUuid ?? null] as const;

/**
 * Course performance. The response carries `public` for everyone, `scoped` only
 * for an approved trainer and `owner` only for the creator or an admin — the
 * server decides, and an absent block means "not yours to see".
 */
export function useCourseStats(courseUuid: string | undefined) {
  return useQuery({
    queryKey: courseStatsQueryKey(courseUuid),
    queryFn: async (): Promise<CourseStats | undefined> => {
      const { data, error } = await client.get<StatsResponses>({
        url: '/api/v1/courses/{uuid}/stats',
        path: { uuid: courseUuid ?? '' },
        security: BEARER,
      });
      if (error) throw error;
      return data?.data;
    },
    enabled: COURSE_METRICS_ENDPOINTS_LIVE && Boolean(courseUuid),
    staleTime: STALE_TIMES.live,
  });
}

/**
 * Everyone approved to deliver the course. `rate_card` comes back only for the
 * creator and platform admins; for anyone else the field is simply absent.
 */
export function useCourseTrainers(courseUuid: string | undefined) {
  return useQuery({
    queryKey: courseTrainersQueryKey(courseUuid),
    queryFn: async (): Promise<CourseTrainersEnvelope | undefined> => {
      const { data, error } = await client.get<TrainersResponses>({
        url: '/api/v1/courses/{uuid}/trainers',
        path: { uuid: courseUuid ?? '' },
        security: BEARER,
      });
      if (error) throw error;
      return data?.data;
    },
    enabled: COURSE_METRICS_ENDPOINTS_LIVE && Boolean(courseUuid),
    staleTime: STALE_TIMES.live,
  });
}
