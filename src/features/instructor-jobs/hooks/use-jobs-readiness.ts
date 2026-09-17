'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useInstructor } from '@/context/instructor-context';
import { useCourseCreatorsByIds } from '@/hooks/use-batched-lookups';
import { APPROVAL_QUERY_FRESHNESS, STALE_TIMES } from '@/lib/query-client';
import { rateFor } from '@/lib/rate-card';
import {
  getJobsEligibilityOptions,
  listMyApplicationsOptions,
  listProgramTrainingApplicationRateUpdatesOptions,
  listTrainingRateUpdatesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  ClassMarketplaceJob,
  ClassMarketplaceJobApplication,
  ClassMarketplaceJobEligibility,
} from '@/services/client/types.gen';
import {
  type TrainingApplicationEntry,
  useTrainingApplicationList,
} from '@/src/features/rate-card/hooks';

import { myApplicationsQueryArgs } from '../job-queries';
import { type JobReadiness, jobReadiness, type PendingRate } from '../job-readiness';

/** The batch eligibility endpoint refuses more than this many ids per call. */
export const ELIGIBILITY_BATCH_SIZE = 50;

const NO_PENDING: PendingRate = { loading: false, awaiting: false, creatorName: null };

const time = (value?: Date | string | null) => (value ? new Date(value).getTime() : 0);

/** One eligibility call per group of on-screen job ids (a list page), each at most 50 ids. */
export function useJobsEligibility(idGroups: string[][], enabled = true) {
  const groups = useMemo(
    () =>
      idGroups.flatMap(group => {
        const ids = Array.from(new Set(group.filter(Boolean))).sort();
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += ELIGIBILITY_BATCH_SIZE) {
          chunks.push(ids.slice(i, i + ELIGIBILITY_BATCH_SIZE));
        }
        return chunks;
      }),
    [idGroups]
  );

  return useQueries({
    queries: groups.map(ids => ({
      ...getJobsEligibilityOptions({ query: { job_uuids: ids } }),
      staleTime: STALE_TIMES.live,
      enabled,
    })),
    combine: results => {
      const byJob = new Map<string, ClassMarketplaceJobEligibility>();
      for (const result of results) {
        for (const item of result.data?.data ?? []) {
          if (item.job_uuid) byJob.set(item.job_uuid, item);
        }
      }
      return {
        byJob,
        loading: results.some(result => result.isLoading),
        error: results.find(result => result.error)?.error ?? null,
        refetch: () => Promise.all(results.map(result => result.refetch())),
      };
    },
  });
}

/** The instructor's newest application per job, from the Jobs area's shared applications cache. */
export function useMyApplicationsByJob(enabled = true) {
  const query = useQuery({
    ...listMyApplicationsOptions(myApplicationsQueryArgs),
    staleTime: STALE_TIMES.live,
    enabled,
  });
  const rows = query.data?.data?.content;
  const byJob = useMemo(() => {
    const map = new Map<string, ClassMarketplaceJobApplication>();
    for (const row of rows ?? []) {
      if (!row.job_uuid) continue;
      const current = map.get(row.job_uuid);
      const rowTime = time(row.updated_date ?? row.created_date);
      if (!current || rowTime > time(current.updated_date ?? current.created_date)) {
        map.set(row.job_uuid, row);
      }
    }
    return map;
  }, [rows]);
  return { byJob, query };
}

/** A missing rate may already be proposed: that is the only case worth a rate-update lookup. */
const needsPendingCheck = (eligibility: ClassMarketplaceJobEligibility | undefined) =>
  Boolean(
    eligibility &&
      eligibility.instructor_verified !== false &&
      eligibility.training_approved !== false &&
      eligibility.rate_ok === false &&
      eligibility.approved_rate == null
  );

const parentOf = (job: ClassMarketplaceJob) =>
  job.program_uuid
    ? { kind: 'program' as const, uuid: job.program_uuid }
    : job.course_uuid
      ? { kind: 'course' as const, uuid: job.course_uuid }
      : null;

/**
 * Pending rate updates for every job whose rate is missing. The instructor's training
 * applications are read once (the rate card's own cache); proposed cards load only for
 * applications that carry a pending update.
 */
export function usePendingRates(
  jobs: ClassMarketplaceJob[],
  eligibilityByJob: Map<string, ClassMarketplaceJobEligibility>
) {
  const instructorUuid = useInstructor()?.uuid ?? '';
  const candidates = useMemo(
    () => jobs.filter(job => job.uuid && needsPendingCheck(eligibilityByJob.get(job.uuid))),
    [jobs, eligibilityByJob]
  );
  const enabled = candidates.length > 0 && Boolean(instructorUuid);
  const list = useTrainingApplicationList(
    { applicant_uuid_eq: instructorUuid, applicant_type_eq: 'instructor' },
    enabled
  );

  const entryFor = useCallback(
    (job: ClassMarketplaceJob): TrainingApplicationEntry | null => {
      const parent = parentOf(job);
      if (!parent) return null;
      const matches = list.entries.filter(
        entry => entry.kind === parent.kind && entry.parentUuid === parent.uuid
      );
      return (
        matches.find(entry => entry.application.pending_rate_update_uuid) ??
        matches.find(entry => entry.application.status === 'approved') ??
        matches[0] ??
        null
      );
    },
    [list.entries]
  );

  const pendingEntries = useMemo(() => {
    const seen = new Map<string, TrainingApplicationEntry>();
    for (const job of candidates) {
      const entry = entryFor(job);
      if (entry?.application.pending_rate_update_uuid) seen.set(entry.uuid, entry);
    }
    return Array.from(seen.values());
  }, [candidates, entryFor]);

  const updates = useQueries({
    queries: pendingEntries.map(entry => ({
      ...(entry.kind === 'program'
        ? listProgramTrainingApplicationRateUpdatesOptions({
            path: { programUuid: entry.parentUuid, applicationUuid: entry.uuid },
          })
        : listTrainingRateUpdatesOptions({
            path: { courseUuid: entry.parentUuid, applicationUuid: entry.uuid },
          })),
      ...APPROVAL_QUERY_FRESHNESS,
      staleTime: STALE_TIMES.live,
    })),
  });

  const creatorIds = useMemo(
    () =>
      Array.from(
        new Set(candidates.flatMap(job => entryFor(job)?.creatorUuid ?? []).filter(Boolean))
      ),
    [candidates, entryFor]
  );
  const { courseCreatorMap } = useCourseCreatorsByIds(creatorIds);

  return useCallback(
    (job: ClassMarketplaceJob): PendingRate => {
      if (!job.uuid || !needsPendingCheck(eligibilityByJob.get(job.uuid))) return NO_PENDING;
      if (!enabled) return NO_PENDING;
      if (list.loading) return { loading: true, awaiting: false, creatorName: null };
      const entry = entryFor(job);
      const creatorName = (entry?.creatorUuid && courseCreatorMap[entry.creatorUuid]?.full_name) || null;
      if (!entry?.application.pending_rate_update_uuid) {
        return { loading: false, awaiting: false, creatorName };
      }
      const index = pendingEntries.findIndex(item => item.uuid === entry.uuid);
      const result = updates[index];
      if (!result || (result.isLoading && !result.data)) {
        return { loading: true, awaiting: false, creatorName };
      }
      const pending = (result.data?.data ?? []).find(update => update.status === 'pending');
      const awaiting = Boolean(
        pending &&
          job.session_format &&
          job.location_type &&
          job.rate_basis &&
          rateFor(pending.proposed_rate_card, {
            format: job.session_format,
            delivery: job.location_type,
            basis: job.rate_basis,
          }) !== null
      );
      return { loading: false, awaiting, creatorName };
    },
    [eligibilityByJob, enabled, list.loading, entryFor, courseCreatorMap, pendingEntries, updates]
  );
}

export type JobReadinessRow = {
  eligibility: ClassMarketplaceJobEligibility | undefined;
  application: ClassMarketplaceJobApplication | null;
  /** Null while eligibility or a pending rate is still resolving, so no chip guesses. */
  readiness: JobReadiness | null;
  pendingRate: PendingRate;
};

/** Readiness for jobs on screen: batch eligibility, shared applications, one pending-rate read. */
export function useJobsReadiness({
  jobs,
  idGroups,
  contentTitleFor,
  now,
  enabled = true,
}: {
  jobs: ClassMarketplaceJob[];
  idGroups: string[][];
  contentTitleFor?: (job: ClassMarketplaceJob) => string | null;
  now: number;
  enabled?: boolean;
}) {
  const eligibility = useJobsEligibility(idGroups, enabled);
  const applications = useMyApplicationsByJob(enabled);
  const pendingFor = usePendingRates(jobs, eligibility.byJob);

  const rows = useMemo(() => {
    const map = new Map<string, JobReadinessRow>();
    for (const job of jobs) {
      if (!job.uuid) continue;
      const jobEligibility = eligibility.byJob.get(job.uuid);
      const application = applications.byJob.get(job.uuid) ?? null;
      const pendingRate = pendingFor(job);
      const readiness = jobReadiness({
        job,
        eligibility: jobEligibility,
        application,
        pendingRate: pendingRate.awaiting,
        creatorName: pendingRate.creatorName,
        contentTitle: contentTitleFor?.(job) ?? null,
        now,
      });
      const holdBack =
        readiness.state === 'checking' || (readiness.state === 'rate' && pendingRate.loading);
      map.set(job.uuid, {
        eligibility: jobEligibility,
        application,
        readiness: holdBack ? null : readiness,
        pendingRate,
      });
    }
    return map;
  }, [jobs, eligibility.byJob, applications.byJob, pendingFor, contentTitleFor, now]);

  return { rows, eligibility, applications };
}
