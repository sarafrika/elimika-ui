'use client';

import { useQuery } from '@tanstack/react-query';
import { addYears } from 'date-fns';
import { useEffect, useState } from 'react';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import useBundledClassInfo from '@/hooks/use-course-classes';
import { listCatalogItemsOptions } from '@/services/client/@tanstack/react-query.gen';
import { AvailabilityListingLayout } from '@/src/features/dashboard/courses/components/availability-listing-layout';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
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

  const today = new Date();
  const defaultStartDate = today;
  const defaultEndDate = addYears(today, 1);

  const toInputDate = (date: Date) => date.toISOString().slice(0, 10);
  const [startDateInput, setStartDateInput] = useState<string>(toInputDate(defaultStartDate));
  const [endDateInput, setEndDateInput] = useState<string>(toInputDate(defaultEndDate));
  const [appliedStart, setAppliedStart] = useState<string>(toInputDate(defaultStartDate));
  const [appliedEnd, setAppliedEnd] = useState<string>(toInputDate(defaultEndDate));
  const [dateError, setDateError] = useState<string | null>(null);

  const applyDates = () => {
    setDateError(null);

    if (!startDateInput || !endDateInput) {
      setDateError('Please select both start and end dates.');
      return;
    }

    const start = new Date(startDateInput);
    const end = new Date(endDateInput);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setDateError('Invalid date format.');
      return;
    }

    if (start > end) {
      setDateError('Start date must be before end date.');
      return;
    }

    setAppliedStart(startDateInput);
    setAppliedEnd(endDateInput);
  };

  const clearDates = () => {
    const start = toInputDate(defaultStartDate);
    const end = toInputDate(defaultEndDate);

    setStartDateInput(start);
    setEndDateInput(end);
    setAppliedStart(start);
    setAppliedEnd(end);
    setDateError(null);
  };

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
