'use client';

import { useQuery } from '@tanstack/react-query';
import { useDeferredValue, useMemo, useState } from 'react';

import { SectionCard } from '@/app/dashboard/admin/_components/ui';
import { AsyncSection } from '@/components/data/async-section';
import { useInstructorsByIds } from '@/hooks/use-batched-lookups';
import type { ClassMarketplaceJob, ClassMarketplaceJobApplication } from '@/services/client';
import { listJobApplicationsOptions } from '@/services/client/@tanstack/react-query.gen';
import {
  ApplicationListSkeleton,
  type ApplicationStatusFilter,
  ApplicationsEmptyState,
  ApplicationsFilterBar,
  ApplicationsListSection,
} from './OrganisationJobApplicationsSections';

const APPLICATION_PAGE = { page: 0, size: 100 };

export const jobApplicationsQueryOptions = (jobUuid: string) =>
  listJobApplicationsOptions({ path: { jobUuid }, query: { pageable: APPLICATION_PAGE } });

/** Everyone who applied to one job, with where they stand; decisions happen on each applicant. */
export function JobApplicantsPanel({
  jobUuid,
  job,
  applicantHref,
}: {
  jobUuid: string;
  job: ClassMarketplaceJob | null;
  applicantHref: (application: ClassMarketplaceJobApplication) => string;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatusFilter>('ALL');

  const applicationsQuery = useQuery({
    ...jobApplicationsQueryOptions(jobUuid),
    enabled: Boolean(jobUuid),
  });
  const applications = useMemo<ClassMarketplaceJobApplication[]>(
    () => applicationsQuery.data?.data?.content ?? [],
    [applicationsQuery.data]
  );
  const instructorUuids = useMemo(
    () => applications.map(application => application.instructor_uuid ?? '').filter(Boolean),
    [applications]
  );
  const { instructorMap, isLoading: isInstructorsLoading } = useInstructorsByIds(instructorUuids);

  const filteredApplications = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return applications.filter(application => {
      const instructor = application.instructor_uuid
        ? instructorMap[application.instructor_uuid]
        : null;
      const searchable = [
        instructor?.full_name,
        instructor?.professional_headline,
        application.application_note,
        application.review_notes,
        application.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesStatus =
        statusFilter === 'ALL' || (application.status as string) === (statusFilter as string);
      return (!query || searchable.includes(query)) && matchesStatus;
    });
  }, [applications, deferredSearch, instructorMap, statusFilter]);

  return (
    <SectionCard
      title='Applicants'
      description='Open an applicant to review, hire or turn them down.'
      bodyClassName='space-y-4'
    >
      <ApplicationsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
      <AsyncSection
        loading={applicationsQuery.isLoading && !applicationsQuery.data}
        error={applicationsQuery.error}
        empty={filteredApplications.length === 0}
        onRetry={() => applicationsQuery.refetch()}
        skeleton={<ApplicationListSkeleton />}
        errorTitle='Couldn’t load applicants'
        emptyState={<ApplicationsEmptyState />}
      >
        <ApplicationsListSection
          applications={filteredApplications}
          instructorMap={instructorMap}
          isInstructorsLoading={isInstructorsLoading}
          jobInstructorPay={job?.instructor_pay}
          jobStatus={job?.status}
          applicantHref={applicantHref}
        />
      </AsyncSection>
    </SectionCard>
  );
}
