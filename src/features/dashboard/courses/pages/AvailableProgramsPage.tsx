'use client';

import { addYears } from 'date-fns';
import { useEffect, useState } from 'react';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import useProgramBundledClassInfo from '@/hooks/use-program-classes';
import { AvailabilityListingLayout } from '@/src/features/dashboard/courses/components/availability-listing-layout';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
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
