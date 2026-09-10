'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BriefcaseBusiness } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { AdminPageHeader, adminTheme, SectionCard } from '@/app/dashboard/admin/_components/ui';
import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  useCoursesByIds,
  useInstructorsByIds,
  useProgramsByIds,
} from '@/hooks/use-batched-lookups';
import { cn } from '@/lib/utils';
import type { ClassMarketplaceJob, ClassMarketplaceJobApplication } from '@/services/client';
import {
  listJobApplicationsOptions,
  listJobsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { roleScopedDashboardPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';
import { isClassCreatedStatus, isExitStatus, nextStepFor } from '../application-status';
import {
  ApplicationListSkeleton,
  ApplicationStatsCards,
  type ApplicationStatusFilter,
  ApplicationsEmptyState,
  ApplicationsFilterBar,
  ApplicationsListSection,
  JobOverviewPanel,
} from './OrganisationJobApplicationsSections';

type JobApplicationsPageProps = {
  jobUuid: string;
};

type ClassMarketplaceJobWithProgram = ClassMarketplaceJob & {
  readonly program_uuid?: string | null;
};

const JOB_PAGE_SIZE = 50;
const APPLICATION_PAGE_SIZE = 100;

function shortId(value?: string | null) {
  if (!value) return 'Unknown';
  return value.slice(0, 8);
}

function getJobProgramUuid(job?: ClassMarketplaceJobWithProgram | null) {
  return job?.program_uuid ?? null;
}

export function OrganisationJobApplicationsPage({ jobUuid }: JobApplicationsPageProps) {
  const { activeDomain } = useUserDomain();
  const router = useRouter();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatusFilter>('ALL');
  const jobsListOptions = {
    query: {
      organisation_uuid: organisationUuid,
      pageable: { page: 0, size: JOB_PAGE_SIZE },
    },
  };
  const applicationsListOptions = {
    path: { jobUuid },
    query: {
      pageable: { page: 0, size: APPLICATION_PAGE_SIZE },
    },
  };

  const { data: jobsResponse, isLoading: isJobsLoading } = useQuery({
    ...listJobsOptions(jobsListOptions),
    enabled: Boolean(organisationUuid),
  });

  const job: ClassMarketplaceJobWithProgram | null =
    (jobsResponse?.data?.content ?? []).find(
      (item: ClassMarketplaceJob) => item.uuid === jobUuid
    ) ?? null;

  const applicationsQuery = useQuery({
    ...listJobApplicationsOptions(applicationsListOptions),
    enabled: Boolean(jobUuid),
  });

  const applications: ClassMarketplaceJobApplication[] =
    applicationsQuery.data?.data?.content ?? [];
  const isApplicationsLoading = applicationsQuery.isLoading && !applicationsQuery.data;
  const instructorUuids = useMemo(
    () => applications.map(application => application.instructor_uuid ?? '').filter(Boolean),
    [applications]
  );
  const { instructorMap, isLoading: isInstructorsLoading } = useInstructorsByIds(instructorUuids);
  const programUuid = getJobProgramUuid(job);
  const { courseMap } = useCoursesByIds(job?.course_uuid ? [job.course_uuid] : []);
  const { programMap } = useProgramsByIds(programUuid ? [programUuid] : []);
  const contentLabel = programUuid
    ? (programMap[programUuid]?.title ?? `Program ${shortId(programUuid)}`)
    : job?.course_uuid
      ? (courseMap[job.course_uuid]?.name ?? `Course ${shortId(job.course_uuid)}`)
      : 'Course or program';

  const createClassHref = roleScopedDashboardPath(
    activeDomain,
    `/dashboard/opportunities/${jobUuid}/create-class`
  );

  const applicantHref = (application: ClassMarketplaceJobApplication) =>
    roleScopedDashboardPath(
      activeDomain,
      `/dashboard/opportunities/${jobUuid}/applications/${application.uuid}`
    );

  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return applications.filter(application => {
      const instructor = application.instructor_uuid
        ? instructorMap[application.instructor_uuid]
        : null;
      const searchable = [
        instructor?.full_name,
        instructor?.professional_headline,
        instructor?.website,
        instructor?.bio,
        application.application_note,
        application.review_notes,
        application.status,
        application.instructor_uuid,
        job?.title,
        contentLabel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus =
        statusFilter === 'ALL' || (application.status as string) === (statusFilter as string);
      return matchesSearch && matchesStatus;
    });
  }, [applications, contentLabel, instructorMap, job?.title, searchQuery, statusFilter]);

  const stats = useMemo(
    () => ({
      total: applications.length,
      // Everyone still moving through the funnel, not just those yet to be looked at.
      inReview: applications.filter(application => nextStepFor(application.status)).length,
      // The cast carries the generated client, whose funnel still predates the backend's `hired`.
      hired: applications.filter(application => (application.status as string) === 'hired').length,
      classCreated: applications.filter(application => isClassCreatedStatus(application.status))
        .length,
      closed: applications.filter(application => isExitStatus(application.status)).length,
    }),
    [applications]
  );

  // Hiring is the last decision; the class is the next act, and creating it is what puts the
  // instructor on the job. This banner points at that act rather than at a missing Assign click.
  const jobStatus = job?.status as string | undefined;
  const hasHiredApplicant = applications.some(
    application => (application.status as string) === 'hired'
  );
  const showCreateClassBanner = hasHiredApplicant || jobStatus === 'awaiting_class';

  if (!organisationUuid) {
    return (
      <div className={cn(adminTheme.page, 'max-w-3xl')}>
        <Button
          variant='ghost'
          className='text-muted-foreground mb-4 px-0'
          onClick={() => router.back()}
        >
          <ArrowLeft className='mr-2 size-4' />
          Back to opportunities
        </Button>
        <EmptyState
          icon={BriefcaseBusiness}
          title='Organisation profile not available'
          description='An active organisation profile is required before class job applications can be reviewed.'
          action={
            <Button asChild variant='outline'>
              <Link href={roleScopedDashboardPath(activeDomain, '/dashboard/opportunities')}>
                View class jobs
              </Link>
            </Button>
          }
          variant='card'
        />
      </div>
    );
  }

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <Button
          variant='ghost'
          size='sm'
          className='text-muted-foreground w-fit px-0'
          onClick={() => router.back()}
        >
          <ArrowLeft className='mr-2 size-4' />
          Back to opportunities
        </Button>

        <AdminPageHeader
          title={
            isJobsLoading && !jobsResponse ? 'Job applications' : (job?.title ?? 'Job applications')
          }
          description='See where every applicant stands. Open an applicant to decide on them.'
        />

        {showCreateClassBanner ? (
          <div className='border-primary/40 bg-primary/5 flex flex-wrap items-center gap-3 rounded-md border p-4'>
            <BriefcaseBusiness className='text-primary size-5 shrink-0' />
            <div className='min-w-0 text-sm'>
              <div className='text-foreground font-medium'>An instructor is hired</div>
              <p className='text-muted-foreground'>
                They have joined your organisation. Creating the class puts them on this job and
                confirms the venue and equipment their application reserved.
              </p>
            </div>
            <Button asChild size='sm' className='ml-auto'>
              <Link href={createClassHref}>Create the class</Link>
            </Button>
          </div>
        ) : null}

        <ApplicationStatsCards isLoading={isApplicationsLoading} stats={stats} />

        <div className='grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]'>
          <SectionCard title='Applicants' bodyClassName='space-y-4'>
            <ApplicationsFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />

            <AsyncSection
              loading={isApplicationsLoading}
              error={applicationsQuery.error}
              empty={!filteredApplications.length}
              onRetry={() => applicationsQuery.refetch()}
              skeleton={<ApplicationListSkeleton />}
              errorTitle='Couldn’t load applications'
              emptyState={<ApplicationsEmptyState />}
            >
              <ApplicationsListSection
                applications={filteredApplications}
                instructorMap={instructorMap}
                isInstructorsLoading={isInstructorsLoading}
                jobInstructorPay={job?.instructor_pay}
                applicantHref={applicantHref}
              />
            </AsyncSection>
          </SectionCard>

          <JobOverviewPanel
            job={job}
            contentLabel={contentLabel}
            organisationUuid={organisation?.uuid}
            isLoading={isJobsLoading && !jobsResponse}
          />
        </div>
      </div>
    </div>
  );
}
