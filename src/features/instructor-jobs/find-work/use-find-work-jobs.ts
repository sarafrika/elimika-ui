'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { getEffectiveJobStatus } from '@/components/profile-job-marketplace/job-expiration';
import {
  useCoursesByIds,
  useOrganisationsByIds,
  useProgramsByIds,
} from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import {
  listJobsInfiniteOptions,
  listJobsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassMarketplaceJob, Organisation } from '@/services/client/types.gen';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

import { type JobReadinessRow, useJobsReadiness } from '../hooks/use-jobs-readiness';
import { type JobFacts, jobFacts } from '../job-facts';
import type { FindWorkFilters } from './find-work-filters';

/** Matches the eligibility batch limit, so each loaded page is one eligibility call. */
export const FIND_WORK_PAGE_SIZE = 50;

export type FindWorkRow = JobReadinessRow & {
  job: ClassMarketplaceJob;
  facts: JobFacts;
  organisation: Organisation | undefined;
  contentTitle: string | null;
};

export type FacetOption = { value: string; label: string };

const byLabel = (a: FacetOption, b: FacetOption) => a.label.localeCompare(b.label);

/** Open jobs for Find work, with readiness for each and the options its selects offer. */
export function useFindWorkJobs(
  filters: Pick<FindWorkFilters, 'organisation' | 'course' | 'program'>,
  now: number
) {
  const profile = useUserProfile();
  const enabled = Boolean(profile?.uuid);
  const serverFiltered = Boolean(filters.organisation || filters.course || filters.program);

  const list = useInfiniteQuery({
    ...listJobsInfiniteOptions({
      query: {
        status: 'open',
        ...(filters.organisation ? { organisation_uuid: filters.organisation } : {}),
        ...(filters.program
          ? { program_uuid: filters.program }
          : filters.course
            ? { course_uuid: filters.course }
            : {}),
        pageable: { page: 0, size: FIND_WORK_PAGE_SIZE },
      },
    }),
    enabled,
    staleTime: STALE_TIMES.live,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const metadata = lastPage.data?.metadata;
      const next = (metadata?.pageNumber ?? pages.length - 1) + 1;
      const hasNext =
        metadata?.hasNext ??
        (metadata?.totalPages != null
          ? next < metadata.totalPages
          : (lastPage.data?.content?.length ?? 0) === FIND_WORK_PAGE_SIZE);
      return hasNext ? { query: { pageable: { page: next, size: FIND_WORK_PAGE_SIZE } } } : undefined;
    },
  });

  // Select options stay complete while a server filter narrows the list itself.
  const facets = useQuery({
    ...listJobsOptions({
      query: { status: 'open', pageable: { page: 0, size: FIND_WORK_PAGE_SIZE } },
    }),
    enabled: enabled && serverFiltered,
    staleTime: STALE_TIMES.live,
  });

  const pages = list.data?.pages;
  const idGroups = useMemo(
    () =>
      (pages ?? []).map(page =>
        (page.data?.content ?? [])
          .filter(job => getEffectiveJobStatus(job, now) === 'open')
          .flatMap(job => (job.uuid ? [job.uuid] : []))
      ),
    [pages, now]
  );
  const jobs = useMemo(
    () =>
      (pages ?? [])
        .flatMap(page => page.data?.content ?? [])
        .filter(job => job.uuid && getEffectiveJobStatus(job, now) === 'open'),
    [pages, now]
  );
  const facetJobs = useMemo(
    () => (serverFiltered ? (facets.data?.data?.content ?? []) : jobs),
    [serverFiltered, facets.data, jobs]
  );

  const organisationIds = useMemo(
    () =>
      Array.from(
        new Set(
          [...jobs, ...facetJobs].flatMap(job => job.organisation_uuid ?? []).concat(
            filters.organisation ?? []
          )
        )
      ),
    [jobs, facetJobs, filters.organisation]
  );
  const courseIds = useMemo(
    () =>
      Array.from(
        new Set(
          [...jobs, ...facetJobs]
            .flatMap(job => (job.program_uuid ? [] : (job.course_uuid ?? [])))
            .concat(filters.course ?? [])
        )
      ),
    [jobs, facetJobs, filters.course]
  );
  const programIds = useMemo(
    () =>
      Array.from(
        new Set(
          [...jobs, ...facetJobs]
            .flatMap(job => job.program_uuid ?? [])
            .concat(filters.program ?? [])
        )
      ),
    [jobs, facetJobs, filters.program]
  );
  const { organisationMap } = useOrganisationsByIds(organisationIds);
  const { courseMap } = useCoursesByIds(courseIds);
  const { programMap } = useProgramsByIds(programIds);

  const contentTitleFor = useCallback(
    (job: ClassMarketplaceJob) =>
      (job.program_uuid
        ? programMap[job.program_uuid]?.title
        : job.course_uuid
          ? courseMap[job.course_uuid]?.name
          : null) ?? null,
    [courseMap, programMap]
  );

  const readiness = useJobsReadiness({ jobs, idGroups, contentTitleFor, now, enabled });
  const factsByJob = useMemo(
    () => new Map(jobs.map(job => [job.uuid ?? '', jobFacts(job)] as const)),
    [jobs]
  );

  const rows = useMemo<FindWorkRow[]>(
    () =>
      jobs.flatMap(job => {
        const row = readiness.rows.get(job.uuid ?? '');
        const facts = factsByJob.get(job.uuid ?? '');
        if (!row || !facts) return [];
        return [
          {
            ...row,
            job,
            facts,
            organisation: job.organisation_uuid ? organisationMap[job.organisation_uuid] : undefined,
            contentTitle: contentTitleFor(job),
          },
        ];
      }),
    [jobs, readiness.rows, factsByJob, organisationMap, contentTitleFor]
  );

  const organisationOptions = useMemo<FacetOption[]>(
    () =>
      organisationIds
        .map(uuid => ({ value: uuid, label: organisationMap[uuid]?.name ?? 'Organisation' }))
        .sort(byLabel),
    [organisationIds, organisationMap]
  );
  const contentOptions = useMemo<FacetOption[]>(
    () =>
      [
        ...courseIds.map(uuid => ({
          value: `course:${uuid}`,
          label: courseMap[uuid]?.name ?? 'Course',
        })),
        ...programIds.map(uuid => ({
          value: `program:${uuid}`,
          label: `${programMap[uuid]?.title ?? 'Training program'} (program)`,
        })),
      ].sort(byLabel),
    [courseIds, programIds, courseMap, programMap]
  );

  const firstPage = pages?.[0]?.data?.metadata;
  return {
    rows,
    list,
    totalOpen: firstPage?.totalElements == null ? undefined : Number(firstPage.totalElements),
    loading: !enabled || (list.isLoading && !list.data),
    eligibility: readiness.eligibility,
    organisationOptions,
    contentOptions,
  };
}
