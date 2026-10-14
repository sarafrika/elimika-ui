'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { isApplicantTrainingRequirement } from '@/app/dashboard/organisation/courses/apply/[courseId]/_components/apply-model';
import { STALE_TIMES } from '@/lib/query-client';
import type { CourseTrainingRequirement, ProgramRequirement } from '@/services/client';
import { getProgramRequirementsOptions } from '@/services/client/@tanstack/react-query.gen';
import { allCourseTrainingRequirementsOptions } from '@/services/course-training-requirements';
import type { ApplyKind } from './types';

const REQUIREMENT_PAGE_SIZE = 200;

/** A course's requirements the instructor provides, or a programme's published list. */
export function useItemRequirements(kind: ApplyKind | null, uuid: string | null, enabled = true) {
  const forCourse = enabled && kind === 'course' && Boolean(uuid);
  const forProgram = enabled && kind === 'program' && Boolean(uuid);

  const courseQuery = useQuery({
    ...allCourseTrainingRequirementsOptions(forCourse ? (uuid ?? undefined) : undefined),
    enabled: forCourse,
    staleTime: STALE_TIMES.entity,
  });
  const programQuery = useQuery({
    ...getProgramRequirementsOptions({
      path: { programUuid: uuid ?? '' },
      query: { pageable: { page: 0, size: REQUIREMENT_PAGE_SIZE } },
    }),
    enabled: forProgram,
    staleTime: STALE_TIMES.entity,
  });

  const courseRequirements = useMemo<CourseTrainingRequirement[]>(
    () =>
      (courseQuery.data?.data?.content ?? []).filter(requirement =>
        isApplicantTrainingRequirement(requirement, 'instructor')
      ),
    [courseQuery.data]
  );
  const programRequirements = useMemo<ProgramRequirement[]>(
    () => programQuery.data?.data?.content ?? [],
    [programQuery.data]
  );

  const query = kind === 'program' ? programQuery : courseQuery;
  return {
    courseRequirements,
    programRequirements,
    loading: (forCourse || forProgram) && query.isLoading,
    error: forCourse || forProgram ? query.error : null,
    refetch: () => void query.refetch(),
  };
}
