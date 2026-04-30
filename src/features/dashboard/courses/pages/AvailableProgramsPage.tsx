'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import useProgramBundledClassInfo from '@/hooks/use-program-classes';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { AvailabilityListingLayout } from '@/src/features/dashboard/courses/components/availability-listing-layout';
import { useDateRangeFilter } from '@/src/features/dashboard/courses/hooks/use-date-range-filter';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useEffect } from 'react';
import type { BundledClass } from '../types';

export default function AvailableProgramsPage({ programId }: { programId: string }) {
  const { activeDomain } = useUserDomain();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const student = useStudent();

  useEffect(() => {
    if (!programId) return;

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
        id: 'program-details',
        title: 'Available programs',
        url: buildWorkspaceAliasPath(
          activeDomain,
          `/dashboard/courses/available-programs/${programId}`
        ),
      },
    ]);
  }, [replaceBreadcrumbs, programId, activeDomain]);

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

  const { classes = [], loading } = useProgramBundledClassInfo(
    programId,
    appliedStart ?? undefined,
    appliedEnd ?? undefined,
    student
  );

  const cardClasses: BundledClass[] = classes.map(cls => ({
    ...cls,
    course: cls.course?.[0] ?? null,
  }));

  return (
    <AvailabilityListingLayout
      appliedEnd={appliedEnd}
      appliedStart={appliedStart}
      dateError={dateError}
      emptyDescription="It looks like this program doesn't have any open class sessions yet."
      emptyTitle='No Program Sessions Available'
      endDateInput={endDateInput}
      heading='Review available sessions for this program'
      helperText='Browse scheduled program cohorts, compare instructors and pricing, then continue into enrollment from the same streamlined workspace.'
      isLoading={loading}
      items={cardClasses}
      onApplyDates={applyDates}
      onClearDates={clearDates}
      onEnroll={selectedClass => {
        window.location.href = buildWorkspaceAliasPath(
          activeDomain,
          `/dashboard/courses/available-programs/${programId}/enroll?id=${selectedClass.uuid}`
        );
      }}
      setEndDateInput={setEndDateInput}
      setStartDateInput={setStartDateInput}
      startDateInput={startDateInput}
      subheading='Available programs'
    />
  );
}
