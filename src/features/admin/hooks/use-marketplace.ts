'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { extractEntity, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { toNumber } from '@/lib/metrics';
import type { ClassMarketplaceJob, ClassMarketplaceJobApplication } from '@/services/client';
import {
  getJobOptions,
  listJobApplicationsOptions,
  listJobsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { listQuery } from '../lib/admin-queries';

export const JOBS_PAGE_SIZE = 20;
export const APPLICATIONS_PAGE_SIZE = 50;

/** The lifecycle a marketplace job moves through, in the order the API reports it. */
export const JOB_STATUSES = [
  'open',
  'awaiting_class',
  'filled',
  'cancelled',
  'expired',
] as const;

/** The pipeline an application walks, with the three closed outcomes at the end. */
export const APPLICATION_PIPELINE = [
  'pending',
  'shortlisted',
  'interviewing',
  'offered',
  'hired',
  'assigned',
] as const;

export const APPLICATION_CLOSED = ['rejected', 'not_selected', 'withdrawn'] as const;

export interface JobFilters {
  organisationUuid?: string;
  courseUuid?: string;
  programUuid?: string;
  branchUuid?: string;
  /** One of JOB_STATUSES; anything else means no filter. */
  status?: string;
  page?: number;
}

/** Server-paged marketplace jobs. The API always returns newest first. */
export function useMarketplaceJobs(filters: JobFilters) {
  const page = filters.page ?? 0;

  const query = useQuery({
    ...listJobsOptions({
      query: {
        organisation_uuid: filters.organisationUuid || undefined,
        course_uuid: filters.courseUuid || undefined,
        program_uuid: filters.programUuid || undefined,
        branch_uuid: filters.branchUuid || undefined,
        status: filters.status || undefined,
        pageable: { page, size: JOBS_PAGE_SIZE },
      },
    }),
    ...listQuery,
  });

  const { jobs, totalRows, pageCount } = useMemo(() => {
    const { items, metadata } = extractPage<ClassMarketplaceJob>(query.data);
    return {
      jobs: items,
      totalRows: getTotalFromMetadata(metadata),
      pageCount: toNumber(metadata.totalPages ?? 1),
    };
  }, [query.data]);

  return { jobs, totalRows, pageCount, page, query };
}

/** One job, for the record page. */
export function useMarketplaceJob(jobUuid: string) {
  const query = useQuery({
    ...getJobOptions({ path: { jobUuid } }),
    ...listQuery,
    enabled: Boolean(jobUuid),
  });

  const job = useMemo(() => extractEntity<ClassMarketplaceJob>(query.data), [query.data]);
  return { job, query };
}

/** Every application on a job, in one page — the pipeline summary counts them all. */
export function useJobApplications(jobUuid: string, enabled = true) {
  const query = useQuery({
    ...listJobApplicationsOptions({
      path: { jobUuid },
      query: { pageable: { page: 0, size: APPLICATIONS_PAGE_SIZE } },
    }),
    ...listQuery,
    enabled: enabled && Boolean(jobUuid),
  });

  const applications = useMemo(
    () => extractPage<ClassMarketplaceJobApplication>(query.data).items,
    [query.data]
  );

  const pipeline = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const application of applications) {
      const status = application.status ?? 'pending';
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }, [applications]);

  return { applications, pipeline, query };
}
