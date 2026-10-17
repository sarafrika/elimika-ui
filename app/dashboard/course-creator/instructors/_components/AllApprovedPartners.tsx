'use client';

import { useMemo } from 'react';
import ApprovedPartnersTable, { type ApprovedPartnerSource } from './ApprovedPartnersTable';
import { useApprovedOrganisationDirectory } from './useApprovedOrganisationDirectory';
import { useCreatorInstructors } from './useCreatorInstructors';

export default function AllApprovedPartners() {
  const instructors = useCreatorInstructors();
  const organisations = useApprovedOrganisationDirectory();
  const rows = useMemo(
    () =>
      instructors.instructors.map(instructor => ({
        uuid: instructor.uuid,
        type: 'instructor' as const,
        name: instructor.name,
        subtitle: instructor.profile?.professional_headline,
        offerings: instructor.offerings,
        href: `/dashboard/course-creator/instructors/${encodeURIComponent(instructor.uuid)}`,
      })),
    [instructors.instructors]
  );
  const freelancers: ApprovedPartnerSource = {
    type: 'instructor',
    rows,
    isLoading: instructors.isLoading,
    hasProfile: instructors.hasProfile,
    hasError: instructors.hasError,
    hasNextPage: instructors.hasNextPage,
    isFetching: instructors.isFetching,
    isFetchingNextPage: instructors.isFetchingNextPage,
    refetch: instructors.refetch,
    loadMore: instructors.loadMore,
  };

  return <ApprovedPartnersTable sources={[freelancers, organisations]} />;
}
