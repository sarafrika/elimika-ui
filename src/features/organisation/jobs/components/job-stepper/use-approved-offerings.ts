'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Offering } from '@/components/class-form';
import {
  useCourseCreatorsByIds,
  useCoursesByIds,
  useProgramsByIds,
} from '@/hooks/use-batched-lookups';
import { APPROVAL_QUERY_FRESHNESS } from '@/lib/query-client';
import {
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';

const APPLICATIONS_PAGE = { page: 0, size: 100 };

/** The organisation's own approved courses and programs, each with its approved rate card. */
export function useApprovedOfferings(organisationUuid: string) {
  const searchParams = {
    applicant_uuid_eq: organisationUuid,
    applicant_type_eq: 'organisation',
    status_eq: 'approved',
  };
  const coursesQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: { searchParams, pageable: APPLICATIONS_PAGE },
    }),
    ...APPROVAL_QUERY_FRESHNESS,
    enabled: Boolean(organisationUuid),
  });
  const programsQuery = useQuery({
    ...searchProgramTrainingApplicationsOptions({
      query: { searchParams, pageable: APPLICATIONS_PAGE },
    }),
    ...APPROVAL_QUERY_FRESHNESS,
    enabled: Boolean(organisationUuid),
  });

  const courseApplications = useMemo(
    () =>
      (coursesQuery.data?.data?.content ?? []).filter(
        (row): row is typeof row & { course_uuid: string } => Boolean(row.course_uuid)
      ),
    [coursesQuery.data]
  );
  const programApplications = useMemo(
    () =>
      (programsQuery.data?.data?.content ?? []).filter(
        (row): row is typeof row & { program_uuid: string } => Boolean(row.program_uuid)
      ),
    [programsQuery.data]
  );

  const courseUuids = useMemo(
    () => courseApplications.map(row => row.course_uuid),
    [courseApplications]
  );
  const programUuids = useMemo(
    () => programApplications.map(row => row.program_uuid),
    [programApplications]
  );
  const { courseMap } = useCoursesByIds(courseUuids);
  const { programMap } = useProgramsByIds(programUuids);

  const offerings: Offering[] = useMemo(
    () => [
      ...courseApplications.map(row => {
        const course = courseMap[row.course_uuid];
        return {
          value: `course:${row.course_uuid}`,
          label: course?.name ?? `Course ${row.course_uuid.slice(0, 8)}`,
          kind: 'Course' as const,
          categoryNames: (course?.category_names ?? []) as string[],
          rateCard: row.rate_card,
          applicationUuid: row.uuid,
          pendingRateUpdateUuid: row.pending_rate_update_uuid,
          minimumFee: course?.minimum_training_fee,
          creatorUuid: course?.course_creator_uuid,
        };
      }),
      ...programApplications.map(row => {
        const program = programMap[row.program_uuid];
        return {
          value: `program:${row.program_uuid}`,
          label: program?.title ?? `Program ${row.program_uuid.slice(0, 8)}`,
          kind: 'Program' as const,
          categoryNames: [],
          categoryUuid: program?.category_uuid ?? undefined,
          rateCard: row.rate_card,
          applicationUuid: row.uuid,
          pendingRateUpdateUuid: row.pending_rate_update_uuid,
          creatorUuid: program?.course_creator_uuid,
        };
      }),
    ],
    [courseApplications, programApplications, courseMap, programMap]
  );

  const creatorUuids = useMemo(
    () => Array.from(new Set(offerings.map(offering => offering.creatorUuid ?? ''))),
    [offerings]
  );
  const { courseCreatorMap } = useCourseCreatorsByIds(creatorUuids);

  return {
    offerings,
    creatorNameFor: (offering?: Offering) =>
      offering?.creatorUuid ? courseCreatorMap[offering.creatorUuid]?.full_name : undefined,
    loading: coursesQuery.isLoading || programsQuery.isLoading,
    error: coursesQuery.error ?? programsQuery.error,
    refetch: () => Promise.all([coursesQuery.refetch(), programsQuery.refetch()]),
  };
}
