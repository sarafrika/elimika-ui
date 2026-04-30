'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import useBundledClassInfo from '@/hooks/use-course-classes';
import { listCatalogItemsOptions } from '@/services/client/@tanstack/react-query.gen';
import { AvailabilityListingLayout } from '@/src/features/dashboard/courses/components/availability-listing-layout';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { useDateRangeFilter } from '@/src/features/dashboard/courses/hooks/use-date-range-filter';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';

export default function AvailableClassesPage({ courseId }: { courseId: string }) {
  const { activeDomain } = useUserDomain();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const student = useStudent();

  useEffect(() => {
    if (!courseId) return;

    replaceBreadcrumbs([
      {
        id: 'dashboard',
        title: 'Dashboard',
        url: buildWorkspaceAliasPath(activeDomain, '/dashboard/overview'),
      },
      {
        id: 'courses',
        title: 'Browse Courses',
        url: buildWorkspaceAliasPath(activeDomain, '/dashboard/courses'),
      },
      {
        id: 'course-details',
        title: 'Available classes',
        url: buildWorkspaceAliasPath(activeDomain, `/dashboard/courses/available-classes/${courseId}`),
      },
    ]);
  }, [replaceBreadcrumbs, courseId, activeDomain]);

  const {
    startDateInput,
    endDateInput,
    setStartDateInput,
    setEndDateInput,
    appliedStart,
    appliedEnd,
    dateError,
    applyDates,
    clearDates,
  } = useDateRangeFilter();

  const { data: catalogues } = useQuery({
    ...listCatalogItemsOptions(),
    staleTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { classes = [], loading } = useBundledClassInfo(
    courseId,
    appliedStart ?? undefined,
    appliedEnd ?? undefined,
    student
  );

  const filteredClasses = classes.filter(cls =>
    catalogues?.data?.some(cat => cat.class_definition_uuid === cls.uuid)
  );

  return (
    <AvailabilityListingLayout
      appliedEnd={appliedEnd}
      appliedStart={appliedStart}
      dateError={dateError}
      emptyDescription="It looks like this course doesn't have any classes yet."
      emptyTitle='No Classes Available'
      endDateInput={endDateInput}
      heading='Find the right class session for this course'
      helperText='Review upcoming class windows, compare instructors and pricing, then continue into enrollment from a more focused shortlist.'
      isLoading={loading}
      items={filteredClasses}
      onApplyDates={applyDates}
      onClearDates={clearDates}
      onEnroll={selectedClass => {
        window.location.href = buildWorkspaceAliasPath(
          activeDomain,
          `/dashboard/courses/available-classes/${courseId}/enroll?id=${selectedClass.uuid}`
        );
      }}
      setEndDateInput={setEndDateInput}
      setStartDateInput={setStartDateInput}
      startDateInput={startDateInput}
      subheading='Available classes'
    />
  );
}
