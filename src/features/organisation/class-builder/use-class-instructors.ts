'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import type { PreviewWindow } from '@/components/class-form';
import { extractList } from '@/lib/api-helpers';
import type { RateCard } from '@/lib/rate-card';
import type { OrgInstructorSummary } from '@/services/client';
import {
  checkAvailabilityOptions,
  getOrganisationInstructorSummariesOptions,
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';

export type ClassInstructor = {
  uuid: string;
  name: string;
  email?: string | null;
  /** Null when the API withholds the instructor's private rate card. */
  rateCard?: RateCard | null;
};

// Enough sessions to catch a weekly clash without flooding the API; publish re-checks them all.
const CHECKED_WINDOWS = 6;
const APPROVED = { applicant_type_eq: 'instructor', status_eq: 'approved' };

function useDebounced<T>(value: T, ms: number) {
  const [current, setCurrent] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setCurrent(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return current;
}

/**
 * The organisation's instructors approved to teach the offering, with their approved rate card,
 * and which of them are busy during the first sessions of the schedule.
 */
export function useClassInstructors({
  organisationUuid,
  offering,
  windows,
}: {
  organisationUuid: string;
  offering: string;
  windows: PreviewWindow[];
}) {
  const [kind = '', offeringUuid = ''] = offering.split(':');

  const rosterQuery = useQuery({
    ...getOrganisationInstructorSummariesOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const courseQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: { ...APPROVED, course_uuid_eq: offeringUuid },
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled: kind === 'course' && Boolean(offeringUuid),
  });
  const programQuery = useQuery({
    ...searchProgramTrainingApplicationsOptions({
      query: {
        searchParams: { ...APPROVED, program_uuid_eq: offeringUuid },
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled: kind === 'program' && Boolean(offeringUuid),
  });
  const approvals = kind === 'program' ? programQuery : courseQuery;

  const instructors = useMemo<ClassInstructor[]>(() => {
    const cards = new Map<string, RateCard | null>();
    for (const row of approvals.data?.data?.content ?? []) {
      if (row.applicant_uuid) cards.set(row.applicant_uuid, row.rate_card ?? null);
    }
    return extractList<OrgInstructorSummary>(rosterQuery.data)
      .filter(row => row.instructor_uuid && cards.has(row.instructor_uuid))
      .map(row => ({
        uuid: row.instructor_uuid as string,
        name: row.full_name || row.email || 'Instructor',
        email: row.email,
        rateCard: cards.get(row.instructor_uuid as string),
      }));
  }, [rosterQuery.data, approvals.data]);

  const checked = useDebounced(windows.slice(0, CHECKED_WINDOWS), 500);
  const checks = useQueries({
    queries: instructors.flatMap(instructor =>
      checked.map(window =>
        checkAvailabilityOptions({
          path: { instructorUuid: instructor.uuid },
          query: { start: window.start, end: window.end },
        })
      )
    ),
  });

  const busy = useMemo(() => {
    const result = new Set<string>();
    instructors.forEach((instructor, i) => {
      const slice = checks.slice(i * checked.length, (i + 1) * checked.length);
      if (slice.some(check => check.data?.data === false)) result.add(instructor.uuid);
    });
    return result;
  }, [instructors, checks, checked.length]);

  return {
    instructors,
    busy,
    checking: checks.some(check => check.isFetching),
    loading: rosterQuery.isLoading || approvals.isLoading,
    error: rosterQuery.error ?? approvals.error,
  };
}
