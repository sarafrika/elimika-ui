'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { isLiveApplication } from '@/components/profile-job-marketplace/application-status';
import { isHiredApplication } from '@/components/profile-job-marketplace/hired-jobs';
import { getEffectiveJobStatus } from '@/components/profile-job-marketplace/job-expiration';
import {
  useCourseCreatorsByIds,
  useCoursesByIds,
  useOrganisationsByIds,
  useProgramsByIds,
} from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import { getJob } from '@/services/client';
import {
  getJobEligibilityOptions,
  getJobQueryKey,
  listJobsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassMarketplaceJob } from '@/services/client/types.gen';

import { useMyApplicationsByJob, usePendingRates } from '../hooks/use-jobs-readiness';
import { jobFacts } from '../job-facts';
import { jobReadiness, rateStandingFor } from '../job-readiness';

/** A missing or malformed job id reads as "not found", never as a failed section. */
function useJob(jobUuid: string) {
  return useQuery({
    queryKey: getJobQueryKey({ path: { jobUuid } }),
    queryFn: async ({ signal }) => {
      const { data, error, response } = await getJob({ path: { jobUuid }, signal });
      if (response?.status === 404 || response?.status === 400) return null;
      if (error) throw error;
      return data ?? null;
    },
    enabled: Boolean(jobUuid),
    staleTime: STALE_TIMES.live,
  });
}

/** Everything the instructor job page shows about one job, each part loading on its own. */
export function useJobPage(jobUuid: string, now: number) {
  const jobQuery = useJob(jobUuid);
  const job: ClassMarketplaceJob | null = jobQuery.data?.data ?? null;
  const facts = useMemo(() => (job ? jobFacts(job) : null), [job]);
  const open = job ? getEffectiveJobStatus(job, now) === 'open' : false;

  // The rail answers "can you apply" right now, so opening the page always re-asks.
  const eligibilityQuery = useQuery({
    ...getJobEligibilityOptions({ path: { jobUuid } }),
    staleTime: 0,
    enabled: Boolean(job?.uuid) && open,
  });
  const eligibility = eligibilityQuery.data?.data;

  const applications = useMyApplicationsByJob();
  const listed = applications.byJob.get(jobUuid) ?? null;
  const status = listed?.status ?? eligibility?.application_status;
  const application =
    isLiveApplication(status) || isHiredApplication(status) ? listed : null;
  const applied = isLiveApplication(status) || isHiredApplication(status);

  const jobs = useMemo(() => (job ? [job] : []), [job]);
  const eligibilityByJob = useMemo(
    () => new Map(eligibility ? [[jobUuid, eligibility] as const] : []),
    [eligibility, jobUuid]
  );
  const pendingFor = usePendingRates(jobs, eligibilityByJob);
  const pendingRate = job
    ? pendingFor(job)
    : { loading: false, awaiting: false, creatorName: null };

  const { organisationMap, isLoading: organisationLoading } = useOrganisationsByIds(
    job?.organisation_uuid ? [job.organisation_uuid] : []
  );
  const organisation = job?.organisation_uuid ? organisationMap[job.organisation_uuid] : undefined;

  const { courseMap } = useCoursesByIds(job?.course_uuid && !job.program_uuid ? [job.course_uuid] : []);
  const { programMap } = useProgramsByIds(job?.program_uuid ? [job.program_uuid] : []);
  const course = job?.course_uuid ? courseMap[job.course_uuid] : undefined;
  const program = job?.program_uuid ? programMap[job.program_uuid] : undefined;
  const contentTitle = program?.title ?? course?.name ?? null;
  const creatorUuid = program?.course_creator_uuid ?? course?.course_creator_uuid;
  const { courseCreatorMap } = useCourseCreatorsByIds(creatorUuid ? [creatorUuid] : []);
  const creatorName =
    (creatorUuid && courseCreatorMap[creatorUuid]?.full_name) || pendingRate.creatorName;

  const organisationJobs = useQuery({
    ...listJobsOptions({
      query: {
        organisation_uuid: job?.organisation_uuid ?? '',
        status: 'open',
        pageable: { page: 0, size: 1 },
      },
    }),
    enabled: Boolean(job?.organisation_uuid),
    staleTime: STALE_TIMES.live,
  });
  const organisationOpenTotal = organisationJobs.data?.data?.metadata?.totalElements;
  const moreFromOrganisation =
    organisationOpenTotal == null
      ? undefined
      : Math.max(0, Number(organisationOpenTotal) - (job?.status === 'open' ? 1 : 0));

  const readiness = job
    ? jobReadiness({
        job,
        eligibility,
        application: listed,
        pendingRate: pendingRate.awaiting,
        creatorName,
        contentTitle,
        now,
      })
    : null;
  const rate = eligibility ? rateStandingFor(eligibility, pendingRate) : null;

  return {
    jobQuery,
    job,
    facts,
    open,
    eligibilityQuery,
    eligibility,
    application,
    applicationStatus: applied ? status : null,
    readiness,
    rate,
    pendingRate,
    organisation,
    organisationLoading,
    contentTitle,
    creatorName,
    moreFromOrganisation,
  };
}

export type JobPageData = ReturnType<typeof useJobPage>;
