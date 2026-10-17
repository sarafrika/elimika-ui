'use client';

import { toNumber } from '@/lib/metrics';
import { useMemo } from 'react';
import ApprovedPartnersTable, { type ApprovedPartnerSource } from './ApprovedPartnersTable';
import { useApprovedInstructorClasses } from './useApprovedInstructorClasses';
import { useApprovedOrganisationDirectory } from './useApprovedOrganisationDirectory';
import { useCreatorInstructors } from './useCreatorInstructors';

export default function AllApprovedPartners() {
  const instructors = useCreatorInstructors();
  const organisations = useApprovedOrganisationDirectory();
  const classData = useApprovedInstructorClasses(
    instructors.instructorIds,
    instructors.courseIds,
    instructors.programIds
  );
  const rows = useMemo(
    () =>
      instructors.instructors.map(instructor => {
        const courses = new Set(instructor.courseIds);
        const programs = new Set(instructor.programIds);
        const classes = classData.classes.filter(
          item =>
            item.default_instructor_uuid === instructor.uuid &&
            ((item.course_uuid && courses.has(item.course_uuid)) ||
              (item.program_uuid && programs.has(item.program_uuid)))
        );
        const partial = classData.hasError || classData.hasNextPage;
        const counts = classes.map(item =>
          item.uuid ? classData.classMap[item.uuid]?.enrolled_count : undefined
        );
        return {
          uuid: instructor.uuid,
          type: 'instructor' as const,
          name: instructor.name,
          subtitle: instructor.profile?.professional_headline,
          offerings: instructor.offerings.map(offering => ({
            ...offering,
            trainerShare: offering.instructorShare,
          })),
          classCount: classData.hasError && classes.length === 0 ? null : classes.length,
          studentCount:
            partial || classData.countsError || counts.some(count => count == null)
              ? null
              : counts.reduce<number>((total, count) => total + toNumber(count), 0),
          countsLoading: instructors.isLoading || classData.isLoading,
          studentsLoading: classData.countsLoading,
          classesPartial: partial,
          href: `/dashboard/course-creator/instructors/${encodeURIComponent(instructor.uuid)}`,
        };
      }),
    [
      instructors.instructors,
      instructors.isLoading,
      classData.classes,
      classData.classMap,
      classData.hasError,
      classData.hasNextPage,
      classData.countsError,
      classData.isLoading,
      classData.countsLoading,
    ]
  );
  const freelancers: ApprovedPartnerSource = {
    type: 'instructor',
    rows,
    isLoading: instructors.isLoading,
    hasProfile: instructors.hasProfile,
    hasError: instructors.hasError || classData.hasError || classData.countsError,
    hasNextPage: instructors.hasNextPage,
    isFetching: instructors.isFetching,
    isFetchingNextPage: instructors.isFetchingNextPage,
    refetch: () => Promise.all([instructors.refetch(), classData.refetch()]),
    loadMore: instructors.loadMore,
    hasMoreClasses: classData.hasNextPage,
    classesFetching: classData.isFetching,
    loadMoreClasses: classData.loadMore,
  };

  return <ApprovedPartnersTable sources={[freelancers, organisations]} />;
}
